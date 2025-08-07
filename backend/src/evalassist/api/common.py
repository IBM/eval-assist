from typing import Any, Optional, Sequence

from fastapi import HTTPException
from pydantic import BaseModel, RootModel, field_validator
from unitxt.llm_as_judge import EvaluatorNameEnum, EvaluatorTypeEnum, ModelProviderEnum

from ..const import ExtendedEvaluatorNameEnum, ExtendedModelProviderEnum
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


class Instance(BaseModel):
    context_variables: dict[str, str]
    metadata: dict[str, Any] | None = None


class DirectInstance(Instance):
    response: str


class PairwiseInstance(Instance):
    responses: list[str]


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

    # @validator("llm_provider_credentials", pre=True, always=True)
    # def validate_api_key(cls, key):
    #     if not key:
    #         raise HTTPException(status_code=400, detail="API credentials are required.")
    #     return key

    # @validator("context_variables", pre=True, always=True)
    # def validate_context_variables_key(cls, context_variables):
    #     for context_variable_name in context_variables.keys():
    #         if context_variable_name == "":
    #             raise HTTPException(status_code=400, detail="Context variable names can't be empty.")
    #     return context_variables


class PairwiseEvaluationRequest(EvaluationRequest):
    criteria: CriteriaDTO

    # @validator("responses", pre=True, always=True)
    # def validate_responses_length(cls, responses):
    #     # if len(responses) < 2:
    #     #     raise HTTPException(status_code=400, detail="At least two responses are required to evaluate.")

    # all_valid = True
    # for r in responses:
    #     if len(r.strip()) == 0:
    #         all_valid = False
    #         break
    # if not all_valid:
    #     raise HTTPException(status_code=400, detail="Responses can't be an empty string.")

    # return responses


class DirectEvaluationRequestModel(EvaluationRequest):
    criteria: CriteriaWithOptionsDTO

    # @validator("responses", pre=True, always=True)
    # def validate_responses_length(cls, responses):
    #     # if len(responses) == 0:
    #     #     raise HTTPException(status_code=400, detail="At least one response is required to evaluate.")

    #     all_valid = True
    #     for r in responses:
    #         if len(r.strip()) == 0:
    #             all_valid = False
    #             break
    #     if not all_valid:
    #         raise HTTPException(status_code=400, detail="Responses can't be an empty string.")

    #     return responses


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
    model_name: Optional[str] = None
    plain_python_script: bool


# class DownloadTestCaseParams(BaseModel):
#     test_case: TestCase


class SyntheticExampleGenerationRequest(BaseModel):
    provider: ModelProviderEnum | ExtendedModelProviderEnum
    llm_provider_credentials: dict[str, Optional[str]]
    evaluator_name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum | str
    type: EvaluatorTypeEnum
    criteria: CriteriaWithOptionsDTO | CriteriaDTO
    generation_length: Optional[GenerationLengthEnum]
    task: Optional[TaskEnum]
    domain: Optional[DomainEnum]
    persona: Optional[PersonaEnum]
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
    llm_provider_credentials: dict[str, Optional[str]]
    evaluator_name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum | str


class DirectAIActionRequest(BaseModel):
    action: DirectActionTypeEnum
    selection: str
    text: str
    prompt: Optional[str] = None
    provider: ModelProviderEnum | ExtendedModelProviderEnum
    llm_provider_credentials: dict[str, Optional[str]]
    evaluator_name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum | str
    type: EvaluatorTypeEnum


class DirectAIActionResponse(BaseModel):
    result: str


class FeatureFlagsModel(BaseModel):
    authentication_enabled: bool
    storage_enabled: bool
