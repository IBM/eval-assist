import asyncio

from .base import (
    BaseDirectJudge,
    BaseJudge,
    BasePairwiseJudge,
    UnitxtInferenceLangchainRunnable,
)
from .const import DEFAULT_JUDGE_INFERENCE_PARAMS
from .direct_judge import DirectJudge
from .dummy_judge import DummyDirectJudge, DummyPairwiseJudge
from .mprometheus_judge import MPrometheusDirectJudge, MPrometheusPairwiseJudge
from .pairwise_judge import PairwiseJudge
from .types import (
    Criteria,
    CriteriaOption,
    DirectInstance,
    DirectInstanceResult,
    DirectPositionalBiasResult,
    Instance,
    MultiCriteria,
    MultiCriteriaDirectInstanceResult,
    MultiCriteriaItem,
    PairwiseInstance,
    PairwiseInstanceResult,
    PairwisePositionalBiasResult,
    SingleSystemPairwiseInstanceResult,
)
from .unitxt_judges import GraniteGuardianJudge, UnitxtDirectJudge, UnitxtPairwiseJudge


class SafeEventLoopPolicy(asyncio.DefaultEventLoopPolicy):
    def get_event_loop(self):
        try:
            return super().get_event_loop()
        except RuntimeError:
            loop = self.new_event_loop()
            self.set_event_loop(loop)
            return loop


asyncio.set_event_loop_policy(SafeEventLoopPolicy())

__all__: list[str] = [
    "BaseJudge",
    "DummyDirectJudge",
    "DummyPairwiseJudge",
    "DirectJudge",
    "PairwiseJudge",
    "UnitxtDirectJudge",
    "UnitxtPairwiseJudge",
    "BaseDirectJudge",
    "BasePairwiseJudge",
    "Instance",
    "DirectInstance",
    "PairwiseInstance",
    "SingleSystemPairwiseInstanceResult",
    "PairwiseInstanceResult",
    "DirectPositionalBiasResult",
    "PairwisePositionalBiasResult",
    "DirectInstanceResult",
    "DEFAULT_JUDGE_INFERENCE_PARAMS",
    "Criteria",
    "CriteriaOption",
    "UnitxtInferenceLangchainRunnable",
    "MPrometheusDirectJudge",
    "MPrometheusPairwiseJudge",
    "MultiCriteria",
    "MultiCriteriaItem",
    "MultiCriteriaDirectInstanceResult",
    "GraniteGuardianJudge",
]
