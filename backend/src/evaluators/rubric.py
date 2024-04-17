from typing import Dict
from genai import Credentials, Client
from genai.schema import (
    TextGenerationParameters,
    TextGenerationReturnOptions
)
from statistics import mean
import json

class RubricOption(object):
    def __init__(self, option: str, description: str):
        self.option = option
        self.description = description

class Rubric(object):
    def __init__(self, criteria:str, options: list[RubricOption]):
        self.criteria = criteria
        self.options = options

    @classmethod
    def from_json(cls, json_string):
        json_dict = json.loads(json_string)
        return cls(criteria=json_dict["criteria"], 
                   options=[RubricOption(option=opt["option"],
                                         description=opt["description"]) for opt in json_dict["options"]])
    

EVAL_TEMPLATE = """<s> [INST]
You are presented with a [[Response]] generated to satisify an [[Input Context]]. 
You will assess the quality of the [[Response]] subject to the [[Evaluation Criteria]].

[[Input Context]]:
{input}

[[Response]]: 
{response}

[[Evaluation Criteria]]:
{criteria}

Briefly assess the quality of the [[Response]] subject to the [[Evaluation Criteria]].
Proceed as follows:
1. Read the [[Input Context]]
2. Read the [[Response]]
3. Read the [[Evaluation Criteria]]
4. Carefully assess the [[Response]] subject to  the [[Evaluation Criteria]].
[/INST]
Assessment:

"""

SUMMARIZATION_TEMPLATE = """
[INST]
Summarize the assessment into an single easy to understand statement. 
[/INST]
Assessment Summary:

"""

RUBRIC_TEMPLATE = """
[INST]
{criteria}
{options}
[/INST]
Answer:

"""

class RubricEvaluator(object):

    def __init__(self, client: Client):
        self.client = client
        self.random_state = 42
        self.gen_parameters = TextGenerationParameters(
            max_new_tokens = 300, 
            return_options = TextGenerationReturnOptions(), 
            random_seed = self.random_state
        )
        self.ff_parameters = TextGenerationParameters(
            max_new_tokens=1, 
            return_options=TextGenerationReturnOptions(
                input_tokens= True, 
                token_logprobs=True
            ), 
            random_seed=self.random_state
        )

    def evaluate(self, model_id: str, context:str, response:str, rubric: Rubric)  -> Dict:

        eval_prompt = EVAL_TEMPLATE.format(
            input=context,
            response=response,
            criteria=rubric.criteria
        )

        response = next(self.client.text.generation.create(
            model_id=model_id,
            inputs= eval_prompt,
            execution_options={"ordered": True, 'concurrency_limit': 1},
            parameters=self.gen_parameters,
        ))

        assessment = response.results[0].generated_text
        summarization_input = eval_prompt + assessment + SUMMARIZATION_TEMPLATE

        response = next(self.client.text.generation.create(
                model_id=model_id,
                inputs=summarization_input,
                execution_options={"ordered": True, 'concurrency_limit': 1},
                parameters=self.gen_parameters,
            )
        )

        explanation = response.results[0].generated_text
        options = [f"Answer {o.option} if {o.description}\n" for o in rubric.options]
        options_input = summarization_input + explanation + RUBRIC_TEMPLATE.format(criteria=rubric.criteria, options="".join(options)) 

        response = next(self.client.text.tokenization.create(
                model_id=model_id,
                input=options_input,
                execution_options={"ordered": True, 'concurrency_limit': 1}
            ))
        
        tc = response.results[0].token_count
        lps = []

        for option in rubric.options:
            response = next(self.client.text.generation.create(
                model_id=model_id,
                inputs= options_input + option.option,
                execution_options={"ordered": True, 'concurrency_limit': 1},
                parameters=self.ff_parameters,
            ))
            tokens = response.results[0].input_tokens[tc:]
            lps.append(mean([t.logprob for t in tokens if t.logprob != None]))

        index_max = max(range(len(lps)), key=lps.__getitem__)
        selected_option = rubric.options[index_max].option

        return {
            "option": selected_option,
            "explanation": explanation
        }