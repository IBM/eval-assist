from enum import Enum
from pydantic import BaseModel, validator
from typing import List

PAIRWISE_TYPE = "pairwise"
RUBRIC_TYPE = "rubric"

class EvalTypes(Enum):
    pairwise = PAIRWISE_TYPE
    rubric = RUBRIC_TYPE

class PipelineModel(BaseModel):
    name: str
    type: EvalTypes

class PipelinesResponseModel(BaseModel):
    pipelines: List[PipelineModel]