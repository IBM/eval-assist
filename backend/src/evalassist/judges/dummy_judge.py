from typing import cast

from evalassist.judges.utils import get_to_evaluate_text

from .base import BaseDirectJudge, BasePairwiseJudge
from .types import (
    Criteria,
    DirectInstanceResult,
    DirectPositionalBiasResult,
    Instance,
    PairwiseInstanceResult,
    SingleSystemPairwiseInstanceResult,
)


class DummyDirectJudge(BaseDirectJudge):
    def get_name(self) -> str:
        return "dummy"

    def _run(
        self,
        instances: list[Instance],
        criteria: list[Criteria],
    ) -> list[DirectInstanceResult]:
        return [
            DirectInstanceResult(
                instance=instances[0],
                criteria=criteria[0],
                selected_option=criteria[0].options[0].name,
                explanation="explanation",
                positional_bias=DirectPositionalBiasResult(
                    detected=False,
                ),
            )
            for _ in range(len(instances))
        ]


class DummyPairwiseJudge(BasePairwiseJudge):
    def get_name(self) -> str:
        return "dummy"

    def _run(
        self,
        instances: list[Instance],
        criteria: list[Criteria],
    ) -> list[PairwiseInstanceResult]:
        results: list[PairwiseInstanceResult] = []
        systems_per_instance = len(
            cast(list[str], get_to_evaluate_text(instances[0], criteria[0]))
        )
        comparisons_per_instance = systems_per_instance - 1
        for i, instance in enumerate(instances):
            instance_result: list[SingleSystemPairwiseInstanceResult] = []
            instance_result.append(
                SingleSystemPairwiseInstanceResult(
                    contest_results=[True for _ in range(comparisons_per_instance)],
                    compared_to=[True for _ in range(comparisons_per_instance)],
                    explanations=[
                        "Explanations" for _ in range(comparisons_per_instance)
                    ],
                    positional_bias=[False for _ in range(comparisons_per_instance)],
                    winrate=1.0,
                    ranking=1,
                    selections=[1 for _ in range(comparisons_per_instance)],
                )
            )
            results.append(
                PairwiseInstanceResult(
                    selected_option="0",
                    per_system_results=instance_result,
                )
            )
        return results
