from typing import Any, Optional

from fastapi import HTTPException
from pydantic import BaseModel, field_validator
from unitxt.llm_as_judge import EvaluatorNameEnum, EvaluatorTypeEnum, ModelProviderEnum

from ..const import ExtendedEvaluatorNameEnum, ExtendedModelProviderEnum
from .types import (
    DirectActionTypeEnum,
    DomainEnum,
    GenerationLengthEnum,
    PersonaEnum,
    TaskEnum,
)


class CriteriaModel(BaseModel):
    name: str
    description: str

    @field_validator("description")
    def validate_criteria(cls, description):
        if len(description.strip()) == 0:
            raise HTTPException(
                status_code=400, detail="Evaluation criteria is required."
            )
        return description


class Instance(BaseModel):
    id: str
    context_variables: dict[str, str]
    response: str | list[str]
    response_variable_name: Optional[str]
    metadata: Optional[dict[str, Any]] = None
    expected_result: str


class EvaluationRequestModel(BaseModel):
    provider: ModelProviderEnum | ExtendedModelProviderEnum
    llm_provider_credentials: dict[str, Optional[str]]
    evaluator_name: str
    type: EvaluatorTypeEnum
    instances: list[Instance]

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

    @field_validator("evaluator_name")
    def validate_pipeline(cls, evaluator_name):
        if not evaluator_name:
            raise HTTPException(
                status_code=400, detail="A valid pipeline name is required."
            )
        return evaluator_name


class PairwiseCriteriaModel(CriteriaModel):
    pass


class CriteriaAPI(BaseModel):
    name: str
    description: str


class PairwiseEvaluationRequestModel(EvaluationRequestModel):
    criteria: PairwiseCriteriaModel

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


class PairwiseResultModel(BaseModel):
    contest_results: list[bool]
    compared_to: list[int]
    explanations: list[str]
    positional_bias: list[bool] | None = None
    certainty: list[float] | None = None
    winrate: float
    ranking: int
    selections: list[str]


class PairwiseInstanceResultModel(BaseModel):
    id: str
    result: dict[str, PairwiseResultModel]


class PairwiseResponseModel(BaseModel):
    results: list[PairwiseInstanceResultModel]


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


class CriteriaOptionAPI(BaseModel):
    name: str
    description: str


class CriteriaWithOptionsAPI(BaseModel):
    name: str
    description: str
    options: list[CriteriaOptionAPI]
    prediction_field: Optional[str] = None
    context_fields: Optional[list[str]] = None


class SyntheticExampleGenerationRequest(BaseModel):
    provider: ModelProviderEnum | ExtendedModelProviderEnum
    llm_provider_credentials: dict[str, Optional[str]]
    evaluator_name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum | str
    type: EvaluatorTypeEnum
    criteria: CriteriaWithOptionsAPI | PairwiseCriteriaModel
    response_variable_name: str
    context_variables_names: list[str]
    generation_length: Optional[GenerationLengthEnum]
    task: Optional[TaskEnum]
    domain: Optional[DomainEnum]
    persona: Optional[PersonaEnum]
    per_criteria_option_count: dict[str, int]
    borderline_count: int


class RubricOptionModel(BaseModel):
    option: str
    description: str

    # @validator('option', pre=True, always=True)
    # def validate_option(cls, option):
    #     if len(option.strip()) == 0:
    #         raise HTTPException(status_code=400, detail="Invalid criteria, empty rubric answers are not allowed.")
    #     return option


class RubricCriteriaModel(CriteriaModel):
    options: list[RubricOptionModel]

    @field_validator("options")
    def validate_options_length(cls, options):
        if len(options) < 2:
            raise HTTPException(
                status_code=400, detail="Rubrics require a minimum of 2 options."
            )
        return options


class DirectEvaluationRequestModel(EvaluationRequestModel):
    criteria: CriteriaWithOptionsAPI | str
    response_variable_name: str

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


class DirectPositionalBias(BaseModel):
    detected: bool
    option: str = ""
    explanation: str = ""


class DirectResultModel(BaseModel):
    option: str
    explanation: str
    positional_bias: DirectPositionalBias


class DirectInstanceResultModel(BaseModel):
    id: str
    result: DirectResultModel


class DirectResponseModel(BaseModel):
    results: list[DirectInstanceResultModel]


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
