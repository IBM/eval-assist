from pydantic import BaseModel

from .common import CriteriaModel, EvaluationRequestModel


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
    summaries: list[str]
    positional_bias: list[bool] | None = None
    certainty: list[float] | None = None
    winrate: float
    ranking: int
    selections: list[str]


class PairwiseResponseModel(BaseModel):
    results: list[dict[str, PairwiseResultModel]]
