from typing import Dict
from genai import Client
from genai.schema import (
    TextGenerationParameters,
    TextGenerationReturnOptions
)
import src.evaluators as evaluators
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


_MIXTRAL_RUBRIC_ASSESS = """<s> [INST]
You are presented with a [[Response]] generated to satisify an [[Input Context]]. 
You will assess the quality of the [[Response]] subject to the [[Evaluation Criteria]].

[[Input Context]]:
{input}

[[Response]]: 
{response}

[[Evaluation Criteria]]:
{criteria}

Briefly assess the quality of the Response subject to the Evaluation Criteria.
Focus on the Evaluation Criteria during assessment.

[/INST]
Assessment:

"""

_MIXTRAL_RUBRIC_SUMMARIZE = """
</s> 
[INST]
Summarize the assessment into an single easy to understand statement. 
[/INST]
Assessment Summary:

"""

_MIXTRAL_RUBRIC_ANSWER = """
</s> 
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
            max_new_tokens = 200, 
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

    def _token_count(self, model_id: str, prompt:str) -> int:

        response = next(self.client.text.tokenization.create(
                model_id=model_id,
                input=prompt,
                execution_options={"ordered": True, 'concurrency_limit': 1}
            ))
        
        return response.results[0].token_count

    def _select_answer(self, model_id: str, rubric:Rubric, prompt: str, token_count: int, reverse_options=False) -> int:

        lps = []

        for option in rubric.options:
            response = next(self.client.text.generation.create(
                model_id=model_id,
                inputs= prompt + option.option,
                execution_options={"ordered": True, 'concurrency_limit': 1},
                parameters=self.ff_parameters,
            ))
            tokens = response.results[0].input_tokens[token_count:]
            lps.append(mean([t.logprob for t in tokens if t.logprob != None]))
        
        index_max = max(range(len(lps)), key=lps.__getitem__)

        return rubric.options[index_max].option


    def evaluate(self, model_id: str, context:str, response:str, rubric: Rubric)  -> Dict:

        ASSESS_TEMPLATE = _MIXTRAL_RUBRIC_ASSESS  
        SUMMARIZE_TEMPLATE = _MIXTRAL_RUBRIC_SUMMARIZE
        ANSWER_TEMPLATE = _MIXTRAL_RUBRIC_ANSWER

        eval_prompt = ASSESS_TEMPLATE.format(
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
        summarization_input = eval_prompt + assessment + SUMMARIZE_TEMPLATE

        response = next(self.client.text.generation.create(
                model_id=model_id,
                inputs=summarization_input,
                execution_options={"ordered": True, 'concurrency_limit': 1},
                parameters=self.gen_parameters,
            )
        )

        explanation = response.results[0].generated_text

        # Get answer
        options = [f"Answer {o.option} if {o.description}\n" for o in rubric.options]
        options_input = summarization_input + explanation + ANSWER_TEMPLATE.format(criteria=rubric.criteria, options="".join(options)) 
        tc = self._token_count(model_id, options_input)
        selected = self._select_answer(model_id, rubric, options_input, tc)

        # Reverse
        options = [f"Answer {o.option} if {o.description}\n" for o in reversed(rubric.options)]
        options_input = summarization_input + explanation + ANSWER_TEMPLATE.format(criteria=rubric.criteria, options="".join(options)) 
        tc = self._token_count(model_id, options_input)
        selected_r = self._select_answer(model_id, rubric, options_input, tc)
        p_bias = (selected != selected_r)

        return {
            "option": selected,
            "explanation": explanation,
            "p_bias": p_bias
        }