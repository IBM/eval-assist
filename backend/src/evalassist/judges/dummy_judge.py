from collections.abc import Sequence

from evalassist.judges.base import DirectJudge, PairwiseJudge

from ..api.common import (
    DirectInstance,
    DirectInstanceResult,
    DirectPositionalBias,
    PairwiseInstance,
    PairwiseInstanceResult,
    SingleSystemPairwiseResult,
)


class DummyDirectJudge(DirectJudge):
    def evaluate(
        self, instances: Sequence[DirectInstance]
    ) -> Sequence[DirectInstanceResult]:
        return [
            DirectInstanceResult(
                option=self.criteria.options[0].name,
                explanation="explanation",
                positional_bias=DirectPositionalBias(
                    detected=False,
                ),
            )
            for _ in range(len(instances))
        ]


class DummyPairwiseJudge(PairwiseJudge):
    def evaluate(
        self, instances: Sequence[PairwiseInstance]
    ) -> Sequence[PairwiseInstanceResult]:
        results: list[PairwiseInstanceResult] = []
        systems_per_instance = len(instances[0].responses) - 1
        for i, instance in enumerate(instances):
            instance_result: dict[str, SingleSystemPairwiseResult] = {}
            instance_result[f"system_{i}"] = SingleSystemPairwiseResult(
                contest_results=[True for _ in range(systems_per_instance)],
                compared_to=[True for _ in range(systems_per_instance)],
                explanations=["Explanations" for _ in range(systems_per_instance)],
                positional_bias=[False for _ in range(systems_per_instance)],
                winrate=1.0,
                ranking=1,
                selections=["1" for _ in range(systems_per_instance)],
            )
            results.append(PairwiseInstanceResult(instance_result))
        return results
