from pydantic import BaseModel, validator
from fastapi import HTTPException
from typing import List, Optional

class RubricOptionModel(BaseModel):
    option: str
    description: str

    @validator('option', pre=True, always=True)
    def validate_option(cls, option):
        if len(option.strip()) == 0:
            raise HTTPException(status_code=400, detail="Invalid criteria, empty rubric answers are not allowed.")
        return option

class RubricModel(BaseModel):
    name: str
    criteria: str
    options: List[RubricOptionModel]

    @validator('criteria', pre=True, always=True)
    def validate_criteria(cls, criteria):
        if len(criteria.strip()) == 0:
            raise HTTPException(status_code=400, detail="Rubric criteria is required.")
        return criteria

    @validator('options', pre=True, always=True)
    def validate_options_length(cls, options):
        if len(options) < 2:
            raise HTTPException(status_code=400, detail="Rubrics require a minimum of 2 options.")
        return options

class RubricEvalRequestModel(BaseModel):
    context: str
    responses: List[str]
    rubric: RubricModel
    bam_api_key: str
    pipeline: str

    @validator('bam_api_key', pre=True, always=True)
    def validate_api_key(cls, key):
        if not key:
            raise HTTPException(status_code=400, detail="A valid API Key is required.")
        return key

    @validator('pipeline', pre=True, always=True)
    def validate_pipeline(cls, pipeline):
        if not pipeline:
            raise HTTPException(status_code=400, detail="A valid pipeline name is required.")
        return pipeline
    
    @validator('responses', pre=True, always=True)
    def validate_responses_length(cls, responses):
        if len(responses) == 0:
            raise HTTPException(status_code=400, detail="At least one response is required to evaluate.")
        all_invalid = True
        for r in responses:
            if len(r.strip()) > 0:
                all_invalid = False
                break
        if all_invalid:
            raise HTTPException(status_code=400, detail="At least one response is required to evaluate.")
        return responses

class RubricEvalResultModel(BaseModel):
    option: str
    explanation: str
    p_bias: Optional[bool] = None
    entropy: Optional[float] = None

class RubricEvalResponseModel(BaseModel):
    results: List[RubricEvalResultModel]

