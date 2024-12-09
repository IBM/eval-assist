# from unitxt import get_logger
from abc import ABC
from unitxt.api import evaluate, load_dataset
from unitxt.blocks import Task, TaskCard
from unitxt.eval_assist_utils import get_evaluator_metadata, rename_model_if_required, CatalogDefinition
from unitxt.loaders import LoadFromDictionary
from unitxt.eval_assist_constants import  EVALUATOR_TO_MODEL_ID, EvaluatorNameEnum, CriteriaWithOptions, CriteriaOption, ModelProviderEnum, PROVIDER_TO_STRATEGY, Criteria, EvaluatorTypeEnum
from unitxt.inference import RITSInferenceEngine, LiteLLMInferenceEngine
from unitxt.eval_assist_llm_as_judge_direct import EvalAssistLLMAsJudgeDirect
from unitxt.eval_assist_llm_as_judge_pairwise import EvalAssistLLMAsJudgePairwise
from typing import Any
from unitxt.operators import Set

from ..api.rubric import CriteriaWithOptionsAPI

class Evaluator(ABC):
    evaluator_type: EvaluatorTypeEnum

    def __init__(self, name: EvaluatorNameEnum):
        self.evaluator = get_evaluator_metadata(name)
    
    def parse_results(self, dataset):
        raise NotImplementedError("This method must be implemented.")

    def evaluate(
            self,
            contexts,
            responses,
            criteria: str | CriteriaWithOptionsAPI,
            provider: ModelProviderEnum,
            credentials: dict[str,str]):
       
        input_fields = {"context": dict}

        
        params = {
            "max_tokens": 1024,
            "seed": 42,
            "credentials": credentials
        }

        model = rename_model_if_required(EVALUATOR_TO_MODEL_ID[self.evaluator.name], provider)
        if provider == ModelProviderEnum.WATSONX:
            model = "watsonx/" + model

        if provider == ModelProviderEnum.RITS:
            params['credentials']['api_base'] = RITSInferenceEngine.get_base_url_from_model_name(model) + '/v1'
            params['extra_headers'] = {'RITS_API_KEY': credentials['api_key']}
            model = f'openai/{model}'

        params['model'] = model
        
        inference_engine = LiteLLMInferenceEngine(**params)

        # process criteria
        is_predefined_criteria = isinstance(criteria, str)
        if is_predefined_criteria:
            criteria = f"metrics.llm_as_judge.eval_assist.{self.evaluator_type.name}.criteria.{criteria}"
        else:
            if self.evaluator_type == EvaluatorTypeEnum.DIRECT_ASSESSMENT:
                criteria = CriteriaWithOptions(
                    name=criteria.name,
                    description=criteria.description,
                    options=[
                        CriteriaOption(
                            name=option.name,
                            description=option.description,
                        ) for option in criteria.options
                    ],
                )
            else:
                criteria = Criteria(
                    name=criteria.name,
                    description=criteria.description,
                )   
    
        if self.evaluator_type == EvaluatorTypeEnum.DIRECT_ASSESSMENT:
            metric = EvalAssistLLMAsJudgeDirect(
                inference_engine=inference_engine,
                option_selection_strategy="PARSE_OUTPUT_TEXT",
                evaluator_name=self.evaluator.name.name,
                criteria_or_criterias=criteria,
            )
        else:
            metric = EvalAssistLLMAsJudgePairwise(
                inference_engine=inference_engine,
                option_selection_strategy="PARSE_OUTPUT_TEXT",
                evaluator_name=self.evaluator.name.name,
                criteria_or_criterias=criteria,
            )
            
        data = {"test": [{"context": context} for context in contexts]}
        card = TaskCard(
            loader=LoadFromDictionary(data=data, data_classification_policy=["public"]),
            task=Task(
                input_fields=input_fields,
                reference_fields={},
                prediction_type=str,
                metrics=[metric],
            )
        )

        test_dataset = load_dataset(card=card, template="templates.empty")["test"]

        evaluated_dataset = evaluate(predictions=responses, data=test_dataset)
        return self.parse_results(evaluated_dataset)

class DirectAssessmentEvaluator(Evaluator):
    def __init__(self, name: EvaluatorNameEnum):
        super().__init__(name)
        self.evaluator_type = EvaluatorTypeEnum.DIRECT_ASSESSMENT

    def parse_results(self, dataset):
        results = []
        for instance in dataset:
            instance_score = instance['score']['instance']
            results.append({
                'positional_bias_option': instance_score['positional_bias_selected_option'],
                'option': instance_score['selected_option'],
                'summary': instance_score["summary"],
                'positional_bias': instance_score["positional_bias"]
            })
        return results

class PairwiseComparisonEvaluator(Evaluator):
    def __init__(self, name: EvaluatorNameEnum):
        super().__init__(name)
        self.evaluator_type = EvaluatorTypeEnum.PAIRWISE_COMPARISON

    def parse_results(self, dataset):
        results = {}
        for instance in dataset:
            instance_score = instance['score']['instance']
            results[instance_score['response_name']] = instance_score
        return results