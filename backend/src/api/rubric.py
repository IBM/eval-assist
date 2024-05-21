from pydantic import BaseModel, validator
from typing import List, Optional

class RubricOptionModel(BaseModel):
    option: str
    description: str

class RubricModel(BaseModel):
    criteria: str
    options: List[RubricOptionModel]

    @validator('options', pre=True, always=True)
    def validate_options_length(cls, value):
        if len(value) < 2:
            raise ValueError("Rubrics require min. 2 options.")
        return value

class RubricEvalRequestModel(BaseModel):
    context: str
    responses: List[str]
    rubric: RubricModel
    bam_api_key: str
    pipeline: str

    @validator('bam_api_key', pre=True, always=True)
    def validate_api_key(cls, key):
        if not key:
            raise ValueError("API Key is required.")
        return key

    @validator('pipeline', pre=True, always=True)
    def validate_pipeline(cls, pipeline):
        if not pipeline:
            raise ValueError("Pipeline name is required.")
        return pipeline
    
    @validator('responses', pre=True, always=True)
    def validate_responses_length(cls, value):
        if len(value) == 0:
            raise ValueError("empty response list not allowed")
        return value

class RubricEvalResultModel(BaseModel):
    option: str
    explanation: str
    p_bias: Optional[bool] = None
    entropy: Optional[float] = None

class RubricEvalResponseModel(BaseModel):
    results: List[RubricEvalResultModel]

