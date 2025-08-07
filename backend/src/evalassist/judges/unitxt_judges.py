from abc import ABC, abstractmethod
from collections.abc import Sequence
from typing import Any, Generic, List, cast

from evalassist.judges.base import (
    CriteriaTypeBar,
    DirectInstance,
    DirectJudge,
    InstanceTypeVar,
    Judge,
    PairwiseJudge,
    ReturnVarType,
)
from unitxt.api import evaluate, load_dataset
from unitxt.blocks import Task, TaskCard
from unitxt.llm_as_judge import (
    Criteria,
    CriteriaWithOptions,
    LLMJudgeDirect,
    LLMJudgePairwise,
    LoadCriteria,
    LoadCriteriaWithOptions,
)
from unitxt.loaders import LoadFromDictionary
from unitxt.metric_utils import EvaluationResults
from unitxt.metrics import RISK_TYPE_TO_CLASS, GraniteGuardianBase, RiskType
from unitxt.templates import NullTemplate

from ..api.common import (
    DirectInstanceResult,
    DirectPositionalBias,
    PairwiseInstance,
    PairwiseInstanceResult,
    SingleSystemPairwiseResult,
)


class UnitxtJudge(
    Judge[InstanceTypeVar, CriteriaTypeBar, ReturnVarType],
    ABC,
    Generic[InstanceTypeVar, CriteriaTypeBar, ReturnVarType],
):
    @abstractmethod
    def get_preprocess_steps(self) -> list[Any]: ...

    @abstractmethod
    def get_prediction_type(self) -> type: ...

    @abstractmethod
    def get_evaluator_klass(self) -> type: ...

    @abstractmethod
    def parse_results(self, dataset) -> List[ReturnVarType]: ...

    def evaluate(
        self,
        instances: Sequence[InstanceTypeVar],
    ) -> Sequence[ReturnVarType]:
        if (
            self.criteria.prediction_field is None
            or self.criteria.context_fields is None
        ):
            raise ValueError(
                "EvalAssist uses the new LLM Judge API, where the predictions and context fields are provided in the criteria definition. Make sure to adhere to it."
            )

        predictions = self.get_predictions(instances)

        task_data: list[dict[str, str | list[str]]] = [
            {**instance.context_variables, self.criteria.prediction_field: prediction}
            for instance, prediction in zip(instances, predictions)
        ]

        evaluator_params = {
            "inference_engine": self.inference_engine,
            "context_fields": [],
            "criteria_field": "criteria",
            "generate_summaries": False,
            "criteria": self.criteria,
        }

        input_fields = {
            context_field: str for context_field in self.criteria.context_fields
        }
        input_fields[self.criteria.prediction_field] = self.get_prediction_type()

        metric = self.get_evaluator_klass()(**evaluator_params)

        data = {"test": [{**c, "judgement": self.criteria} for c in task_data]}

        card = TaskCard(
            loader=LoadFromDictionary(data=data, data_classification_policy=["public"]),
            preprocess_steps=self.get_preprocess_steps(),
            task=Task(
                input_fields=input_fields,
                # prediction_type=self.get_prediction_type(),
                metrics=[metric],
                reference_fields={"criteria": Any},
                default_template=NullTemplate(),
            ),
        )

        dataset = load_dataset(card=card, split="test")
        evaluated_dataset: EvaluationResults = evaluate(data=dataset)
        per_instance_results: list[ReturnVarType] = self.parse_results(
            evaluated_dataset
        )

        return per_instance_results


class UnitxtDirectJudge(
    UnitxtJudge[DirectInstance, CriteriaWithOptions, DirectInstanceResult],
    DirectJudge,
):
    def get_preprocess_steps(self):
        return [LoadCriteriaWithOptions(field="judgement", to_field="criteria")]

    def get_prediction_type(self):
        return str

    def get_evaluator_klass(self):
        return LLMJudgeDirect

    def parse_results(self, dataset) -> list[DirectInstanceResult]:
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
                DirectInstanceResult(
                    option=instance_score[f"{prefix}_selected_option"],
                    explanation=instance_score[f"{prefix}_assessment"],
                    positional_bias=positional_bias,
                )
            )
        return results


class UnitxtPairwiseJudge(
    UnitxtJudge[PairwiseInstance, Criteria, PairwiseInstanceResult],
    PairwiseJudge,
):
    def get_preprocess_steps(self):
        return [LoadCriteria(field="judgement", to_field="criteria")]

    def get_prediction_type(self):
        return List[str]

    def get_evaluator_klass(self):
        return LLMJudgePairwise

    def parse_results(self, dataset):
        results: list[PairwiseInstanceResult] = []
        for instance in dataset:
            score = instance["score"]["instance"]

            parsed_score: dict[str, SingleSystemPairwiseResult] = {}
            for key in score.keys():
                outer_key = key.split("_")[0]
                if outer_key not in ["score", "criteria"]:
                    parsed_score[outer_key] = SingleSystemPairwiseResult(
                        contest_results=score[f"{outer_key}_contest_results"],
                        compared_to=score[f"{outer_key}_compared_to"],
                        explanations=score[f"{outer_key}_assessments"],
                        positional_bias=score[f"{outer_key}_positional_bias"],
                        winrate=score[f"{outer_key}_winrate"],
                        ranking=score[f"{outer_key}_ranking"],
                        selections=score[f"{outer_key}_selections"],
                    )
            results.append(PairwiseInstanceResult(parsed_score))
        return results


class GraniteGuardianJudge(
    DirectJudge,
):
    field_map = {
        "user_message_field": "user_message",
        "assistant_message_field": "assistant_message",
        "context_field": "context",
        "tools_field": "tools",
    }

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

    def get_prompt(self, risk_name, instances) -> list[str]:
        risk_name = self.get_risk_name(risk_name)
        predictions = self.get_predictions(instances)

        context_variables_list = self.get_unitxt_dataset(
            instances=instances, predictions=predictions
        )
        input_fields = self.get_input_fields(context_variables_list)
        granite_guardian_class: type[GraniteGuardianBase] = self.getEvaluatorClass(
            self.infer_risk_type(
                risk_name=risk_name, field_map=self.field_map, input_fields=input_fields
            )
        )

        metric = granite_guardian_class(
            risk_name=risk_name,
            **self.field_map,
        )

        return [
            metric.get_prompt(metric.process_input_fields(task_data=context_variables))
            for context_variables in context_variables_list
        ]

    def parse_results(self, dataset) -> list[DirectInstanceResult]:
        results = []
        for instance in dataset:
            risk_name: str = instance["score"]["instance"]["score_name"]
            instance_score = instance["score"]["instance"]
            explanation = self.get_harms_and_risks_result_description(
                cast(str, self.criteria.prediction_field).replace("_", " "),
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
                DirectInstanceResult(
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

    def get_unitxt_dataset(
        self, instances: Sequence[DirectInstance], predictions: list[str]
    ) -> list[dict[str, str]]:
        context_variables_list = [instance.context_variables for instance in instances]
        for context_variables, prediction in zip(context_variables_list, predictions):
            # use prediction as one more context variable
            if self.criteria.prediction_field is not None:
                context_variables[cast(str, self.criteria.prediction_field)] = (
                    prediction
                )
            else:
                context_variables["response"] = prediction

        return [
            {k.lower().replace(" ", "_"): v for k, v in context_variables.items()}
            for context_variables in context_variables_list
        ]

    def get_input_fields(
        self, context_variables_list: list[dict[str, str]]
    ) -> dict[str, type[str]]:
        return {input_field: str for input_field in context_variables_list[0].keys()}

    def evaluate(
        self,
        instances: Sequence[DirectInstance],
    ) -> Sequence[DirectInstanceResult]:
        risk_name = self.get_risk_name(self.criteria.name)
        predictions = self.get_predictions(instances)
        dataset = self.get_unitxt_dataset(instances=instances, predictions=predictions)
        input_fields = self.get_input_fields(dataset)

        granite_guardian_class: type[GraniteGuardianBase] = self.getEvaluatorClass(
            self.infer_risk_type(
                risk_name=risk_name, field_map=self.field_map, input_fields=input_fields
            )
        )

        metric = granite_guardian_class(
            risk_name=risk_name,
            **self.field_map,
            inference_engine=self.inference_engine,
        )
        data = {"test": dataset}

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
        evaluated_dataset: EvaluationResults = evaluate(predictions=None, data=dataset)

        per_instance_result: list[DirectInstanceResult] = self.parse_results(
            evaluated_dataset
        )
        return per_instance_result

    def infer_risk_type(
        self,
        risk_name: str,
        field_map: dict[str, str],
        input_fields: dict[str, type[str]],
    ) -> RiskType:
        """
        Infers the RiskType based on the risk_name and the provided input fields keys.
        """

        available_risks: dict[RiskType, list[str]] = GraniteGuardianBase.available_risks

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

    def getEvaluatorClass(self, risk_type: RiskType) -> type[GraniteGuardianBase]:
        return RISK_TYPE_TO_CLASS[risk_type]
