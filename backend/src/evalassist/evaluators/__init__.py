from abc import ABC, abstractmethod
from typing import List, Optional

from unitxt.inference import InferenceEngine
from unitxt.llm_as_judge import (
    Criteria,
    CriteriaWithOptions,
    EvaluatorNameEnum,
    EvaluatorTypeEnum,
    ModelProviderEnum,
)

from ..api.common import Instance
from ..const import ExtendedEvaluatorNameEnum, ExtendedModelProviderEnum
from ..utils import (
    get_evaluator_metadata_wrapper,
    get_inference_engine,
    get_model_name_from_evaluator,
)


class Evaluator(ABC):
    evaluator_type: EvaluatorTypeEnum

    def __init__(
        self,
        evaluator_name: Optional[EvaluatorNameEnum | ExtendedEvaluatorNameEnum] = None,
        provider: Optional[ModelProviderEnum | ExtendedModelProviderEnum] = None,
        credentials: Optional[dict[str, Optional[str]]] = None,
        custom_model_name: Optional[str] = None,
        inference_engine: Optional[InferenceEngine] = None,
    ):
        if (
            evaluator_name is not None
            and provider is not None
            and credentials is not None
        ):
            self.evaluator_metadata = get_evaluator_metadata_wrapper(
                evaluator_name, custom_model_name
            )
            model_name = get_model_name_from_evaluator(
                self.evaluator_metadata,
                provider,
            )

            self.inference_engine = get_inference_engine(
                credentials,
                provider,
                model_name,
                custom_params={
                    "use_cache": True,
                    "seed": 42,
                    "temperature": 0,
                },
            )
        else:
            self.inference_engine = inference_engine

    @abstractmethod
    def parse_results(self, dataset):
        raise NotImplementedError("This method must be implemented.")

    @abstractmethod
    def get_prediction_type(self):
        raise NotImplementedError("This method must be implemented.")

    def get_predictions(self, instances: list[Instance]) -> list[str | list[str]]:
        return [instance.response for instance in instances]

    @abstractmethod
    def evaluate(
        self,
        instances: list[Instance],
    ):
        raise NotImplementedError("This method must be implemented.")


class DirectEvaluator(Evaluator):
    criteria: CriteriaWithOptions

    def __init__(self, criteria, **kwargs):
        super().__init__(**kwargs)
        self.criteria = criteria

    def get_prediction_type(self):
        return str


class PairwiseEvaluator(Evaluator):
    criteria: Criteria

    def __init__(self, criteria, **kwargs):
        super().__init__(**kwargs)
        self.criteria = criteria

    def get_prediction_type(self):
        return List[str]
