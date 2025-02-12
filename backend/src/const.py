from enum import Enum
from unitxt.llm_as_judge import EvaluatorNameEnum, EVALUATOR_TO_MODEL_ID, EVALUATORS_METADATA, EvaluatorMetadata, ModelProviderEnum

class ExtendedEvaluatorNameEnum(Enum):
    """This enums adds models that are not present in the original unitxt EvaluatorNameEnum"""
    GRANITE_GUARDIAN3_1_2B = "Granite Guardian 3.1 2B"
    GRANITE_GUARDIAN3_1_8B = "Granite Guardian 3.1 8B"


EXTENDED_EVALUATOR_TO_MODEL_ID = {
    **EVALUATOR_TO_MODEL_ID,
    ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_1_2B: "ibm/granite-guardian-3-2b",
    ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_1_8B: "ibm/granite-guardian-3-8b",
}
    
EXTENDED_EVALUATORS_METADATA = EVALUATORS_METADATA + [
    EvaluatorMetadata(
        ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_1_2B,
        [ModelProviderEnum.WATSONX],
    ),
    EvaluatorMetadata(
        ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_1_8B,
        [ModelProviderEnum.WATSONX],
    ),
]