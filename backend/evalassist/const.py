from enum import Enum
from typing import Optional

from unitxt.inference import HFAutoModelInferenceEngine
from unitxt.llm_as_judge import (
    EVALUATOR_TO_MODEL_ID,
    EVALUATORS_METADATA,
    INFERENCE_ENGINE_NAME_TO_CLASS,
    EvaluatorMetadata,
    EvaluatorNameEnum,
    ModelProviderEnum,
)


class ExtendedEvaluatorNameEnum(Enum):
    """This enums adds models that are not present in the original unitxt EvaluatorNameEnum"""

    GRANITE_GUARDIAN3_1_2B = "Granite Guardian 3.1 2B"
    GRANITE_GUARDIAN3_1_8B = "Granite Guardian 3.1 8B"
    GRANITE_GUARDIAN3_2_3B = "Granite Guardian 3.2 3B"
    GRANITE_GUARDIAN3_2_5B = "Granite Guardian 3.2 5B"
    CUSTOM = "custom"


class ExtendedModelProviderEnum(str, Enum):
    LOCAL_HF = "local_hf"


EXTENDED_INFERENCE_ENGINE_NAME_TO_CLASS = {
    **INFERENCE_ENGINE_NAME_TO_CLASS,
    ExtendedModelProviderEnum.LOCAL_HF: HFAutoModelInferenceEngine,
}

EXTENDED_EVALUATOR_TO_MODEL_ID = {
    **EVALUATOR_TO_MODEL_ID,
    ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_1_2B: "ibm/granite-guardian-3-2b",
    ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_1_8B: "ibm/granite-guardian-3-8b",
}


class ExtendedEvaluatorMetadata(EvaluatorMetadata):
    name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum
    custom_model_name: Optional[str]
    custom_model_path: Optional[str]
    providers: list[ModelProviderEnum | ExtendedModelProviderEnum]

    def __init__(
        self,
        name,
        providers: ModelProviderEnum | ExtendedModelProviderEnum,
        custom_model_name: Optional[str] = None,
        custom_model_path: Optional[str] = None,
    ):
        super().__init__(name, providers)
        self.custom_model_name = custom_model_name
        self.custom_model_path = custom_model_path


EXTENDED_EVALUATORS_METADATA: list[ExtendedEvaluatorMetadata] = [
    ExtendedEvaluatorMetadata(e.name, e.providers) for e in EVALUATORS_METADATA
] + [
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_1_2B,
        [ModelProviderEnum.WATSONX, ExtendedModelProviderEnum.LOCAL_HF],
    ),
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_1_8B,
        [ModelProviderEnum.WATSONX, ExtendedModelProviderEnum.LOCAL_HF],
    ),
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_2_3B,
        [ExtendedModelProviderEnum.LOCAL_HF],
    ),
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_2_5B,
        [ExtendedModelProviderEnum.LOCAL_HF],
    ),
]
