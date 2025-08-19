from enum import Enum

from unitxt.inference import HFAutoModelInferenceEngine
from unitxt.llm_as_judge_constants import (
    EVALUATOR_TO_MODEL_ID,
    EVALUATORS_METADATA,
    EvaluatorMetadata,
    EvaluatorNameEnum,
    ModelProviderEnum,
)


class ExtendedEvaluatorNameEnum(Enum):
    """This enums adds models that are not present in the original unitxt EvaluatorNameEnum"""

    GRANITE_GUARDIAN3_1_2B = "Granite Guardian 3.1 2b"
    GRANITE_GUARDIAN3_1_8B = "Granite Guardian 3.1 8b"
    GRANITE_GUARDIAN3_2_3B = "Granite Guardian 3.2 3b"
    GRANITE_GUARDIAN3_2_5B = "Granite Guardian 3.2 5b"
    GRANITE_GUARDIAN3_3_8B = "Granite Guardian 3.3 8b"
    LLAMA_3_3_70B_FREE = "Llama 3.3 70B Free"
    DEEPSEEK_R1_DISTILLED_LLAMA_70B_FREE = "DeepSeek R1 Distilled Llama 70B Free"
    PHI4 = "Phi-4"
    MIXTRAL_SMALL = "Mixtral Small"
    MIXTRAL_MEDIUM = "Mixtral Medium"
    GPT_OSS_20B = "GPT OSS 20b"
    GPT_OSS_120B = "GPT OSS 120b"
    CUSTOM = "custom"


class ExtendedModelProviderEnum(str, Enum):
    HF_LOCAL = "hf-local"
    OPENAI_LIKE = "open-ai-like"


EXTENDED_INFERENCE_ENGINE_NAME_TO_CLASS = {
    ExtendedModelProviderEnum.HF_LOCAL: HFAutoModelInferenceEngine,
}

EXTENDED_EVALUATOR_TO_MODEL_ID = {
    **EVALUATOR_TO_MODEL_ID,
    ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_1_2B: "granite-guardian-3-1-2b",
    ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_1_8B: "granite-guardian-3-1-8b",
    ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_2_3B: "granite-guardian-3-2-3b",
    ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_2_5B: "granite-guardian-3-2-5b",
    ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_3_8B: "granite-guardian-3-3-8b",
    ExtendedEvaluatorNameEnum.LLAMA_3_3_70B_FREE: "llama-3-3-70b-instruct-free",
    ExtendedEvaluatorNameEnum.DEEPSEEK_R1_DISTILLED_LLAMA_70B_FREE: "deepseek-r1-distilled-llama-70b-free",
    ExtendedEvaluatorNameEnum.PHI4: "phi4",
    ExtendedEvaluatorNameEnum.MIXTRAL_SMALL: "mistral-small-instruct",
    ExtendedEvaluatorNameEnum.MIXTRAL_MEDIUM: "mistral-medium-instruct",
    ExtendedEvaluatorNameEnum.GPT_OSS_20B: "gpt-oss-20b",
    ExtendedEvaluatorNameEnum.GPT_OSS_120B: "gpt-oss-120b",
}


class ExtendedEvaluatorMetadata(EvaluatorMetadata):
    name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum
    custom_model_name: str | None = None
    custom_model_path: str | None = None
    providers: list[ModelProviderEnum | ExtendedModelProviderEnum]

    def __init__(
        self,
        name,
        providers: list[ModelProviderEnum | ExtendedModelProviderEnum],
        custom_model_name: str | None = None,
        custom_model_path: str | None = None,
    ):
        super().__init__(name, providers)
        self.custom_model_name = custom_model_name
        self.custom_model_path = custom_model_path


EXTENDED_EVALUATORS_METADATA: list[ExtendedEvaluatorMetadata] = [
    ExtendedEvaluatorMetadata(e.name, e.providers) for e in EVALUATORS_METADATA
] + [
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_1_2B,
        [ModelProviderEnum.WATSONX, ExtendedModelProviderEnum.HF_LOCAL],
    ),
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_1_8B,
        [ModelProviderEnum.WATSONX, ExtendedModelProviderEnum.HF_LOCAL],
    ),
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_2_3B,
        [ExtendedModelProviderEnum.HF_LOCAL, ModelProviderEnum.RITS],
    ),
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_2_5B,
        [
            ModelProviderEnum.WATSONX,
            ExtendedModelProviderEnum.HF_LOCAL,
            ModelProviderEnum.RITS,
        ],
    ),
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_3_8B,
        [ExtendedModelProviderEnum.HF_LOCAL, ModelProviderEnum.RITS],
    ),
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.DEEPSEEK_R1_DISTILLED_LLAMA_70B_FREE,
        [ModelProviderEnum.TOGETHER_AI],
    ),
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.LLAMA_3_3_70B_FREE, [ModelProviderEnum.TOGETHER_AI]
    ),
    ExtendedEvaluatorMetadata(ExtendedEvaluatorNameEnum.PHI4, [ModelProviderEnum.RITS]),
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.MIXTRAL_SMALL,
        [ModelProviderEnum.RITS, ModelProviderEnum.WATSONX],
    ),
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.MIXTRAL_MEDIUM, [ModelProviderEnum.WATSONX]
    ),
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.GPT_OSS_20B, [ModelProviderEnum.RITS]
    ),
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.GPT_OSS_120B, [ModelProviderEnum.RITS]
    ),
]
