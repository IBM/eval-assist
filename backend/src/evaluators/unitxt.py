import json
from abc import ABC
from typing import Any, List

from unitxt.api import evaluate, load_dataset
from unitxt.blocks import Task, TaskCard
from unitxt.inference import LiteLLMInferenceEngine, RITSInferenceEngine
from unitxt.llm_as_judge import (
    EVALUATOR_TO_MODEL_ID,
    Criteria,
    CriteriaWithOptions,
    EvaluatorNameEnum,
    EvaluatorTypeEnum,
    LLMJudgeDirect,
    LLMJudgePairwise,
    LoadCriteria,
    LoadCriteriaWithOptions,
    ModelProviderEnum,
    get_evaluator_metadata,
    rename_model_if_required,
)
from unitxt.loaders import LoadFromDictionary
from unitxt.templates import NullTemplate


def get_inference_engine_params(
    credentials: dict,
    provider: ModelProviderEnum,
    evaluator_name: EvaluatorNameEnum,
):
    inference_engine_params = {
        "max_tokens": 1024,
        "seed": 42,
        "credentials": credentials,
        "max_requests_per_second": 10,
    }

    model_name = rename_model_if_required(EVALUATOR_TO_MODEL_ID[evaluator_name], provider)

    if provider == ModelProviderEnum.WATSONX:
        model_name = "watsonx/" + model_name

    if provider == ModelProviderEnum.AZURE_OPENAI:
        inference_engine_params["credentials"][
            "api_base"
        ] = f"https://eteopenai.azure-api.net/openai/deployments/{model_name}/chat/completions?api-version=2024-08-01-preview"
        model_name = "azure/" + model_name
    if provider == ModelProviderEnum.RITS:
        inference_engine_params["credentials"]["api_base"] = (
            RITSInferenceEngine.get_base_url_from_model_name(model_name) + "/v1"
        )
        inference_engine_params["extra_headers"] = {"RITS_API_KEY": credentials["api_key"]}
        model_name = f"openai/{model_name}"

    inference_engine_params["model"] = model_name

    return inference_engine_params


def get_enum_by_value(value: str) -> EvaluatorNameEnum:
    for enum_member in EvaluatorNameEnum:
        if enum_member.value == value:
            return enum_member
    raise ValueError(f"No matching enum found for value: {value}")


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
        criteria: Criteria | CriteriaWithOptions,
        provider: ModelProviderEnum,
        credentials: dict[str, str],
    ):
        inference_engine_params = get_inference_engine_params(credentials, provider, self.evaluator.name)
        inference_engine = LiteLLMInferenceEngine(**inference_engine_params)

        evalutor_params = {
            "inference_engine": inference_engine,
            "evaluator_name": self.evaluator.name.name,
            "context_fields": list(contexts[0].keys()),
            "criteria_field": "criteria",
        }

        evaluator_klass = LLMJudgeDirect if self.evaluator_type == EvaluatorTypeEnum.DIRECT else LLMJudgePairwise

        input_fields = {input_field: str for input_field in contexts[0].keys()}
        metric = evaluator_klass(**evalutor_params)
        data = {"test": contexts if self.evaluator_type == EvaluatorTypeEnum.DIRECT else [contexts[0]]}
        data["test"] = [{**d, "judgement": criteria} for d in data["test"]]
        card = TaskCard(
            loader=LoadFromDictionary(data=data, data_classification_policy=["public"]),
            preprocess_steps=[
                (
                    LoadCriteriaWithOptions(field="judgement", to_field="criteria")
                    if self.evaluator_type == EvaluatorTypeEnum.DIRECT
                    else LoadCriteria(field="judgement", to_field="criteria")
                ),
            ],
            task=Task(
                input_fields=input_fields,
                prediction_type=str if self.evaluator_type == EvaluatorTypeEnum.DIRECT else List[str],
                metrics=[metric],
                reference_fields={"criteria": Any},
                default_template=NullTemplate(),
            ),
        )

        dataset = load_dataset(card=card, split="test")
        predictions = responses if self.evaluator_type == EvaluatorTypeEnum.DIRECT else [responses]
        evaluated_dataset = evaluate(predictions=predictions, data=dataset)
        return self.parse_results(evaluated_dataset)


class DirectAssessmentEvaluator(Evaluator):
    def __init__(self, name: EvaluatorNameEnum):
        super().__init__(name)
        self.evaluator_type = EvaluatorTypeEnum.DIRECT

    def parse_results(self, dataset):
        results = []
        prefix = dataset[0]["score"]["instance"]["score_name"]
        for instance in dataset:
            instance_score = instance["score"]["instance"]

            print(json.dumps(instance_score, indent=4))
            results.append(
                {
                    "option": instance_score[f"{prefix}_selected_option"],
                    "summary": instance_score[f"{prefix}_summary"],
                    "positional_bias": instance_score[f"{prefix}_positional_bias"],
                    "positional_bias_option": instance_score[f"{prefix}_positional_bias_selected_option"],
                }
            )
        return results


class PairwiseComparisonEvaluator(Evaluator):
    def __init__(self, name: EvaluatorNameEnum):
        super().__init__(name)
        self.evaluator_type = EvaluatorTypeEnum.PAIRWISE

    def parse_results(self, dataset):
        score = dataset[0]["score"]["instance"]
        import json

        print(json.dumps(score, indent=4))
        parsed_score = {}
        for key in score.keys():
            outer_key = key.split("_")[0]
            if outer_key not in ["score", "criteria"]:
                parsed_score[outer_key] = {
                    "contest_results": score[f"{outer_key}_contest_results"],
                    "compared_to": score[f"{outer_key}_compared_to"],
                    "summaries": score[f"{outer_key}_summaries"],
                    "positional_bias": score[f"{outer_key}_positional_bias"],
                    "winrate": score[f"{outer_key}_winrate"],
                    "ranking": score[f"{outer_key}_ranking"],
                    "selections": score[f"{outer_key}_selections"],
                }

        return parsed_score
