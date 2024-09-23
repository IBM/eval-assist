from pydantic import BaseModel, validator
from fastapi import HTTPException
from typing import List, Literal, Optional
from llmasajudge.evaluators import  EvaluatorTypeEnum

from .common import CriteriaModel, EvalRequestModel

class RubricOptionModel(BaseModel):
    option: str
    description: str

    @validator('option', pre=True, always=True)
    def validate_option(cls, option):
        if len(option.strip()) == 0:
            raise HTTPException(status_code=400, detail="Invalid criteria, empty rubric answers are not allowed.")
        return option

class RubricCriteriaModel(CriteriaModel):
    options: List[RubricOptionModel]

    @validator('options', pre=True, always=True)
    def validate_options_length(cls, options):
        if len(options) < 2:
            raise HTTPException(status_code=400, detail="Rubrics require a minimum of 2 options.")
        return options

class RubricEvalRequestModel(EvalRequestModel):
    criteria: RubricCriteriaModel

    @validator('responses', pre=True, always=True)
    def validate_responses_length(cls, responses):
        # if len(responses) == 0:
        #     raise HTTPException(status_code=400, detail="At least one response is required to evaluate.")
        
        all_valid = True
        for r in responses:
            if len(r.strip()) == 0:
                all_valid = False
                break
        if not all_valid:
            raise HTTPException(status_code=400, detail="Responses can't be an empty string.")
        
        return responses

class RubricEvalResultModel(BaseModel):
    option: str
    explanation: str
    p_bias: Optional[bool] = None
    certainty: Optional[float] = None

class RubricEvalResponseModel(BaseModel):
    results: List[RubricEvalResultModel]

