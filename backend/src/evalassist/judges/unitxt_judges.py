from abc import ABC, abstractmethod
from collections.abc import Sequence
from typing import Any, Generic, List, cast

from unitxt.api import evaluate, load_dataset
from unitxt.artifact import fetch_artifact
from unitxt.blocks import Task, TaskCard
from unitxt.llm_as_judge import CriteriaWithOptions as UnitxtCriteriaWithOptions
from unitxt.llm_as_judge import (
    LLMJudgeDirect,
    LLMJudgePairwise,
    LoadCriteria,
    LoadCriteriaWithOptions,
)
from unitxt.loaders import LoadFromDictionary
from unitxt.metric_utils import EvaluationResults
from unitxt.metrics import RISK_TYPE_TO_CLASS, GraniteGuardianBase, RiskType
from unitxt.templates import NullTemplate

from .base import (
    DirectJudge,
    InstanceTypeVar,
    Judge,
    PairwiseJudge,
    ReturnVarType,
    UnitxtInferenceEngineMixin,
)
from .types import (
    Criteria,
    DirectInstance,
    DirectInstanceResult,
    PairwiseInstance,
    PairwiseInstanceResult,
    SingleSystemPairwiseResult,
)


class UnitxtJudge(
    Judge[InstanceTypeVar, ReturnVarType],
    ABC,
    Generic[InstanceTypeVar, ReturnVarType],
    UnitxtInferenceEngineMixin,
):
    @abstractmethod
    def get_preprocess_steps(self) -> list[Any]: ...

    @abstractmethod
    def get_prediction_type(self) -> type: ...

    @abstractmethod
    def get_evaluator_klass(self) -> type: ...

    @abstractmethod
    def parse_results(self, dataset) -> List[ReturnVarType]: ...

    def get_name(self) -> str:
        return "unitxt"

    def _run(
        self, instances: Sequence[InstanceTypeVar], criteria: Sequence[Criteria]
    ) -> Sequence[ReturnVarType]:
        # unitxt has a fixed task input fields, so we will add all of them in case different criterias have different prediction and/or context fields
        all_context_fields: set[str] = set(
            [
                list_item
                for listt in [
                    (
                        c.context_fields
                        if c.context_fields is not None
                        else (list(i.context.keys()) if i.context is not None else {})
                    )
                    for i, c in zip(instances, criteria)
                ]
                for list_item in listt
            ]
        )

        all_prediction_fields: set[str] = set(
            [cast(str, c.prediction_field) for c in criteria]
        )

        predictions = self.get_predictions(instances)

        evaluator_params = {
            "inference_engine": self.inference_engine,
            "context_fields": [],
            "criteria_field": "criteria",
            "generate_summaries": False,
            "check_positional_bias": False,
            "include_prompts_in_result": True,
        }
        metric = self.get_evaluator_klass()(**evaluator_params)

        input_fields = {field: str for field in all_context_fields}

        input_fields.update(
            {field: self.get_prediction_type() for field in all_prediction_fields}
        )

        # add the context fields
        task_data: list[dict[str, str | list[str]]] = [
            {
                **(instance.context if instance.context is not None else {}),
                cast(str, criterion.prediction_field): prediction,
            }
            for instance, prediction, criterion in zip(instances, predictions, criteria)
        ]

        # add the context fields as empty strings in case different criteria provide diffent context names or prediction_field names

        task_data = [
            {
                k: (td[k] if k in td else "")
                for k in all_context_fields.union(all_prediction_fields)
            }
            for td in task_data
        ]
        data = {
            "test": [
                {**td, "judgement": c.to_unitxt_criteria()}
                for td, c in zip(task_data, criteria)
            ]
        }

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
    UnitxtJudge[DirectInstance, DirectInstanceResult],
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

            results.append(
                DirectInstanceResult(
                    criteria=Criteria.from_unitxt_criteria(
                        cast(
                            UnitxtCriteriaWithOptions,
                            fetch_artifact(instance_score[f"{prefix}_criteria"])[0],
                        )
                    ),
                    option=instance_score[f"{prefix}_selected_option"],
                    explanation=instance_score[f"{prefix}_assessment"],
                    positional_bias=None,
                )
            )
        return results


class UnitxtPairwiseJudge(
    UnitxtJudge[PairwiseInstance, PairwiseInstanceResult],
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
                        positional_bias=None,  # score[f"{outer_key}_positional_bias"], we calculate the positional bias outside unitxt now
                        winrate=score[f"{outer_key}_winrate"],
                        ranking=score[f"{outer_key}_ranking"],
                        selections=score[f"{outer_key}_selections"],
                    )
            results.append(PairwiseInstanceResult(parsed_score))
        return results


class GraniteGuardianJudge(
    DirectJudge,
):
    def get_name(self) -> str:
        return "Granite Guardian"

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

    def get_prompt(self, risk_name, instances, criterion: Criteria) -> list[str]:
        risk_name = self.get_risk_name(risk_name)
        predictions = self.get_predictions(instances)

        context_variables_list = self.get_unitxt_dataset(
            instances=instances,
            predictions=predictions,
            criteria=[criterion] * len(instances),
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

    def parse_results(
        self, dataset, criteria: Sequence[Criteria]
    ) -> list[DirectInstanceResult]:
        results = []
        for instance, criterion in zip(dataset, criteria):
            risk_name: str = instance["score"]["instance"]["score_name"]
            instance_score = instance["score"]["instance"]
            explanation = self.get_harms_and_risks_result_description(
                cast(str, criterion.prediction_field).replace("_", " "),
                risk_name.lower().replace(" ", "_"),
            )

            instance_score = instance["score"]["instance"]
            selected_option = instance_score[f"{risk_name}_label"]

            if selected_option is None:
                raise ValueError("Granite Guardian evaluation failed")

            results.append(
                DirectInstanceResult(
                    criteria=criterion,
                    option=instance_score[f"{risk_name}_label"],
                    explanation=explanation,
                    positional_bias=None,
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
        self,
        instances: Sequence[DirectInstance],
        predictions: list[str],
        criteria: Sequence[Criteria],
    ) -> list[dict[str, str]]:
        contexts = [
            instance.context if instance.context is not None else {}
            for instance in instances
        ]
        for context, prediction, criterion in zip(contexts, predictions, criteria):
            # use prediction as one more context variable
            if criterion.prediction_field is not None:
                context[cast(str, criterion.prediction_field)] = prediction
            else:
                context["response"] = prediction

        return [
            {k.lower().replace(" ", "_"): v for k, v in context_variables.items()}
            for context_variables in contexts
        ]

    def get_input_fields(
        self, context_variables_list: list[dict[str, str]]
    ) -> dict[str, type[str]]:
        return {input_field: str for input_field in context_variables_list[0].keys()}

    def _run(
        self,
        instances: Sequence[DirectInstance],
        criteria: Sequence[Criteria],
    ) -> Sequence[DirectInstanceResult]:
        risk_names = [self.get_risk_name(criterion.name) for criterion in criteria]
        predictions = self.get_predictions(instances)
        dataset = self.get_unitxt_dataset(
            instances=instances, predictions=predictions, criteria=criteria
        )
        input_fields = self.get_input_fields(dataset)

        granite_guardian_class: type[GraniteGuardianBase] = self.getEvaluatorClass(
            self.infer_risk_type(
                risk_name=risk_names[0],
                field_map=self.field_map,
                input_fields=input_fields,
            )
        )

        metric = granite_guardian_class(
            risk_name=risk_names[0],
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
            dataset=evaluated_dataset, criteria=criteria
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
