from pydantic import BaseModel
from unitxt.llm_as_judge import EvaluatorMetadata


class EvaluatorMetadataAPI(BaseModel, EvaluatorMetadata):
    pass


class PipelinesResponseModel(BaseModel):
    # model_config = ConfigDict(arbitrary_types_allowed=True)
    evaluators: list[EvaluatorMetadataAPI]
