from fastapi import HTTPException
from pydantic import BaseModel, validator

from .common import CriteriaModel, EvaluationRequestModel


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

    @validator("options", pre=True, always=True)
    def validate_options_length(cls, options):
        if len(options) < 2:
            raise HTTPException(status_code=400, detail="Rubrics require a minimum of 2 options.")
        return options


class CriteriaOptionAPI(BaseModel):
    name: str
    description: str


class CriteriaWithOptionsAPI(BaseModel):
    name: str
    description: str
    options: list[CriteriaOptionAPI]


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


class DirectResultModel(BaseModel):
    option: str
    summary: str
    positional_bias: bool | None = None
    positional_bias_option: str | None = None

class DirectResponseModel(BaseModel):
    results: list[DirectResultModel]


