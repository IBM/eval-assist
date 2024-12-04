from pydantic import BaseModel, validator
from fastapi import HTTPException
from typing import Literal, Optional
from .common import CriteriaModel, EvalRequestModel

class PairwiseCriteriaModel(CriteriaModel):
    pass

class PairwiseEvalRequestModel(EvalRequestModel):
    criteria: PairwiseCriteriaModel

    @validator('responses', pre=True, always=True)
    def validate_responses_length(cls, responses):
        # if len(responses) < 2:
        #     raise HTTPException(status_code=400, detail="At least two responses are required to evaluate.")
        
        all_valid = True
        for r in responses:
            if len(r.strip()) == 0:
                all_valid = False
                break
        if not all_valid:
            raise HTTPException(status_code=400, detail="Responses can't be an empty string.")
        
        return responses
    

class PairwiseEvalResultModel(BaseModel):
    contest_results: list[bool]
    compared_to: list[int]
    summaries: list[str]
    positional_bias: Optional[list[bool]] = None
    certainty: Optional[list[float]] = None
    winrate: float
    ranking: int
    selections: list[str]

class PairwiseEvalResponseModel(BaseModel):
    results: dict[int, PairwiseEvalResultModel]