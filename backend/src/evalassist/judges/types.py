from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, RootModel


class Instance(BaseModel, ABC):
    context: dict[str, str] | None
    expected_result: str | None = None
    metadata: dict[str, Any] | None = None

    @abstractmethod
    def get_prediction(self) -> Any: ...  # noqa: E704


class DirectInstance(Instance):
    response: str

    def get_prediction(self):
        return self.response


class PairwiseInstance(Instance):
    responses: list[str]

    def get_prediction(self):
        return self.responses


class SingleSystemPairwiseResult(BaseModel):
    contest_results: list[bool]
    compared_to: list[int]
    explanations: list[str]
    positional_bias: list[bool] | None = None
    certainty: list[float] | None = None
    winrate: float
    ranking: int
    selections: list[str]


class PairwiseInstanceResult(RootModel):
    root: dict[str, SingleSystemPairwiseResult]


class DirectPositionalBias(BaseModel):
    detected: bool
    option: str = ""
    explanation: str = ""


class DirectInstanceResult(BaseModel):
    option: str
    score: float | None = None
    explanation: str
    feedback: str | None = None
    positional_bias: DirectPositionalBias | None = None
    metadata: dict[str, Any] | None = None
