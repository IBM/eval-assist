from .base import BaseDirectJudge, BasePairwiseJudge
from .types import (
    Criteria,
    DirectInstance,
    DirectInstanceResult,
    DirectPositionalBias,
    PairwiseInstance,
    PairwiseInstanceResult,
    SingleSystemPairwiseResult,
)


class DummyDirectJudge(BaseDirectJudge):
    def get_name(self) -> str:
        return "dummy"

    def _run(
        self,
        instances: list[DirectInstance],
        criteria: list[Criteria],
    ) -> list[DirectInstanceResult]:
        return [
            DirectInstanceResult(
                instance=instances[0],
                criteria=criteria[0],
                option=criteria[0].options[0].name,
                explanation="explanation",
                positional_bias=DirectPositionalBias(
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
        instances: list[PairwiseInstance],
        criteria: list[Criteria],
    ) -> list[PairwiseInstanceResult]:
        results: list[PairwiseInstanceResult] = []
        systems_per_instance = len(instances[0].responses)
        comparisons_per_instance = systems_per_instance - 1
        for i, instance in enumerate(instances):
            instance_result: dict[str, SingleSystemPairwiseResult] = {}
            instance_result[f"system_{i}"] = SingleSystemPairwiseResult(
                contest_results=[True for _ in range(comparisons_per_instance)],
                compared_to=[True for _ in range(comparisons_per_instance)],
                explanations=["Explanations" for _ in range(comparisons_per_instance)],
                positional_bias=[False for _ in range(comparisons_per_instance)],
                winrate=1.0,
                ranking=1,
                selections=["1" for _ in range(comparisons_per_instance)],
            )
            results.append(PairwiseInstanceResult(instance_result))
        return results
