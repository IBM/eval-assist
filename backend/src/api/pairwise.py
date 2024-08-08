from pydantic import BaseModel, validator
from fastapi import HTTPException
from typing import Dict, List, Optional

class PairwiseCriteriaModel(BaseModel):
    name: str
    criteria: str

    @validator('criteria', pre=True, always=True)
    def validate_criteria(cls, criteria):
        if len(criteria.strip()) == 0:
            raise HTTPException(status_code=400, detail="Evaluation criteria is required.")
        return criteria

class PairwiseEvalRequestModel(BaseModel):
    context_variables: Dict[str, str]
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
        all_valid = True
        for r in responses:
            if len(r.strip()) == 0:
                all_valid = False
                break
        if not all_valid:
            raise HTTPException(status_code=400, detail="Responses can't be an empty string.")
        
        return responses
    
class PairwiseEvalResultModel(BaseModel):
    contest_results: List[bool]
    compared_to_indexes: List[int]
    explanations: Dict[int, str]
    p_bias: Optional[List[bool]] = None
    certainty: List[float]
    winrate: float
    ranking: int

class PairwiseEvalResponseModel(BaseModel):
    per_response_results: Dict[int, PairwiseEvalResultModel]
    ranking: List[int]