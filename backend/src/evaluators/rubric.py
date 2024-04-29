from typing import Dict
from genai import Client
from genai.schema import (
    TextGenerationParameters,
    TextGenerationReturnOptions
)
from typing import List
import src.evaluators as evaluators
from statistics import mean
import json
from tqdm import tqdm

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

    def _token_count(self, model_id: str, prompts:List[str]) -> int:

        token_counts = []
        response = next(self.client.text.tokenization.create(model_id=model_id,
            input=prompts,
            execution_options={"ordered": True, 'concurrency_limit': 2}))

        for r in response.results:
            token_counts.append(r.token_count)

        return token_counts

    def _select_answer(self, model_id: str, rubric:Rubric, prompt: str, token_count: int) -> int:

        lps = []
        option_prompts = [prompt + o.option for o in rubric.options]

        for response in tqdm(
            self.client.text.generation.create(
                model_id=model_id,
                inputs = option_prompts,
                execution_options={"ordered": True, 'concurrency_limit': 5},
                parameters=self.ff_parameters,
            ),
            total = len(option_prompts),
            desc="Selecting options"
        ):
            tokens = response.results[0].input_tokens[token_count:]
            lps.append(mean([t.logprob for t in tokens if t.logprob != None]))
        
        index_max = max(range(len(lps)), key=lps.__getitem__)
        return rubric.options[index_max].option

    def evaluate(self, model_id: str, context:str, responses:List[str], rubric: Rubric)  -> Dict:

        ASSESS_TEMPLATE = _MIXTRAL_RUBRIC_ASSESS  
        SUMMARIZE_TEMPLATE = _MIXTRAL_RUBRIC_SUMMARIZE
        ANSWER_TEMPLATE = _MIXTRAL_RUBRIC_ANSWER

        assessment_prompts = [ASSESS_TEMPLATE.format(
                input=context,
                response=r,
                criteria=rubric.criteria
            ) for r in responses]

        # Assessment stage
        assessments = []

        for response in tqdm(
            self.client.text.generation.create(
            model_id=model_id,
            inputs= assessment_prompts,
            execution_options={"ordered": True, 'concurrency_limit': 5},
            parameters=self.gen_parameters),
            total=len(assessment_prompts),
            desc="Assessment"
        ):
            assessments.append(response.results[0].generated_text)

        summarization_prompts = [
            assessment_prompt + assessment + SUMMARIZE_TEMPLATE for assessment_prompt, assessment in zip(assessment_prompts, assessments)
        ]

        # Summarization stage
        summaries = []

        for response in tqdm(
            self.client.text.generation.create(
            model_id=model_id,
            inputs= summarization_prompts,
            execution_options={"ordered": True, 'concurrency_limit': 5},
            parameters=self.gen_parameters),
            total=len(summarization_prompts),
            desc="Summarization"
        ):
            summaries.append(response.results[0].generated_text)

        results = []

        for i in range(len(responses)):

            # Answer stage
            options = [f"Answer {o.option} if {o.description}\n" for o in rubric.options]
            r_options = [f"Answer {o.option} if {o.description}\n" for o in reversed(rubric.options)]

            options_input = summarization_prompts[i] + summaries[i] + ANSWER_TEMPLATE.format(criteria=rubric.criteria, options="".join(options)) 
            r_options_input = summarization_prompts[i] + summaries[i] + ANSWER_TEMPLATE.format(criteria=rubric.criteria, options="".join(r_options)) 

            token_counts = self._token_count(model_id, [options_input, r_options_input])

            selected = self._select_answer(model_id, rubric, options_input, token_counts[0])
            selected_r = self._select_answer(model_id, rubric, r_options_input, token_counts[1])

            p_bias = (selected != selected_r)

            results.append({
                "option": selected,
                "explanation": summaries[i],
                "p_bias": p_bias
            })

        return results