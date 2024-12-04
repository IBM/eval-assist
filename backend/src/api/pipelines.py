from pydantic import BaseModel, ConfigDict
from unitxt.eval_assist_constants import EvaluatorMetadata

class EvaluatorMetadataAPI(BaseModel, EvaluatorMetadata):
    pass

class PipelinesResponseModel(BaseModel):
    # model_config = ConfigDict(arbitrary_types_allowed=True)
    pipelines: list[EvaluatorMetadataAPI]