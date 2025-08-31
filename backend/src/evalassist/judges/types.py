from abc import ABC, abstractmethod
from typing import Any, cast

from pydantic import BaseModel, Field, RootModel
from unitxt.llm_as_judge import Criteria as UnitxtCriteria
from unitxt.llm_as_judge import CriteriaOption as UnitxtCriteriaOption
from unitxt.llm_as_judge import CriteriaWithOptions as UnitxtCriteriaWithOptions


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


class CriteriaOption(BaseModel):
    name: str
    description: str
    score: float | None = None


class Criteria(BaseModel):
    name: str
    description: str
    prediction_field: str | None = None
    context_fields: list[str] | None = None
    options: list[CriteriaOption] = Field(default_factory=list)

    def get_score_from_option(self, option_name: str):
        try:
            return next(iter(o for o in self.options if o.name == option_name)).score
        except StopIteration:
            return None

    def to_unitxt_criteria(self) -> UnitxtCriteria:
        if len(self.options) > 0:
            return UnitxtCriteriaWithOptions(
                name=self.name,
                description=self.description,
                prediction_field=self.prediction_field,
                context_fields=self.context_fields,
                options=[
                    UnitxtCriteriaOption(
                        name=option.name,
                        description=option.description,
                    )
                    for option in self.options
                ],
                option_map={option.name: option.score for option in self.options}
                if all(option.score is not None for option in self.options)
                else None,
            )
        else:
            return UnitxtCriteria(
                prediction_field=self.prediction_field,
                context_fields=self.context_fields,
                name=self.name,
                description=self.description,
            )

    @staticmethod
    def from_unitxt_criteria(unitxt_criteria: UnitxtCriteria):
        res = Criteria(
            name=unitxt_criteria.name,
            description=unitxt_criteria.description,
            prediction_field=unitxt_criteria.prediction_field,
            context_fields=cast(list[str], unitxt_criteria.context_fields),
        )
        if isinstance(unitxt_criteria, UnitxtCriteriaWithOptions):
            res.options = [
                CriteriaOption(
                    name=option.name,
                    description=option.description,
                    score=unitxt_criteria.option_map[option.name]
                    if unitxt_criteria.option_map is not None
                    and option.name in unitxt_criteria.option_map
                    else None,
                )
                for option in unitxt_criteria.options
            ]
        return res


class DirectPositionalBias(BaseModel):
    detected: bool
    result: "DirectInstanceResult | None" = None


class DirectInstanceResult(BaseModel):
    criteria: Criteria
    option: str
    score: float | None = None
    explanation: str
    feedback: str | None = None
    metadata: dict[str, Any] | None = None
    positional_bias: DirectPositionalBias | None = None
