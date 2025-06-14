import os
from enum import Enum
from pathlib import Path
from typing import Optional

from unitxt.inference import HFAutoModelInferenceEngine
from unitxt.llm_as_judge import (
    EVALUATOR_TO_MODEL_ID,
    EVALUATORS_METADATA,
    EvaluatorMetadata,
    EvaluatorNameEnum,
    ModelProviderEnum,
)

from .api.types import DomainEnum, GenerationLengthEnum, PersonaEnum


class ExtendedEvaluatorNameEnum(Enum):
    """This enums adds models that are not present in the original unitxt EvaluatorNameEnum"""

    GRANITE_GUARDIAN3_1_2B = "Granite Guardian 3.1 2B"
    GRANITE_GUARDIAN3_1_8B = "Granite Guardian 3.1 8B"
    GRANITE_GUARDIAN3_2_3B = "Granite Guardian 3.2 3B"
    GRANITE_GUARDIAN3_2_5B = "Granite Guardian 3.2 5B"
    LLAMA_3_3_70B_FREE = "Llama 3.3 70B Free"
    DEEPSEEK_R1_DISTILLED_LLAMA_70B_FREE = "DeepSeek R1 Distilled Llama 70B Free"
    CUSTOM = "custom"


class ExtendedModelProviderEnum(str, Enum):
    LOCAL_HF = "local_hf"
    OPENAI_LIKE = "open-ai-like"


EXTENDED_INFERENCE_ENGINE_NAME_TO_CLASS = {
    ExtendedModelProviderEnum.LOCAL_HF: HFAutoModelInferenceEngine,
}

EXTENDED_EVALUATOR_TO_MODEL_ID = {
    **EVALUATOR_TO_MODEL_ID,
    ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_1_2B: "ibm/granite-guardian-3-2b",
    ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_1_8B: "ibm/granite-guardian-3-8b",
    ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_2_3B: "ibm-granite/granite-guardian-3.2-3b-a800m",
    ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_2_5B: "ibm-granite/granite-guardian-3.2-5b",
    ExtendedEvaluatorNameEnum.LLAMA_3_3_70B_FREE: "llama-3-3-70b-instruct-free",
    ExtendedEvaluatorNameEnum.DEEPSEEK_R1_DISTILLED_LLAMA_70B_FREE: "deepseek-r1-distilled-llama-70b-free",
}


class ExtendedEvaluatorMetadata(EvaluatorMetadata):
    name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum
    custom_model_name: Optional[str] = None
    custom_model_path: Optional[str] = None
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
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.DEEPSEEK_R1_DISTILLED_LLAMA_70B_FREE,
        [ModelProviderEnum.TOGETHER_AI],
    ),
    ExtendedEvaluatorMetadata(
        ExtendedEvaluatorNameEnum.LLAMA_3_3_70B_FREE, [ModelProviderEnum.TOGETHER_AI]
    ),
]

domain_persona_map = {
    DomainEnum.NEWS_MEDIA_DOMAIN: [
        PersonaEnum.EXPERIENCED_JOURNALIST,
        PersonaEnum.NOVICE_JOURNALIST,
        PersonaEnum.OPINION_COLUMNIST,
        PersonaEnum.NEWS_ANCHOR,
        PersonaEnum.EDITOR,
    ],
    DomainEnum.HEALTHCARE: [
        PersonaEnum.MEDICAL_RESEARCHER,
        PersonaEnum.GENERAL_PRACTITIONER,
        PersonaEnum.PUBLIC_HEALTH_OFFICIAL,
        PersonaEnum.HEALTH_BLOGGER,
        PersonaEnum.MEDICAL_STUDENT,
    ],
    DomainEnum.ENTERTAINMENT_AND_POP_CULTURE: [
        PersonaEnum.FILM_CRITIC,
        PersonaEnum.CASUAL_SOCIAL_MEDIA_USER,
        PersonaEnum.TABLOID_REPORTER,
        PersonaEnum.HARDCORE_FAN_THEORIST,
        PersonaEnum.INFLUENCER_YOUTUBE_REVIEWER,
    ],
    DomainEnum.SOCIAL_MEDIA: [
        PersonaEnum.INFLUENCER_POSITIVE_BRAND,
        PersonaEnum.INTERNET_TROLL,
        PersonaEnum.POLITICAL_ACTIVIST,
        PersonaEnum.BRAND_VOICE,
        PersonaEnum.MEMER,
    ],
    DomainEnum.CUSTOMER_SUPPORT_AND_BUSSINESS: [
        PersonaEnum.CUSTOMER_SERVICE_AGENT,
        PersonaEnum.ANGRY_CUSTOMER,
        PersonaEnum.CORPORATE_CEO,
        PersonaEnum.CONSUMER_ADVOCATE,
        PersonaEnum.MAKETING_SPECIALIST,
    ],
    DomainEnum.GAMING_AND_ENTERTAINMENT: [
        PersonaEnum.FLAMER,
        PersonaEnum.HARDCORE_GAMER,
        PersonaEnum.ESPORT_COMENTATOR,
        PersonaEnum.MOVIE_CRITIC,
        PersonaEnum.FAN,
    ],
}

generation_length_to_sentence_count = {
    GenerationLengthEnum.SHORT: "1-2 sentences",
    GenerationLengthEnum.MEDIUM: "3-5 sentences",
    GenerationLengthEnum.LONG: "5-9 sentences",
}


EVAL_ASSIST_DIR = Path(__file__).parent
STATIC_DIR = Path(os.getenv("DATA_DIR", EVAL_ASSIST_DIR / "static"))
DATA_DIR = Path(os.getenv("STATIC_DIR", EVAL_ASSIST_DIR / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DATA_DIR}/evalassist.db")

print(f"EVAL_ASSIST_DIR: {EVAL_ASSIST_DIR}")
print(f"DATABASE_URL: {DATABASE_URL}")
