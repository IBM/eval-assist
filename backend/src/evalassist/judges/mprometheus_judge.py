from collections.abc import Sequence
from typing import Literal

from unitxt.llm_as_judge import CriteriaWithOptions

from .base import DirectJudge
from .types import DirectInstance, DirectInstanceResult, DirectPositionalBias


class MPrometheusDirectJudge(DirectJudge):
    m_prometheus_model_name: str

    def __init__(self, m_prometheus_b_params: Literal[3, 7, 14]):
        self.m_prometheus_model_name = (
            f"Unbabel/M-Prometheus-{str(m_prometheus_b_params)}B"
        )

    def get_name(self) -> str:
        return "prometheus"

    def _validate_criteria(self, criteria: Sequence[CriteriaWithOptions]):
        for criterion in criteria:
            if len(criterion.options) != 5:
                raise ValueError(
                    "Criteria must be of Likert type (5 options in crescending order) because that is the only rubric supported by Prometheus models in direct assessment evaluations."
                )

    def _validate_instances(self, instances: Sequence[DirectInstance]):
        for instance in instances:
            if "instruction" not in instance.context_variables:
                raise ValueError(
                    f'Prometheus models expect an instruction. Include an "instruction" context variable in each instance. Found context variables: {list(instance.context_variables.keys())}'
                )

    def _run(
        self,
        instances: Sequence[DirectInstance],
        criteria: Sequence[CriteriaWithOptions],
    ) -> Sequence[DirectInstanceResult]:
        from prometheus_eval import PrometheusEval
        from prometheus_eval.prompts import ABSOLUTE_PROMPT, SCORE_RUBRIC_TEMPLATE
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

        instructions = [instance.response for instance in instances]
        responses = [instance.response for instance in instances]

        model = VLLM(model=self.m_prometheus_model_name, max_model_len=4096)
        # model = LiteLLM(f"huggingface/{self.m_prometheus_model_name}")
        judge = PrometheusEval(model=model, absolute_grade_template=ABSOLUTE_PROMPT)

        feedbacks, scores = judge.absolute_grade(
            instructions=instructions,
            responses=responses,
            rubric=parsed_criteria,
        )

        return [
            DirectInstanceResult(
                option=criterion.options[score - 1].name,
                score=score,
                explanation=feedback,
                positional_bias=DirectPositionalBias(
                    detected=False,
                ),
            )
            for feedback, score, criterion in zip(feedbacks, scores, criteria)
        ]
