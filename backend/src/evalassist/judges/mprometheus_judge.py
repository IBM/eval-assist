from collections.abc import Sequence
from typing import Literal

from .base import DirectJudge, PairwiseJudge
from .types import (
    Criteria,
    DirectInstance,
    DirectInstanceResult,
    PairwiseInstance,
    PairwiseInstanceResult,
    SingleSystemPairwiseResult,
)


class MPrometheusDirectJudge(DirectJudge):
    m_prometheus_model_name: str

    def __init__(self, m_prometheus_b_params: Literal[3, 7, 14]):
        self.m_prometheus_model_name = (
            f"Unbabel/M-Prometheus-{str(m_prometheus_b_params)}B"
        )

    def get_name(self) -> str:
        return "prometheus"

    def _validate_criteria(self, criteria: Sequence[Criteria]):
        for criterion in criteria:
            if len(criterion.options) != 5:
                raise ValueError(
                    "Criteria must be of Likert type (5 options in crescending order) because that is the only rubric supported by Prometheus models in direct assessment evaluations."
                )

    def _validate_instances(self, instances: Sequence[DirectInstance]):
        for instance in instances:
            if instance.context is not None and "instruction" not in instance.context:
                raise ValueError(
                    f'Prometheus models expect an instruction. Include an "instruction" context variable in each instance. Found context variables: {list(instance.context.keys())}'
                )

    def _run(
        self,
        instances: Sequence[DirectInstance],
        criteria: Sequence[Criteria],
    ) -> Sequence[DirectInstanceResult]:
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
            instance.context["instruction"] if instance.context is not None else ""
            for instance in instances
        ]
        responses = [instance.response for instance in instances]

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
                criteria=criterion,
                option=criterion.options[score - 1].name,
                score=score,
                explanation=feedback,
            )
            for feedback, score, criterion in zip(feedbacks, scores, criteria)
        ]


class MPrometheusPairwiseJudge(PairwiseJudge):
    m_prometheus_model_name: str

    def __init__(self, m_prometheus_b_params: Literal[3, 7, 14]):
        self.m_prometheus_model_name = (
            f"Unbabel/M-Prometheus-{str(m_prometheus_b_params)}B"
        )

    def get_name(self) -> str:
        return "prometheus"

    def _validate_instances(self, instances: Sequence[PairwiseInstance]):
        for instance in instances:
            if instance.context is not None and "instruction" not in instance.context:
                raise ValueError(
                    f'Prometheus models expect an instruction. Include an "instruction" context variable in each instance. Found context variables: {list(instance.context.keys())}'
                )
            if len(instance.responses) != 2:
                raise ValueError(
                    "Prometheus only allows for two responses to be compared. Support for comparing more than two responsens will be supported by EvalAssist soon."
                )

    def _run(
        self,
        instances: Sequence[PairwiseInstance],
        criteria: Sequence[Criteria],
    ) -> Sequence[PairwiseInstanceResult]:
        from prometheus_eval import PrometheusEval
        from prometheus_eval.prompts import RELATIVE_PROMPT_WO_REF
        from prometheus_eval.vllm import VLLM

        self._validate_instances(instances)

        instructions = [
            instance.context["instruction"] if instance.context is not None else ""
            for instance in instances
        ]
        responses_A = [instance.responses[0] for instance in instances]
        responses_B = [instance.responses[1] for instance in instances]
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
        # systems_per_instance = len(instances[0].responses)
        # comparisons_per_instance =  systems_per_instance - 1
        for i, (instance, feedback, score) in enumerate(
            zip(instances, feedbacks, scores)
        ):
            instance_result: dict[str, SingleSystemPairwiseResult] = {}
            instance_result["system_1"] = SingleSystemPairwiseResult(
                contest_results=[score == "A"],
                compared_to=[1],
                explanations=[feedback],
                positional_bias=[False],
                winrate=1.0,
                ranking=1 if score == "A" else 0,
                selections=["1" if score == "A" else "2"],
            )

            instance_result["system_2"] = SingleSystemPairwiseResult(
                contest_results=[score == "B"],
                compared_to=[0],
                explanations=[feedback],
                positional_bias=[False],
                winrate=1.0,
                ranking=1 if score == "B" else 0,
                selections=["1" if score == "A" else "2"],
            )
            results.append(PairwiseInstanceResult(instance_result))
        return results
