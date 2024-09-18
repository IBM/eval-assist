from pydantic import BaseModel, validator
from fastapi import HTTPException
from typing import Dict, List, Literal, Optional
from llmasajudge.evaluators import  EvaluatorTypeEnum
from .common import CriteriaModel, EvalRequestModel

class PairwiseCriteriaModel(CriteriaModel):
    pass

class PairwiseEvalRequestModel(EvalRequestModel):
    criteria: PairwiseCriteriaModel

    @validator('responses', pre=True, always=True)
    def validate_responses_length(cls, responses):
        if len(responses) < 2:
            raise HTTPException(status_code=400, detail="At least two responses are required to evaluate.")
        
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