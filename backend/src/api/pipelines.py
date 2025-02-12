from pydantic import BaseModel
from unitxt.llm_as_judge import EvaluatorMetadata, EvaluatorNameEnum

from ..const import ExtendedEvaluatorNameEnum


class ExtendedEvaluatorMetadata(EvaluatorMetadata):
    name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum


class EvaluatorMetadataAPI(BaseModel, ExtendedEvaluatorMetadata):
    pass


class PipelinesResponseModel(BaseModel):
    # model_config = ConfigDict(arbitrary_types_allowed=True)
    evaluators: list[EvaluatorMetadataAPI]
