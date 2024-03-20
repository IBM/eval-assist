import random
from genai.schema import TextGenerationParameters, TextGenerationReturnOptions
from genai import Credentials, Client
import math
import re
import itertools
from dotenv import load_dotenv
import os
from langchain.prompts import PromptTemplate
from collections import defaultdict

from db_client import db 

load_dotenv()

BAM_API_KEY = os.getenv("GENAI_KEY", None)
BAM_API_URL = os.getenv("GENAI_API", None)
client = Client(credentials=Credentials(api_key=BAM_API_KEY, api_endpoint=BAM_API_URL))


def to_percent(value, total):
        return ((value - 0) * 100) / (total - 0)

def update_progress(evaluation, progress, tasks_count):
    progress_percentage = to_percent(progress, tasks_count)
    db.run.update(
        where={
            'id': evaluation.run.id,
        },
        data={
            "progress": progress_percentage
        }
    )

def write_output(example, model, outputStr):
    return db.output.create(
        data={
            "text": outputStr,
            "modelId" : model.id,
            "exampleId" : example.id,
        }
    )

def generate_text(model_name, prompt, params): 
    responses = list(
                client.text.generation.create(
                    model_id=model_name,
                    inputs=[prompt],
                    parameters=params
                )
            )
    output_str = responses[0].results[0].generated_text
    return output_str


def get_task_count(models_to_eval, num_examples):
    # n: models count
    n = len(models_to_eval)

    # number of models the evaluator compares each time
    k = 2

    n_pick_k = math.factorial(n) // (math.factorial(k) * math.factorial(n-k))
    
    # evaluator models output count, it is doubled because of the positional bias check
    tasks_count = n_pick_k * num_examples * 2

    # evaluated models output count
    tasks_count += (n * num_examples)
    return tasks_count

def get_judgement_answer(judgement: str):
    if judgement[0].isdigit():
            selected_answer = int(judgement[0])
            if selected_answer == 1 or selected_answer == 2:
                return selected_answer
    print('evaluator didnt choose any answer')
    print(f'it returned {judgement} instead')
    return -1


def get_winning_output(judgements, output_1, output_2):
    winning_outputs = [output_1 if get_judgement_answer(x) == 1 else output_2 for x in judgements]
    if winning_outputs[0].id == winning_outputs[1].id: 
        return winning_outputs[0]
    else: 
        print('evaluation output winner disagree, returning output 1 by default')
        print([x.id for x in winning_outputs])
        return winning_outputs[0]


def update_contest(winner_output, contest_data, wins):
    contest_data["winningOutputId"] = winner_output.id
    wins[winner_output.id] += 1

# Setup infrastructure for manual review
def setup_manual_review(evaluation):
    return db.review.create(
        data={
            "evaluationId": evaluation.id
        }
    )

def set_eval_winners(run_id, review_id, example_output_wins):

    examples = db.example.find_many(
        where={
        'runId': run_id,
    })

    random.shuffle(examples)

    for e in examples:
        db.reviewexample.create(
            data={
            'reviewId': review_id,
            'exampleId': e.id,
            'bestEvalOutputId': example_output_wins[e.id]
        })

def finish_evaluation(run_id):
    print("Finishing evaluation")
    db.run.update(
        where={
            'id': run_id,
        },
        data={
            "state": "finished"
        }
    )

def handle_run_error(run_id):
    print("Finishing failed evaluation")
    db.run.update(
        where={
            'id': run_id,
        },
        data={
            "state": "error"
        }
    )


def judgements_generator(
        evaluation_template, 
        task_prompt, 
        output_1, 
        output_2, 
        eval_criteria, 
        evaluator_model, 
        eval_params
    ):
    """Generates the evaluator output. In order to detect positional bias
    the evaluator is ran twice, each time with the outputs of the evaluated
    two models in different order

    Note: this is implemented as a generator to know when the first judgement
    was generated in order to update the progress accordingly

    Returns:
        [str,str]: the generated outputs by the evaluator
    """

    eval_prompt_1 = evaluation_template.format(
                                                prompt = task_prompt, 
                                                output_1 = output_1.text, 
                                                output_2 = output_2.text,
                                                eval_criteria = eval_criteria
                                            )
    eval_prompt_2 = evaluation_template.format(
                                                prompt = task_prompt, 
                                                output_1 = output_2.text, 
                                                output_2 = output_1.text,
                                                eval_criteria = eval_criteria
                                            )
    
    output_1 = generate_text(evaluator_model, eval_prompt_1, eval_params).strip()
    yield output_1

    output_2 = generate_text(evaluator_model, eval_prompt_2, eval_params).strip()
    yield output_2

            
def clean_evaluation_state(evaluation_id: int):
    print(f'Cleaning evaluation: deleting run, examples, reviewExamples, contest, output, review') 

    run = db.run.find_unique(
        where={
        'evaluationId': evaluation_id,
        }
    )
    db.contest.delete_many(
        where={
            "runId": run.id
        }
    )
    examples = db.example.find_many(
        where={
            "runId": run.id
        }
    )
    db.reviewexample.delete_many(
        where={
            "exampleId": {"in": [e.id for e in examples]}
        }
    )
    db.review.delete_many(
        where={
            "evaluationId": evaluation_id
        }
    )
    db.output.delete_many(
        where={
            "exampleId": {"in": [e.id for e in examples]}
        }
    )
    db.example.delete_many(
        where={
            "runId": run.id
        }
    )
    db.run.delete_many(
        where={
            "id": run.id
        }
    )

# Run an evaluation
def run_evaluation(evaluation_id: int):
    try: 

        # Get the evaluation from db 
        evaluation = db.evaluation.find_unique(
            where={
            'id': evaluation_id,
            }, 
            include={
                "run": True,
                "aimodels": True,
                "dataset": True
            }
        )

        task_params = TextGenerationParameters(
            decoding_method="greedy",
            max_new_tokens=300,
            min_new_tokens=10,
            # stream=False, no longer specified
        )

        # TODO: Store the evaluator LLM in the db
        evaluator_model_name = "meta-llama/llama-2-70b-chat"
        eval_params = TextGenerationParameters(
            decoding_method="greedy",
            max_new_tokens=500,
            min_new_tokens=10,
            # stream=False,no longer specified
        )

        # Models that we want to compare
        models_to_eval = evaluation.aimodels
        evaluator_model = evaluator_model_name

        # Get input variables from prompt
        extracted_input_variables = [v.strip() for v in re.findall('{(.+?)}', evaluation.prompt)]

        # TODO: validate input variables

        task_template = PromptTemplate(
            input_variables=extracted_input_variables,
            template=evaluation.prompt,
        )

        evaluation_template = PromptTemplate.from_file(
            template_file = "./eval_template.prompt",
            input_variables = ["prompt", "output_1", "output_2", "eval_criteria"]
        )

        # Get the dataset from db 
        dataset = db.dataset.find_unique(
            where={
            'id': evaluation.datasetId,
            }, 
            include={
                "datums": True,
                "variables": True
            }
        )

        eval_criteria = evaluation.criteria

        tasks_count = get_task_count(models_to_eval, dataset.num_examples)

        progress = 0
        example_output_wins = defaultdict()

        for datum in dataset.datums:
            print(f'Processing datum {datum.id}')
            data_dict = {key: datum.data[key] for key in extracted_input_variables}
            task_prompt = task_template.format(**data_dict)

            example = db.example.create(
                data={
                    "prompt": task_prompt,
                    "runId": evaluation.run.id
                }
            )

            outputs = []

            for model in models_to_eval:
                print(f'Generating output for model {model.name} and datum {datum.id}')
                output_str = generate_text(model.name, task_prompt, task_params)
                output = write_output(example, model, output_str)
                outputs.append(output)
                progress += 1
                update_progress(evaluation, progress, tasks_count)
            
            # Keep track of the winnning output for this example
            wins = defaultdict(int)

            # Try all possible pairs
            for output_1, output_2 in list(itertools.combinations(outputs, 2)):
                print(f'Generating evaluation for outputs {output_1.id} and {output_2.id} with datum {datum.id}')
                contest_data = {
                    "output1Id": output_1.id,
                    "output2Id": output_2.id,
                    "exampleId": example.id,
                    "runId": evaluation.run.id
                }
                judgements_gen = judgements_generator(
                                evaluation_template,
                                task_prompt, 
                                output_1, 
                                output_2, 
                                eval_criteria, 
                                evaluator_model,
                                eval_params,
                            )
                
                judgement_1 = next(judgements_gen)
                progress += 1
                judgement_2 = next(judgements_gen)
                progress += 1
                judgements = [judgement_1, judgement_2]

                contest_data["explanation"] = "Based on the evaluation criteria, the best output is output " + judgements[0] 
                
                winning_output = get_winning_output(judgements, output_1, output_2)

                update_contest(winning_output, contest_data, wins)
                db.contest.create(data=contest_data)
                
                update_progress(evaluation, progress, tasks_count)

            sorted_wins = sorted(wins.items(), key=lambda x: x[1], reverse=True)
            
            example_output_wins[example.id] = sorted_wins[0][0]

        review = setup_manual_review(evaluation)
        set_eval_winners(evaluation.run.id, review.id, example_output_wins)
        finish_evaluation(evaluation.run.id)
    except Exception as e:
        handle_run_error(evaluation.run.id)
        print(e)