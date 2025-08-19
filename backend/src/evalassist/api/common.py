from abc import ABC, abstractmethod
from collections.abc import Sequence
from typing import Any

from fastapi import HTTPException
from pydantic import BaseModel, RootModel, field_validator
from unitxt.llm_as_judge import EvaluatorNameEnum, EvaluatorTypeEnum, ModelProviderEnum

from ..database import StoredTestCase
from ..extended_unitxt import ExtendedEvaluatorNameEnum, ExtendedModelProviderEnum
from .types import (
    DirectActionTypeEnum,
    DomainEnum,
    GenerationLengthEnum,
    PersonaEnum,
    TaskEnum,
)


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


class Instance(BaseModel, ABC):
    context_variables: dict[str, str]
    expected_result: str | None = None
    metadata: dict[str, Any] | None = None

    @abstractmethod
    def get_prediction(self) -> Any: ...  # noqa: E704


class DirectInstance(Instance):
    response: str

    def get_prediction(self):
        return self.response


class PairwiseInstance(Instance):
    responses: list[str]

    def get_prediction(self):
        return self.responses


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


class SingleSystemPairwiseResult(BaseModel):
    contest_results: list[bool]
    compared_to: list[int]
    explanations: list[str]
    positional_bias: list[bool] | None = None
    certainty: list[float] | None = None
    winrate: float
    ranking: int
    selections: list[str]


class PairwiseInstanceResult(RootModel):
    root: dict[str, SingleSystemPairwiseResult]


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


class DirectPositionalBias(BaseModel):
    detected: bool
    option: str = ""
    explanation: str = ""


class DirectInstanceResult(BaseModel):
    option: str
    explanation: str
    positional_bias: DirectPositionalBias
    metadata: dict[str, Any] | None = None


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
