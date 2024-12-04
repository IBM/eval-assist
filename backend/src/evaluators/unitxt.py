# from unitxt import get_logger
from abc import ABC
from unitxt.api import evaluate, load_dataset
from unitxt.blocks import Task, TaskCard
from unitxt.eval_assist_utils import get_evaluator_metadata, rename_model_if_required, CatalogDefinition, parse_catalog_definition
from unitxt.loaders import LoadFromDictionary
from unitxt.eval_assist_constants import  EVALUATOR_TO_MODEL_ID, EvaluatorNameEnum, CriteriaWithOptions, ModelProviderEnum, PROVIDER_TO_STRATEGY, OptionSelectionStrategyEnum, EvaluatorTypeEnum
from unitxt.inference import RITSInferenceEngine
from typing import Any, Optional
from unitxt.operators import Set


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
            criteria: str | CriteriaWithOptions,
            provider: ModelProviderEnum,
            credentials: dict[str,str]):
        is_predefined_criteria = isinstance(criteria, str)
       
        input_fields = {"context": dict}

        engine_name = "litellm"

        model = rename_model_if_required(EVALUATOR_TO_MODEL_ID[self.evaluator.name], provider)
        
        inference_engine_catalog_name = f"engines.{engine_name}"

        inference_params = ({"max_tokens": 1024, "seed": 42} if provider in [ModelProviderEnum.RITS, ModelProviderEnum.OPENAI, ModelProviderEnum.WATSONX] else {"max_new_tokens": 1024, "random_seed": 42})
        if provider == ModelProviderEnum.WATSONX:
            model = "watsonx/" + model

        inference_engine_catalog_definition: CatalogDefinition = {
            'name': inference_engine_catalog_name,
            'params': {
                'model': model,
                **inference_params,
            }
        }

        inference_engine_catalog_definition['params']['credentials'] = credentials

        if provider == ModelProviderEnum.RITS:
            inference_engine_catalog_definition['params']['credentials']['api_base'] = RITSInferenceEngine.get_base_url_from_model_name(model) + '/v1'
            inference_engine_catalog_definition['params']['extra_headers'] = {'RITS_API_KEY': credentials['api_key']}
            inference_engine_catalog_definition['params']['model'] = f'openai/{model}'


        metric_catalog_definition: CatalogDefinition = {
            'name': f'metrics.llm_as_judge.eval_assist.{self.evaluator_type.name}',
            'params': {
                'inference_engine': inference_engine_catalog_definition,
                "option_selection_strategy": OptionSelectionStrategyEnum.PARSE_OUTPUT_TEXT.name, #PROVIDER_TO_STRATEGY[provider].name,
                'evaluator_name': self.evaluator.name.name,
            }
        }
        preprocess_steps = []
        if is_predefined_criteria:
            metric_catalog_definition['criteria_or_criterias'] = f"metrics.llm_as_judge.eval_assist.{self.evaluator_type.name}.criteria.{criteria}"
        else:
            preprocess_steps = [Set(fields={"criteria": criteria.__dict__['_init_dict']})]
            input_fields['criteria'] = dict[str, Any]

        parsed_catalog_name = parse_catalog_definition(metric_catalog_definition)
        data = {"test": [{"context": context} for context in contexts]}
        card = TaskCard(
            loader=LoadFromDictionary(data=data, data_classification_policy=["public"]),
            preprocess_steps=preprocess_steps,
            task=Task(
                input_fields=input_fields,
                reference_fields={},
                prediction_type=str,
                metrics=[parsed_catalog_name],
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