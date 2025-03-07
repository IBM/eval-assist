from pydantic import BaseModel
from unitxt.llm_as_judge import EvaluatorNameEnum, ModelProviderEnum

from ..const import ExtendedEvaluatorNameEnum, ExtendedModelProviderEnum


class EvaluatorMetadataAPI(BaseModel):
    name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum | str
    providers: list[ModelProviderEnum | ExtendedModelProviderEnum]


class EvaluatorsResponseModel(BaseModel):
    # model_config = ConfigDict(arbitrary_types_allowed=True)
    evaluators: list[EvaluatorMetadataAPI]
