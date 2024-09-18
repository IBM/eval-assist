from pydantic import BaseModel
from llmasajudge.evaluators import PipelineModelMetadata

class PipelinesResponseModel(BaseModel):
    pipelines: list[PipelineModelMetadata]