from typing import Literal, cast

from evalassist.judges.utils import get_to_evaluate_text

from .base import BaseDirectJudge, BasePairwiseJudge
from .types import Criteria, DirectInstanceResult, Instance, PairwiseInstanceResult


class MPrometheusJudge:
    m_prometheus_model_name: str

    def __init__(self, m_prometheus_b_params: Literal[3, 7, 14], **kwargs):
        super().__init__(**kwargs)
        self.m_prometheus_model_name = (
            f"Unbabel/M-Prometheus-{str(m_prometheus_b_params)}B"
        )


class MPrometheusDirectJudge(MPrometheusJudge, BaseDirectJudge):
    def get_name(self) -> str:
        return "prometheus"

    def get_inference_engine_id(self) -> str:
        return "mprometheus"

    def _validate_criteria(self, criteria: list[Criteria]):
        for criterion in criteria:
            if len(criterion.options) != 5:
                raise ValueError(
                    "Criteria must be of Likert type (5 options in crescending order) because that is the only rubric supported by Prometheus models in direct assessment evaluations."
                )

    def _validate_instances(self, instances: list[Instance]):
        for instance in instances:
            if "instruction" not in instance.fields:
                raise ValueError(
                    f'Prometheus models expect an instruction. Include an "instruction" context variable in each instance. Found context variables: {list(instance.fields.keys())}'
                )

    def _run(
        self,
        instances: list[Instance],
        criteria: list[Criteria],
    ) -> list[DirectInstanceResult]:
        from prometheus_eval import PrometheusEval
        from prometheus_eval.prompts import (
            ABSOLUTE_PROMPT_WO_REF,
            SCORE_RUBRIC_TEMPLATE,
        )
        from prometheus_eval.vllm import VLLM

        self._validate_criteria(criteria)
        self._validate_instances(instances)

        parsed_criteria: list[str] = [
            SCORE_RUBRIC_TEMPLATE.format(
                **{
                    "criteria": f"{criterion.name}: {criterion.description}",
                    **{
                        f"score{i + 1}_description": option.description
                        for i, option in enumerate(criterion.options)
                    },
                }
            )
            for criterion in criteria
        ]

        instructions = [
            cast(str, instance.fields["instruction"]) for instance in instances
        ]
        responses = [
            cast(str, get_to_evaluate_text(instance, criterion))
            for instance, criterion in zip(instances, criteria)
        ]

        model = VLLM(model=self.m_prometheus_model_name, max_model_len=4096)
        # model = LiteLLM(f"huggingface/{self.m_prometheus_model_name}")
        judge = PrometheusEval(
            model=model, absolute_grade_template=ABSOLUTE_PROMPT_WO_REF
        )

        feedbacks, scores = judge.absolute_grade(
            instructions=instructions,
            responses=responses,
            rubric=parsed_criteria,
        )

        return [
            DirectInstanceResult(
                instance=instance,
                criteria=criterion,
                selected_option=criterion.options[score - 1].name,
                score=score,
                explanation=feedback,
            )
            for feedback, score, criterion, instance in zip(
                feedbacks, scores, criteria, instances
            )
        ]


class MPrometheusPairwiseJudge(MPrometheusJudge, BasePairwiseJudge):
    def get_name(self) -> str:
        return "prometheus"

    def _validate_instances(self, instances: list[Instance], criteria: list[Criteria]):
        for instance, criterion in zip(instances, criteria):
            if "instruction" not in instance.fields:
                raise ValueError(
                    f'Prometheus models expect an instruction. Include an "instruction" context variable in each instance. Found context variables: {list(instance.fields.keys())}'
                )
            if len(cast(list[str], get_to_evaluate_text(instance, criterion))) != 2:
                raise ValueError(
                    "Prometheus only allows for two responses to be compared. Support for comparing more than two responsens will be supported by EvalAssist soon."
                )

    def _run(
        self,
        instances: list[Instance],
        criteria: list[Criteria],
    ) -> list[PairwiseInstanceResult]:
        from prometheus_eval import PrometheusEval
        from prometheus_eval.prompts import RELATIVE_PROMPT_WO_REF
        from prometheus_eval.vllm import VLLM

        self._validate_instances(instances, criteria)

        instructions = [
            cast(str, instance.fields["instruction"]) for instance in instances
        ]
        responses_A = [
            cast(list[str], get_to_evaluate_text(instance, criterion))[0]
            for instance, criterion in zip(instances, criteria)
        ]
        responses_B = [
            cast(list[str], get_to_evaluate_text(instance, criterion))[1]
            for instance, criterion in zip(instances, criteria)
        ]
        model = VLLM(model=self.m_prometheus_model_name, max_model_len=4096)
        # model = LiteLLM(f"huggingface/{self.m_prometheus_model_name}")
        judge = PrometheusEval(
            model=model, absolute_grade_template=RELATIVE_PROMPT_WO_REF
        )
        parsed_criteria = [
            f"{criterion.name}: {criterion.description}" for criterion in criteria
        ]
        result: tuple[list[str], list[str]] = judge.relative_grade(
            instructions=instructions,
            responses_A=responses_A,
            responses_B=responses_B,
            rubric=parsed_criteria,
        )  # type: ignore

        feedbacks, scores = result

        results: list[PairwiseInstanceResult] = []
        for i, (instance, feedback, score) in enumerate(
            zip(instances, feedbacks, scores)
        ):
            results.append(
                PairwiseInstanceResult(
                    selected_option=0 if score == "A" else 1, explanation=feedback
                )
            )
        return results
