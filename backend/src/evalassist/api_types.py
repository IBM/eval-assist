from collections.abc import Sequence
from enum import Enum

from fastapi import HTTPException
from pydantic import BaseModel, RootModel, field_validator
from unitxt.llm_as_judge import EvaluatorNameEnum, EvaluatorTypeEnum, ModelProviderEnum

from .extended_unitxt import ExtendedEvaluatorNameEnum, ExtendedModelProviderEnum
from .judges.types import (
    DirectInstance,
    DirectInstanceResult,
    Instance,
    PairwiseInstance,
    PairwiseInstanceResult,
)
from .model import StoredTestCase


class TaskEnum(str, Enum):
    SUMMARIZATION = "Summarization"
    TEXT_GENERATION = "Text Generation"
    QUESTION_ANSWERING = "Question Answering"


class DomainEnum(str, Enum):
    NEWS_MEDIA_DOMAIN = "News Media"
    HEALTHCARE = "Healthcare"
    ENTERTAINMENT_AND_POP_CULTURE = "Entertainment And Pop Culture"

    SOCIAL_MEDIA = "Social Media"
    CUSTOMER_SUPPORT_AND_BUSSINESS = "Custumer Support And Business"
    GAMING_AND_ENTERTAINMENT = "Gaming And Entertainment"


class PersonaEnum(str, Enum):
    EXPERIENCED_JOURNALIST = "Experienced journalist"
    NOVICE_JOURNALIST = "Novice journalist"
    OPINION_COLUMNIST = "Opinion columnist"
    NEWS_ANCHOR = "News anchor"
    EDITOR = "Editor"

    MEDICAL_RESEARCHER = "Medical researcher"
    GENERAL_PRACTITIONER = "General practitioner"
    PUBLIC_HEALTH_OFFICIAL = "Public health official"
    HEALTH_BLOGGER = "Health blogger"
    MEDICAL_STUDENT = "Medical student"

    FILM_CRITIC = "Film critic"
    CASUAL_SOCIAL_MEDIA_USER = "Casual social media user"
    TABLOID_REPORTER = "Tabloid reporter"
    HARDCORE_FAN_THEORIST = "Hardcore fan/Theorist"
    INFLUENCER_YOUTUBE_REVIEWER = "Inlfuencer/Youtube reviewer"

    INFLUENCER_POSITIVE_BRAND = "Influencer (Positive brand)"
    INTERNET_TROLL = "Internet troll"
    POLITICAL_ACTIVIST = "Political activist (polarizing)"
    BRAND_VOICE = "Brand voice (Corporate social media account)"
    MEMER = "Memer (Meme creator)"
    CUSTOMER_SERVICE_AGENT = "Customer service agent"
    ANGRY_CUSTOMER = "Angry customer"
    CORPORATE_CEO = "Corporate CEO"
    CONSUMER_ADVOCATE = "Consumer advocate"
    MAKETING_SPECIALIST = "Marketing specialist"

    FLAMER = "Flamer (Agressive player)"
    HARDCORE_GAMER = "Hardcore gamer"
    ESPORT_COMENTATOR = "Esport commentator"
    MOVIE_CRITIC = "Movie critic"
    FAN = "Fan (of a TV show, movie, or game)"


class GenerationLengthEnum(str, Enum):
    SHORT = "Short"
    MEDIUM = "Medium"
    LONG = "Long"


class DirectActionTypeEnum(str, Enum):
    REGENERATE = "Regenerate"
    REPHRASE = "Rephrase"
    LONGER = "Elaborate"
    SHORTER = "Shorten"
    CUSTOM = "Custom"


class CriteriaDTO(BaseModel):
    name: str
    description: str
    prediction_field: str
    context_fields: list[str]

    @field_validator("description")
    def validate_criteria(cls, description):
        if len(description.strip()) == 0:
            raise HTTPException(
                status_code=400, detail="Evaluation criteria is required."
            )
        return description


class CriteriaOptionDTO(BaseModel):
    name: str
    description: str


class CriteriaWithOptionsDTO(CriteriaDTO):
    name: str
    description: str
    options: list[CriteriaOptionDTO]


class InstanceDTO(Instance):
    id: str


class DirectInstanceDTO(DirectInstance, InstanceDTO):
    pass


class PairwiseInstanceDTO(PairwiseInstance, InstanceDTO):
    pass


class EvaluationRequest(BaseModel):
    provider: ModelProviderEnum | ExtendedModelProviderEnum
    llm_provider_credentials: dict[str, str | None]
    evaluator_name: str
    type: EvaluatorTypeEnum
    instances: Sequence[DirectInstanceDTO] | Sequence[PairwiseInstanceDTO]
    criteria: CriteriaDTO | CriteriaWithOptionsDTO


class PairwiseInstanceResultDTO(BaseModel):
    id: str
    result: PairwiseInstanceResult


class PairwiseResultDTO(BaseModel):
    results: list[PairwiseInstanceResultDTO]


class NotebookParams(BaseModel):
    test_case_name: str
    criteria: dict
    evaluator_name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum
    provider: ModelProviderEnum
    predictions: list[str | list[str]]
    context_variables: list[dict[str, str]]
    credentials: dict[str, str]
    evaluator_type: EvaluatorTypeEnum
    model_name: str | None = None
    plain_python_script: bool


# class DownloadTestCaseParams(BaseModel):
#     test_case: TestCase


class SyntheticExampleGenerationRequest(BaseModel):
    provider: ModelProviderEnum | ExtendedModelProviderEnum
    llm_provider_credentials: dict[str, str | None]
    evaluator_name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum | str
    type: EvaluatorTypeEnum
    criteria: CriteriaWithOptionsDTO | CriteriaDTO
    generation_length: GenerationLengthEnum | None
    task: TaskEnum | None
    domain: DomainEnum | None
    persona: PersonaEnum | None
    per_criteria_option_count: dict[str, int]
    borderline_count: int


class DirectInstanceResultDTO(BaseModel):
    id: str
    result: DirectInstanceResult


class InstanceResultDTO(BaseModel):
    id: str
    result: DirectInstanceResult | PairwiseInstanceResult


class DirectResultDTO(BaseModel):
    results: list[DirectInstanceResultDTO]


class InstanceResult(RootModel):
    root: DirectInstanceResultDTO | PairwiseInstanceResultDTO


class EvaluationResultDTO(BaseModel):
    results: list[InstanceResultDTO]


class TestModelRequestModel(BaseModel):
    provider: ModelProviderEnum | ExtendedModelProviderEnum
    llm_provider_credentials: dict[str, str | None]
    evaluator_name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum | str


class DirectAIActionRequest(BaseModel):
    action: DirectActionTypeEnum
    selection: str
    text: str
    prompt: str | None = None
    provider: ModelProviderEnum | ExtendedModelProviderEnum
    llm_provider_credentials: dict[str, str | None]
    evaluator_name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum | str
    type: EvaluatorTypeEnum


class DirectAIActionResponse(BaseModel):
    result: str


class FeatureFlagsModel(BaseModel):
    authentication_enabled: bool
    storage_enabled: bool


class PutTestCaseBody(BaseModel):
    user: str
    test_case: StoredTestCase


class DownloadTestCaseBody(BaseModel):
    test_case: StoredTestCase


class DownloadTestDataBody(BaseModel):
    instances: list[DirectInstanceDTO] | list[PairwiseInstanceDTO]
    prediction_field: str


class EvaluatorMetadataAPI(BaseModel):
    name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum | str
    providers: list[ModelProviderEnum | ExtendedModelProviderEnum]


class EvaluatorsResponseModel(BaseModel):
    # model_config = ConfigDict(arbitrary_types_allowed=True)
    evaluators: list[EvaluatorMetadataAPI]


class FixInstanceRequest(BaseModel):
    provider: ModelProviderEnum | ExtendedModelProviderEnum
    llm_provider_credentials: dict[str, str | None]
    evaluator_name: str
    type: EvaluatorTypeEnum
    instance: DirectInstanceDTO
    criteria: CriteriaWithOptionsDTO
    result: DirectInstanceResult


class FixInstanceResponse(BaseModel):
    fixed_response: str
