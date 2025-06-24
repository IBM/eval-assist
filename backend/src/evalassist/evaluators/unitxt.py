from abc import ABC
from typing import Any, List, Optional, cast

from unitxt.api import evaluate, load_dataset
from unitxt.blocks import Task, TaskCard
from unitxt.llm_as_judge import (
    Criteria,
    CriteriaWithOptions,
    EvaluatorNameEnum,
    EvaluatorTypeEnum,
    LLMJudgeDirect,
    LLMJudgePairwise,
    LoadCriteria,
    LoadCriteriaWithOptions,
    ModelProviderEnum,
)
from unitxt.loaders import LoadFromDictionary
from unitxt.metrics import RISK_TYPE_TO_CLASS, GraniteGuardianBase, RiskType
from unitxt.templates import NullTemplate

from ..api.common import (
    DirectPositionalBias,
    DirectResultModel,
    Instance,
    PairwiseResultModel,
)
from ..const import (
    UNITXT_CACHE_ENABLED,
    ExtendedEvaluatorNameEnum,
    ExtendedModelProviderEnum,
)
from ..utils import (
    get_evaluator_metadata_wrapper,
    get_inference_engine,
    get_model_name_from_evaluator,
)


class Evaluator(ABC):
    evaluator_type: EvaluatorTypeEnum

    def __init__(
        self,
        evaluator_name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum,
        custom_model_name: Optional[str] = None,
    ):
        self.evaluator_metadata = get_evaluator_metadata_wrapper(
            evaluator_name, custom_model_name
        )

    def get_preprocess_steps(self):
        raise NotImplementedError("This method must be implemented.")

    def parse_results(self, dataset):
        raise NotImplementedError("This method must be implemented.")

    def get_prediction_type(self):
        raise NotImplementedError("This method must be implemented.")

    def get_evaluator_klass(self):
        raise NotImplementedError("This method must be implemented.")

    def get_predictions(self, instances: list[Instance]) -> list[str | list[str]]:
        return [instance.response for instance in instances]

    def evaluate(
        self,
        instances: list[Instance],
        criteria: Criteria | CriteriaWithOptions,
        provider: ModelProviderEnum | ExtendedModelProviderEnum,
        credentials: dict[str, str],
    ):
        model_name = get_model_name_from_evaluator(
            self.evaluator_metadata,
            provider,
        )

        inference_engine = get_inference_engine(
            credentials,
            provider,
            model_name,
            custom_params={
                "use_cache": UNITXT_CACHE_ENABLED,
                "seed": 42,
                "temperature": 0,
            },
        )

        context_variables_list = [instance.context_variables for instance in instances]

        evalutor_params = {
            "inference_engine": inference_engine,
            "context_fields": list(context_variables_list[0].keys()),
            "criteria_field": "criteria",
            "generate_summaries": False,
        }

        input_fields = {
            input_field: str for input_field in context_variables_list[0].keys()
        }
        metric = self.get_evaluator_klass()(**evalutor_params)
        data = {"test": context_variables_list}
        data["test"] = [{**d, "judgement": criteria} for d in data["test"]]
        card = TaskCard(
            loader=LoadFromDictionary(data=data, data_classification_policy=["public"]),
            preprocess_steps=self.get_preprocess_steps(),
            task=Task(
                input_fields=input_fields,
                prediction_type=self.get_prediction_type(),
                metrics=[metric],
                reference_fields={"criteria": Any},
                default_template=NullTemplate(),
            ),
        )

        dataset = load_dataset(card=card, split="test")
        predictions = self.get_predictions(instances)
        evaluated_dataset = evaluate(predictions=predictions, data=dataset)
        per_instance_result = self.parse_results(evaluated_dataset)
        results = []
        for instance_result, instance in zip(per_instance_result, instances):
            results.append({"id": instance.id, "result": instance_result})
        return results


class DirectAssessmentEvaluator(Evaluator):
    def __init__(
        self,
        evaluator_name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum,
        custom_model_name: Optional[str] = None,
    ):
        super().__init__(evaluator_name, custom_model_name)
        self.evaluator_type = EvaluatorTypeEnum.DIRECT

    def get_preprocess_steps(self):
        return [LoadCriteriaWithOptions(field="judgement", to_field="criteria")]

    def get_prediction_type(self):
        return str

    def get_evaluator_klass(self):
        return LLMJudgeDirect

    def parse_results(self, dataset) -> list[DirectResultModel]:
        results = []
        prefix = dataset[0]["score"]["instance"]["score_name"]
        for instance in dataset:
            instance_score = instance["score"]["instance"]
            positional_bias = DirectPositionalBias(
                detected=instance_score[f"{prefix}_positional_bias"],
            )
            if positional_bias.detected:
                positional_bias.option = instance_score[
                    f"{prefix}_positional_bias_selected_option"
                ]
                positional_bias.explanation = instance_score[
                    f"{prefix}_positional_bias_assessment"
                ]

            results.append(
                DirectResultModel(
                    option=instance_score[f"{prefix}_selected_option"],
                    explanation=instance_score[f"{prefix}_assessment"],
                    positional_bias=positional_bias,
                )
            )
        return results


class PairwiseComparisonEvaluator(Evaluator):
    def __init__(
        self,
        evaluator_name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum,
        custom_model_name: Optional[str] = None,
    ):
        super().__init__(evaluator_name, custom_model_name)
        self.evaluator_type = EvaluatorTypeEnum.PAIRWISE

    def get_preprocess_steps(self):
        return [LoadCriteria(field="judgement", to_field="criteria")]

    def get_prediction_type(self):
        return List[str]

    def get_evaluator_klass(self):
        return LLMJudgePairwise

    def parse_results(self, dataset):
        results = []
        for instance in dataset:
            score = instance["score"]["instance"]

            parsed_score = {}
            for key in score.keys():
                outer_key = key.split("_")[0]
                if outer_key not in ["score", "criteria"]:
                    parsed_score[outer_key] = PairwiseResultModel(
                        **{
                            "contest_results": score[f"{outer_key}_contest_results"],
                            "compared_to": score[f"{outer_key}_compared_to"],
                            "explanations": score[f"{outer_key}_assessments"],
                            "positional_bias": score[f"{outer_key}_positional_bias"],
                            "winrate": score[f"{outer_key}_winrate"],
                            "ranking": score[f"{outer_key}_ranking"],
                            "selections": score[f"{outer_key}_selections"],
                        }
                    )
            results.append(parsed_score)

        return results


class GraniteGuardianEvaluator(ABC):
    evaluator_type: EvaluatorTypeEnum = EvaluatorTypeEnum.DIRECT
    field_map = {
        "user_message_field": "user_message",
        "assistant_message_field": "assistant_message",
        "context_field": "context",
        "tools_field": "tools",
    }

    def __init__(self, name: ExtendedEvaluatorNameEnum):
        self.evaluator_name = name

    def get_harms_and_risks_result_description(
        self, evaluated_component, criteria_name
    ):
        messages = {
            "general_harm": f"Is the {evaluated_component} harmful by common-sense?",
            "social_bias": f"Is the {evaluated_component} prejudiced based on identity or characteristics?",
            "jailbreak": f"Does the {evaluated_component} try to manipulate the AI to generate harmful, undesired, or inappropriate content?",
            "violence": f"Does the {evaluated_component} contain content promoting physical, mental, or sexual harm?",
            "profanity": f"Does the {evaluated_component} include offensive language or insults?",
            "unethical_behavior": f"Does the {evaluated_component} include actions that violate moral or legal standards?",
            "answer_relevance": f"Does the {evaluated_component} fail to address or properly answer the user question?",
            "context_relevance": "Is the retrieved context irrelevant to the user question or does not address their needs?",
            "groundedness": f"Does the {evaluated_component} include claims or facts not supported by or contradicted by the provided context?",
        }
        if criteria_name not in messages:
            return f"Is the {evaluated_component} harmful based on the risk definition?"

        return messages[criteria_name]

    def get_predictions(self, instances: list[Instance]) -> list[str | list[str]]:
        return [instance.response for instance in instances]

    def get_prompt(self, risk_name, instances) -> str:
        risk_name = self.get_risk_name(risk_name)
        predictions = self.get_predictions(instances)

        context_variables_list = self.get_context_variables(
            instances=instances, predictions=predictions
        )
        input_fields = self.get_input_fields(context_variables_list)
        granite_guardian_class = self.getEvaluatorClass(
            self.infer_risk_type(
                risk_name=risk_name, field_map=self.field_map, input_fields=input_fields
            )
        )

        metric = cast(
            GraniteGuardianBase,
            granite_guardian_class(
                risk_name=risk_name,
                **self.field_map,
            ),
        )

        return [
            metric.get_prompt(metric.process_input_fields(task_data=context_variables))
            for context_variables in context_variables_list
        ]

    def parse_results(
        self, dataset, response_variable_name: str
    ) -> list[DirectResultModel]:
        results = []
        for instance in dataset:
            risk_name: str = instance["score"]["instance"]["score_name"]
            instance_score = instance["score"]["instance"]
            explanation = self.get_harms_and_risks_result_description(
                response_variable_name.replace("_", " "),
                risk_name.lower().replace(" ", "_"),
            )

            instance_score = instance["score"]["instance"]
            positional_bias = DirectPositionalBias(
                detected=False, option="", explanation=""
            )
            selected_option = instance_score[f"{risk_name}_label"]

            if selected_option is None:
                raise ValueError("Granite Guardian evaluation failed")

            results.append(
                DirectResultModel(
                    option=instance_score[f"{risk_name}_label"],
                    explanation=explanation,
                    positional_bias=positional_bias,
                )
            )
        return results

    def get_risk_name(self, unparsed_risk_name: str):
        risk_name = unparsed_risk_name
        risk_name = (
            "_".join(
                risk_name.split(" ")[(1 if risk_name.startswith("Context") else 2) :]
            )
            .lower()
            .replace(" ", "_")
        )

        return risk_name if risk_name != "general_harm" else "harm"

    def get_context_variables(
        self, instances: list[Instance], predictions: list[str]
    ) -> list[dict[str, str]]:
        context_variables_list = [instance.context_variables for instance in instances]
        for context_variables, prediction in zip(context_variables_list, predictions):
            # use prediction as one more context variable
            context_variables[instances[0].response_variable_name] = prediction

        return [
            {k.lower().replace(" ", "_"): v for k, v in context_variables.items()}
            for context_variables in context_variables_list
        ]

    def get_input_fields(self, context_variables_list: list[dict[str, str]]):
        return {input_field: str for input_field in context_variables_list[0].keys()}

    def evaluate(
        self,
        criteria: Criteria | CriteriaWithOptions,
        provider: ModelProviderEnum,
        credentials: dict[str, str],
        instances: list[Instance],
    ):
        risk_name = self.get_risk_name(criteria.name)
        predictions = self.get_predictions(instances)
        context_variables_list = self.get_context_variables(
            instances=instances, predictions=predictions
        )
        input_fields = self.get_input_fields(context_variables_list)

        granite_guardian_class = self.getEvaluatorClass(
            self.infer_risk_type(
                risk_name=risk_name, field_map=self.field_map, input_fields=input_fields
            )
        )

        custom_params = {}
        self.evaluator_metadata = get_evaluator_metadata_wrapper(self.evaluator_name)
        model_name = get_model_name_from_evaluator(
            self.evaluator_metadata,
            provider,
        )
        inference_engine = get_inference_engine(
            credentials, provider, model_name, custom_params
        )

        metric = granite_guardian_class(
            risk_name=risk_name,
            **self.field_map,
            inference_engine=inference_engine,
        )
        data = {"test": context_variables_list}

        card = TaskCard(
            loader=LoadFromDictionary(data=data, data_classification_policy=["public"]),
            task=Task(
                input_fields=input_fields,
                reference_fields={},
                prediction_type=float,
                metrics=[metric],
                default_template=NullTemplate(),
            ),
        )

        dataset = load_dataset(card=card, split="test")
        evaluated_dataset = evaluate(predictions=[0.0 for _ in dataset], data=dataset)

        per_instance_result = self.parse_results(
            evaluated_dataset, instances[0].response_variable_name
        )
        results = []
        for instance_result, instance in zip(per_instance_result, instances):
            results.append({"id": instance.id, "result": instance_result})
        return results

    def infer_risk_type(
        self, risk_name: str, field_map: dict[str, str], input_fields: dict[str, str]
    ) -> RiskType:
        """
        Infers the RiskType based on the risk_name and the provided input fields keys.
        """

        available_risks = GraniteGuardianBase.available_risks

        if risk_name in available_risks[RiskType.ASSISTANT_MESSAGE]:
            if field_map["assistant_message_field"] in input_fields:
                return RiskType.ASSISTANT_MESSAGE
            return RiskType.USER_MESSAGE

        if risk_name in available_risks[RiskType.USER_MESSAGE]:
            return RiskType.USER_MESSAGE

        if risk_name in available_risks[RiskType.RAG]:
            return RiskType.RAG

        if risk_name in available_risks[RiskType.AGENTIC]:
            return RiskType.AGENTIC

        return RiskType.CUSTOM_RISK

    def getEvaluatorClass(self, risk_type: RiskType) -> GraniteGuardianBase:
        return RISK_TYPE_TO_CLASS[risk_type]
