from pydantic import BaseModel, validator
from fastapi import HTTPException
from typing import List, Optional

class PairwiseCriteriaModel(BaseModel):
    name: str
    criteria: str

    @validator('criteria', pre=True, always=True)
    def validate_criteria(cls, criteria):
        if len(criteria.strip()) == 0:
            raise HTTPException(status_code=400, detail="Evaluation criteria is required.")
        return criteria

class PairwiseEvalRequestModel(BaseModel):
    instruction: str
    responses: List[str]
    criteria: PairwiseCriteriaModel
    bam_api_key: str
    pipeline: str

    @validator('pipeline', pre=True, always=True)
    def validate_pipeline(cls, pipeline):
        if not pipeline:
            raise HTTPException(status_code=400, detail="Pipeline name is required.")
        return pipeline

    @validator('bam_api_key', pre=True, always=True)
    def validate_api_key(cls, key):
        if not key:
            raise HTTPException(status_code=400, detail="API Key is required.")
        return key

    @validator('responses', pre=True, always=True)
    def validate_responses_length(cls, responses):
        if len(responses) != 2:
            raise HTTPException(status_code=400, detail="Two responses are required for pairwise evaluaton.")
        
        all_valid = True
        for r in responses:
            if len(r.strip()) == 0:
                all_valid = False
                break
        if not all_valid:
            raise HTTPException(status_code=400, detail="Two responses are required for pairwise evaluaton.")
        
        return responses
    
class PairwiseEvalResultModel(BaseModel):
    w_index: int
    explanation: str
    entropy: Optional[float] = None
    p_bias: Optional[bool] = None

class PairwiseEvalResponseModel(BaseModel):
    results: List[PairwiseEvalResultModel]