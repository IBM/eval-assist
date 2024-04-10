from io import StringIO
from fastapi import FastAPI, status, UploadFile, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from .db_client import db
from .genai_client import client
from datetime import datetime
load_dotenv()
import pandas as pd 
from time import sleep
import json

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthCheck(BaseModel):
    status: str = "OK"


class PostEvaluationBody(BaseModel):
    name: str


class MissingColumnsException(Exception):
    def __init__(self, message):
        self.message = message

@app.get(
    "/health",
    tags=["healthcheck"],
    summary="Perform a Health Check",
    response_description="Return HTTP Status Code 200 (OK)",
    status_code=status.HTTP_200_OK,
    response_model=HealthCheck,
)
def get_health() -> HealthCheck:
    return HealthCheck(status="OK")


'''
Evaluation endpoints
'''

@app.get("/evaluation/")
async def get_evaluations():
    evaluations = db.evaluation.find_many(where={'deleted': False})
    return evaluations

@app.post("/evaluation/")
async def create_evaluation(post_exp: PostEvaluationBody):
    evaluation = db.evaluation.create(data=jsonable_encoder(post_exp))
    
    return evaluation

@app.get("/evaluation/{id}/")
async def get_evaluation(id: int):
    return db.evaluation.find_unique(
        where={'id': id}, 
    )

@app.delete("/evaluation/{id}/")
async def delete_evaluations(id: int):
    return db.evaluation.update(
        where =
        {
            'id': id,
        },
        data = {
            'deleted': True,
            'deleted_at': datetime.datetime.now()
        }
    )

@app.post("/evaluation/{evaluation_id}/upload_data/")
async def upload_data(evaluation_id: int, file: UploadFile):
    required_columns = ['config', 'model_output']
    try:
        csv_data = StringIO(file.file.read().decode("utf-8"))
        df = pd.read_csv(csv_data)
    except:
        raise HTTPException(status_code=400, detail=f'Something went wrong processing the file.')
    df_colums_stripped = [c.strip() for c in df.columns ]
    context_columns = [c for c in df_colums_stripped if c.startswith('context_')]
    missing_columns = set(required_columns) - set(df_colums_stripped)
    if len(missing_columns) > 0:
        raise HTTPException(status_code=400, detail=f'Missing required columns. Please make sure to include {missing_columns}.' )
    if df.shape[0] == 0:
        raise HTTPException(status_code=400, detail=f'There were no rows found in the csv file.' )
    if len(context_columns) == 0:
        raise HTTPException(status_code=400, detail=f'No context columns were found in the csv file.' )
    

    # Save everything 
    groups = df.groupby(context_columns)

    datums_to_create = []
    for name, group in groups:
        context_json = {context_columns[i]:name[i] for i in range(len(context_columns))}
        # datum = db.datum.create(data={'context': json.dumps(context_json)})
        datums_to_create.append({'context': json.dumps(context_json), 'evaluation_id': evaluation_id})
       
    count = db.datum.create_many(datums_to_create)
    print(f"Created {count} datums")
    
    created_datums = db.datum.find_many(where={'evaluation_id': evaluation_id})
    model_outputs_to_create = []
    for name, group in groups:
        datum = next(x for x in created_datums if all(x.context[k] == group[k].tolist()[0] for k in x.context))
        for index, row in group.iterrows():
            model_output = {
                'evaluation_id': evaluation_id,
                'datum_id': datum.id,
                'config': row.loc['config'],
                'text': row.loc['model_output'],
            }
            model_outputs_to_create.append(model_output)
    db.modeloutput.create_many(model_outputs_to_create)

    return 'Ok', 200

@app.on_event("shutdown")    
async def app_shutdown():
    db.disconnect()


# @app.post("/runs")
# async def post_run(req: PostRunRequest, background_tasks: BackgroundTasks):
 
#     evaluation = db.evaluation.find_unique(
#         where={
#         'id': req.evaluation_id,
#     })

#     # The run object for tracking
#     # TODO: Error handling

#     run = db.run.create({
#         'name': evaluation.name + "_run",
#         'state': 'running',
#         'evaluationId': evaluation.id
#     })

#     background_tasks.add_task(run_evaluation, req.evaluation_id)
#     return run

# @app.get("/runs/{id}")
# async def get_run(id: int):
#     return db.run.find_unique(
#         where={
#         'id': id,
#     })

# @app.get("/models")
# async def get_models():
#     models_response = client.model.list().results
#     ibm_models = [m for m in models_response if m.is_live and m.id.startswith('ibm') ]
#     non_ibm_models = [m for m in models_response if m.is_live and not m.id.startswith('ibm') ]
#     ibm_models.sort(key=lambda x: x.name)
#     non_ibm_models.sort(key=lambda x: x.name)
#     models = [*ibm_models, *non_ibm_models]
#     models = [{'id': m.id, 'name': m.name} for m in models]
#     print(models)
#     return models

# # Run an evaluation
# def run_evaluation(evlauation_id: int):

#     # Get the evaluation from db 
#     evaluation = db.evaluation.find_unique(
#         where={
#         'id': evlauation_id,
#         }, 
#         include={
#             "run": True,
#             "aimodels": True,
#             "dataset": True
#         }
#     )

#     task_params = TextGenerationParameters(
#         decoding_method="greedy",
#         max_new_tokens=300,
#         min_new_tokens=10,
#         # stream=False, no longer specified
#     )

#     # TODO: Store the evaluator LLM in the db
#     evaluator_model_name = "meta-llama/llama-2-70b-chat"
#     eval_params = TextGenerationParameters(
#         decoding_method="greedy",
#         max_new_tokens=500,
#         min_new_tokens=10,
#         # stream=False,no longer specified
#     )

#     # Models that we want to compare
#     models_to_eval = evaluation.aimodels
#     evaluator_model = evaluator_model_name

#     # Get input variables from prompt
#     extracted_input_variables = [v.strip() for v in re.findall('{(.+?)}', evaluation.prompt)]

#     # TODO: validate input variables

#     task_template = PromptTemplate(
#         input_variables=extracted_input_variables,
#         template=evaluation.prompt,
#     )

#     evaluation_template = PromptTemplate.from_file(
#         template_file = "./eval_template.prompt",
#         input_variables = ["prompt", "output_1", "output_2", "eval_criteria"]
#     )

#     # Get the evaluation from db 
#     dataset = db.dataset.find_unique(
#         where={
#         'id': evaluation.datasetId,
#         }, 
#         include={
#             "datums": True,
#             "variables": True
#         }
#     )

#     eval_criteria = evaluation.criteria

#     n = len(models_to_eval)
#     k = 2
#     n_pick_k = math.factorial(n) // (math.factorial(k) * math.factorial(n-k))
#     tasks = n_pick_k * dataset.num_examples
#     tasks += (n * dataset.num_examples)

#     def to_percent(value):
#         return ((value - 0) * 100) / (tasks - 0)

#     def update_progress(progress):
#         db.run.update(
#             where={
#                 'id': evaluation.run.id,
#             },
#             data={
#                 "progress": progress
#             }
#         )

#     def write_output(example, model, outputStr):
#         return db.output.create(
#             data={
#                 "text": outputStr,
#                 "modelId" : model.id,
#                 "exampleId" : example.id,
#             }
#         )

#     progress = 0
#     example_output_wins = defaultdict()

#     for datum in dataset.datums:

#         data_dict = {key: datum.data[key] for key in extracted_input_variables}
#         task_prompt = task_template.format(**data_dict)

#         example = db.example.create(
#             data={
#                 "prompt": task_prompt,
#                 "runId": evaluation.run.id
#             }
#         )

#         outputs = []

#         for model in models_to_eval:
#             responses = list(
#                 client.text.generation.create(
#                     model_id=model.name,
#                     inputs=[task_prompt],
#                     parameters=task_params
#                 )
#             )
#             output_str = responses[0].results[0].generated_text
#             output = write_output(example, model, output_str)
#             outputs.append(output)
#             progress += 1
#             update_progress(to_percent((progress)))
        
#         # Keep track of the winnning output for this example
#         wins = defaultdict(int)

#         # Try all possible pairs
#         for output_1, output_2 in list(itertools.combinations(outputs, 2)):
            
#             contest_data = {
#                 "output1Id": output_1.id,
#                 "output2Id": output_2.id,
#                 "exampleId": example.id,
#                 "runId": evaluation.run.id
#             }

#             eval_prompt = evaluation_template.format(prompt = task_prompt, 
#                                                      output_1 = output_1.text, 
#                                                      output_2 = output_2.text,
#                                                      eval_criteria = eval_criteria)
            
#             responses = list(
#                 client.text.generation.create(
#                     model_id=evaluator_model,
#                     inputs=[eval_prompt],
#                     parameters=eval_params
#                 )
#             )
#             judgement = responses[0].results[0].generated_text.strip()
            
#             contest_data["explanation"] = "Based on the evaluation criteria, the best output is output " + judgement 

#             if judgement[0].isdigit():
#                 selected_answer = int(judgement[0])
#                 if selected_answer == 1 or selected_answer == 2:
#                     if selected_answer == 1:
#                         contest_data["winningOutputId"] = output_1.id
#                         wins[output_1.id] += 1
#                     else:
#                         contest_data["winningOutputId"] = output_2.id
#                         wins[output_2.id] += 1

#             db.contest.create(data=contest_data)
#             progress += 1
            
#             update_progress(to_percent((progress)))

#         sorted_wins = sorted(wins.items(), key=lambda x: x[1], reverse=True)
        
#         example_output_wins[example.id] = sorted_wins[0][0]

#     # Setup infrastructure for manual review
#     review = db.review.create(
#         data={
#             "evaluationId": evaluation.id
#         }
#     )

#     examples = db.example.find_many(
#         where={
#         'runId': evaluation.run.id,
#     })

#     random.shuffle(examples)

#     for e in examples:
#         db.reviewexample.create(
#             data={
#             'reviewId': review.id,
#             'exampleId': e.id,
#             'bestEvalOutputId': example_output_wins[e.id]
#         })
         
#     db.run.update(
#         where={
#             'id': evaluation.run.id,
#         },
#         data={
#             "state": "finished"
#         }
#     ) 