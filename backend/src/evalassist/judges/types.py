import logging
from abc import ABC, abstractmethod
from typing import Any, Self, cast

from pydantic import BaseModel, Field, RootModel, field_validator, model_validator
from unitxt.llm_as_judge import Criteria as UnitxtCriteria
from unitxt.llm_as_judge import CriteriaOption as UnitxtCriteriaOption
from unitxt.llm_as_judge import CriteriaWithOptions as UnitxtCriteriaWithOptions

logger = logging.getLogger(__name__)


class Instance(BaseModel, ABC):
    context: dict[str, str] = Field(default_factory=dict)
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


class MultiCriteriaItem(BaseModel):
    criterion: Criteria
    weight: float | None = Field(default=None, ge=0.0, le=1.0)
    target_option: str | None = None
    score_threshold: float | None = None
    normalize_scores: bool = True
    required: bool = False

    def get_score_from_result(self, result: DirectInstanceResult) -> float:
        score: float = cast(float, result.score)
        if self.target_option is not None:
            score = 1.0 if result.option == self.target_option else 0.0
        elif self.score_threshold is not None:
            score = 1.0 if score > self.score_threshold else 0.0

        if self.weight is not None:
            return self.weight * score
        return score

    @model_validator(mode="after")
    def validate_strategy(self) -> Self:
        if self.target_option is not None and self.score_threshold is not None:
            raise ValueError(
                f"{self.criterion.name}: exactly one of target_option or score_threshold must be set, not both"
            )
        return self

    @model_validator(mode="after")
    def normalize_scores_if_needed(self) -> Self:
        scores: list[float | None] = [option.score for option in self.criterion.options]
        if self.normalize_scores and all(score is not None for score in scores):
            min_score = min(scores)  # type: ignore
            max_score = max(scores)  # type: ignore
            normalized_scores = [
                (score - min_score) / (max_score - min_score) for score in scores
            ]
            for option, normalized_score in zip(
                self.criterion.options, normalized_scores
            ):
                option.score = normalized_score
        return self


class MultiCriteria(BaseModel):
    items: list[MultiCriteriaItem]

    def get_aggregated_score(self, results: dict[str, DirectInstanceResult]) -> float:
        total = 0.0
        for item in self.items:
            result = results.get(item.criterion.name)
            if result is None:
                raise ValueError(f"Missing result for criterion {item.criterion.name}")

            score = item.get_score_from_result(result)
            if item.required and score < 1.0:
                return 0.0
            total += score
        return total

    @classmethod
    def from_criteria(cls, criteria: list[Criteria]) -> "MultiCriteria":
        if not criteria:
            return cls(items=[])
        equal_weight = 1.0 / len(criteria)
        items = [MultiCriteriaItem(criterion=c, weight=equal_weight) for c in criteria]
        return cls(items=items)

    @model_validator(mode="after")
    def check_weights(self) -> Self:
        if all(item.weight is not None for item in self.items):
            total_weight = sum(cast(float, item.weight) for item in self.items)
            if total_weight != 1.0:
                raise ValueError("Total weight must sum to 1.0")
        return self

    @field_validator("items")
    @classmethod
    def default_weights(cls, value: list[MultiCriteriaItem]) -> list[MultiCriteriaItem]:
        if any(item.weight is None for item in value) and not all(
            item.weight is None
            and item.target_option is None
            and item.score_threshold is None
            for item in value
        ):
            raise ValueError("Mixed weighting strategies are not allowed.")

        if all(
            item.weight is None
            and item.target_option is None
            and item.score_threshold is None
            for item in value
        ):
            logger.warning(
                "Neither of weight, target_option or score_threshold where provided. Defaulting to equal weight"
            )
            num_criteria = len(value)
            if num_criteria == 0:
                return value  # Return as is if no criteria are provided
            if all(w.weight == 0.0 for w in value):
                equal_weight = 1.0 / num_criteria
                for w in value:
                    w.weight = equal_weight
        return value

    @field_validator("items")
    @classmethod
    def validate_score(cls, items: list[MultiCriteriaItem]) -> list[MultiCriteriaItem]:
        missing_scores = []
        for item in items:
            if any(option.score is None for option in item.criterion.options):
                missing_scores.append(item.criterion.name)
        if len(missing_scores) > 0:
            raise ValueError(
                f"The following criteria are missing option scores: {', '.join(missing_scores)}"
            )
        return items

    @model_validator(mode="after")
    def set_criteria_name_if_needed(self) -> Self:
        for i, item in enumerate(self.items):
            if item.criterion.name == "":
                item.criterion.name = f"criteria_{i + 1}"
        return self


class MultiCriteriaDirectInstanceResult(BaseModel):
    multi_criteria: MultiCriteria
    per_criterion_results: list[DirectInstanceResult]
    per_criterion_score: dict[str, float]
    aggregated_score: float
