from pydantic import BaseModel

from ..const import ExtendedEvaluatorMetadata


class EvaluatorMetadataAPI(BaseModel, ExtendedEvaluatorMetadata):
    pass


class EvaluatorsResponseModel(BaseModel):
    # model_config = ConfigDict(arbitrary_types_allowed=True)
    evaluators: list[EvaluatorMetadataAPI]
