from .base import BaseDirectJudge, BaseJudge, BasePairwiseJudge
from .const import DEFAULT_JUDGE_INFERENCE_PARAMS
from .direct_judge import DirectJudge
from .dummy_judge import DummyDirectJudge, DummyPairwiseJudge
from .experimental.criticized_judge import CriticizedDirectJudge
from .experimental.thesis_antithesis_direct_judge import ThesisAntithesisDirectJudge
from .mprometheus_judge import MPrometheusDirectJudge, MPrometheusPairwiseJudge
from .pairwise_judge import PairwiseJudge
from .types import (
    Criteria,
    CriteriaOption,
    DirectInstanceResult,
    DirectPositionalBiasResult,
    Instance,
    MultiCriteria,
    MultiCriteriaDirectInstanceResult,
    MultiCriteriaItem,
    PairwiseInstanceResult,
    PairwisePositionalBiasResult,
    SingleSystemPairwiseInstanceResult,
)
from .unitxt_judges import GraniteGuardianJudge, UnitxtDirectJudge, UnitxtPairwiseJudge

JUDGE_CLASS_MAP = {
    "direct": {
        "eval_assist": DirectJudge,
        "m_prometheus": MPrometheusDirectJudge,
        "criticized": CriticizedDirectJudge,
        "thesis_antithesis": ThesisAntithesisDirectJudge,
        "unitxt": UnitxtDirectJudge,
        "granite_guardian": GraniteGuardianJudge,
    },
    "pairwise": {
        "eval_assist": PairwiseJudge,
        "m_prometheus": MPrometheusPairwiseJudge,
        "unitxt": UnitxtPairwiseJudge,
    },
}

# BASE_PARAMS = {
#     "check_positional_bias": False,
#     "self_consistency": int
# }

# JUDGE_PARAMS_MAP = {
#     'direct': {
#         'eval_assist': {
#             'generate_synthetic_persona': bool,
#             'generate_feedback': bool,
#             'on_generation_failure': ["raise", "random"]
#         },
#         'm_prometheus': {},
#         'criticized': {},
#         'thesis_antithesis': {},
#         'unitxt': {},
#         'granite_guardian': {},
#     },
#     'pairwise': {
#         'eval_assist': {},
#         'm_prometheus': {},
#         'unitxt': {},
#     }
# }


JUDGES_CONFIG = {}

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
    "SingleSystemPairwiseInstanceResult",
    "PairwiseInstanceResult",
    "DirectPositionalBiasResult",
    "PairwisePositionalBiasResult",
    "DirectInstanceResult",
    "DEFAULT_JUDGE_INFERENCE_PARAMS",
    "Criteria",
    "CriteriaOption",
    "MPrometheusDirectJudge",
    "MPrometheusPairwiseJudge",
    "MultiCriteria",
    "MultiCriteriaItem",
    "MultiCriteriaDirectInstanceResult",
    "GraniteGuardianJudge",
]
