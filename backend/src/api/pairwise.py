from pydantic import BaseModel, validator
from typing import List

class PairwiseCriteriaModel(BaseModel):
    name: str
    description: str

class PairwiseEvalRequestModel(BaseModel):
    instruction: str
    responses: List[str]
    criteria: PairwiseCriteriaModel
    bam_api_key: str
    pipeline: str

    @validator('pipeline', pre=True, always=True)
    def validate_pipeline(cls, pipeline):
        if not pipeline:
            raise ValueError("Pipeline name is required.")
        return pipeline

    @validator('bam_api_key', pre=True, always=True)
    def validate_api_key(cls, key):
        if not key:
            raise ValueError("API Key is required.")
        return key

    @validator('responses', pre=True, always=True)
    def validate_responses_length(cls, value):
        if len(value) != 2:
            raise ValueError("Exactly 2 responses required for pairwise evaluaton.")
        return value

class PairwiseEvalResultModel(BaseModel):
    w_index: int
    explanation: str
    entropy: float
    p_bias: bool

class PairwiseEvalResponseModel(BaseModel):
    results: List[PairwiseEvalResultModel]