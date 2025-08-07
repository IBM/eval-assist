from abc import ABC, abstractmethod
from collections.abc import Sequence
from typing import Any, Generic, TypeVar, cast

from langchain.output_parsers import OutputFixingParser
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompt_values import StringPromptValue
from langchain_core.runnables import RunnableLambda
from unitxt.inference import CrossProviderInferenceEngine, InferenceEngine
from unitxt.llm_as_judge import Criteria, CriteriaWithOptions

from ..api.common import DirectInstance, DirectInstanceResult
from ..api.common import Instance as BaseInstance
from ..api.common import PairwiseInstance, PairwiseInstanceResult

InstanceTypeVar = TypeVar("InstanceTypeVar", bound=BaseInstance)
CriteriaTypeBar = TypeVar("CriteriaTypeBar", bound=Criteria)
ReturnVarType = TypeVar("ReturnVarType")


class Judge(ABC, Generic[InstanceTypeVar, CriteriaTypeBar, ReturnVarType]):
    """
    Base judge over:
      - InstanceTypeVar: the Instance subtype
      - CriteriaTypeBar: the Criteria subtype
      - ReturnVarType: the Result subtype
    """

    criteria: CriteriaTypeBar
    inference_engine: InferenceEngine

    def __init__(
        self,
        criteria: CriteriaTypeBar,
        inference_engine: InferenceEngine,
    ):
        self.criteria = criteria
        self.inference_engine = inference_engine

    def get_inference_engine_id(self) -> str:
        return self.inference_engine.get_engine_id()

    @abstractmethod
    def evaluate(self, instances: Sequence[InstanceTypeVar]) -> Sequence[ReturnVarType]:
        """Run the judge on a batch of I → Sequence[R]."""
        ...

    @abstractmethod
    def get_predictions(self, instances: Sequence[InstanceTypeVar]) -> Any: ...


class DirectJudge(
    Judge[DirectInstance, CriteriaWithOptions, DirectInstanceResult], ABC
):
    @abstractmethod
    def evaluate(
        self, instances: Sequence[DirectInstance]
    ) -> Sequence[DirectInstanceResult]: ...

    def get_predictions(self, instances: Sequence[DirectInstance]) -> list[str]:
        return [i.response for i in instances]


class PairwiseJudge(Judge[PairwiseInstance, Criteria, PairwiseInstanceResult], ABC):
    @abstractmethod
    def evaluate(
        self, instances: Sequence[PairwiseInstance]
    ) -> Sequence[PairwiseInstanceResult]: ...

    def get_predictions(self, instances: Sequence[PairwiseInstance]) -> list[list[str]]:
        return [i.responses for i in instances]


class LangchainRunnableJudge(Judge):
    def get_runnable_lambda(self) -> RunnableLambda[StringPromptValue, str]:
        def llm_invoke(text: StringPromptValue):
            # call your custom model here and return the raw text
            response: str = cast(
                str,
                cast(CrossProviderInferenceEngine, self.inference_engine).infer(
                    dataset=[
                        {"source": text.text, "data_classification_policy": ["public"]}
                    ]
                )[0],
            )
            return response

        return RunnableLambda(func=llm_invoke)

    def get_output_fixing_parser(self, pytdantic_object) -> OutputFixingParser[Any]:
        return OutputFixingParser.from_llm(
            llm=self.get_runnable_lambda(),
            parser=PydanticOutputParser(pydantic_object=pytdantic_object),
            max_retries=3,
        )
