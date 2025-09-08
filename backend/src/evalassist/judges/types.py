import logging
import math
from abc import ABC, abstractmethod
from typing import Any, Literal, cast

from pydantic import BaseModel, Field, RootModel, field_validator, model_validator
from typing_extensions import Self
from unitxt.llm_as_judge import Criteria as UnitxtCriteria
from unitxt.llm_as_judge import CriteriaOption as UnitxtCriteriaOption
from unitxt.llm_as_judge import CriteriaWithOptions as UnitxtCriteriaWithOptions

logger = logging.getLogger(__name__)


class Instance(BaseModel, ABC):
    context: dict[str, str] = Field(
        default_factory=dict,
        description="Additional context information for the instance, stored as key-value pairs.",
    )
    expected_result: str | None = Field(
        default=None,
        description="The expected result or ground truth for the instance, if available.",
    )
    metadata: dict[str, Any] | None = Field(
        default=None,
        description="Additional metadata about the instance, stored as key-value pairs.",
    )

    @abstractmethod
    def get_prediction(self) -> Any: ...  # noqa: E704


class DirectInstance(Instance):
    response: str = Field(
        description="The response or prediction generated for the instance."
    )

    def get_prediction(self):
        return self.response


class PairwiseInstance(Instance):
    responses: list[str] = Field(
        description="A list of responses or predictions to be compared in a pairwise evaluation."
    )

    def get_prediction(self):
        return self.responses


class CriteriaOption(BaseModel):
    name: str = Field(description="The name or label of the criteria option.")
    description: str = Field(
        description="A detailed description of the criteria option.", default=""
    )
    score: float | None = Field(
        default=None,
        description="The score associated with this criteria option, if applicable.",
    )


class Criteria(BaseModel):
    name: str = Field(description="The name or identifier of the criteria.")
    description: str = Field(
        description="A detailed description of the criteria and its purpose."
    )
    prediction_field: str | None = Field(
        default=None,
        description="The field in the instance that contains the prediction to be evaluated against this criteria.",
    )
    context_fields: list[str] | None = Field(
        default=None,
        description="A list of fields in the instance's context that are relevant to this criteria.",
    )
    options: list[CriteriaOption] = Field(
        default_factory=list,
        description="A list of possible options or outcomes for this criteria, along with their descriptions and scores.",
    )

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
    result: "DirectInstanceResult | None" = None


class DirectInstanceResult(BaseModel):
    criteria: Criteria
    option: str
    score: float | None = None
    explanation: str
    feedback: str | None = None
    metadata: dict[str, Any] | None = None
    positional_bias: DirectPositionalBias | None = None


MultiCriteriaStrategy = Literal["target_option", "score_threshold", "none"]


class MultiCriteriaItemResult(BaseModel):
    criteria_name: str
    weight: float
    score: float | None
    weighted_score: float | None
    option: str
    strategy: MultiCriteriaStrategy
    required: bool


class MultiCriteriaItem(BaseModel):
    criterion: Criteria = Field(
        description="The criteria being evaluated in this multi-criteria item."
    )
    weight: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="The weight assigned to this criteria in the overall evaluation. If None, the weight is determined by the MultiCriteria configuration.",
    )
    target_option: str | None = Field(
        default=None,
        description="The target option for this criteria. If specified, the score is 1.0 if the result matches this option, and 0.0 otherwise.",
    )
    score_threshold: float | None = Field(
        default=None,
        description="The score threshold for this criteria. If specified, the score is 1.0 if the result score is above this threshold, and 0.0 otherwise.",
    )
    required: bool = Field(
        default=False,
        description="Whether this criteria is required. If True and the score is not the optimal (or more than the score_threshold if provided, or the selected option equal to the target_option if provided), the overall aggregated score will be 0.0.",
    )

    def normalized(self, unnormalized_score: float | None) -> float | None:
        scores: list[float | None] = [option.score for option in self.criterion.options]
        if any(score is None for score in scores):
            return None
        min_score = min(scores)  # type: ignore
        max_score = max(scores)  # type: ignore
        return (unnormalized_score - min_score) / (max_score - min_score)

    def get_strategy(self) -> MultiCriteriaStrategy:
        if self.target_option is not None:
            return "target_option"
        if self.score_threshold is not None:
            return "score_threshold"
        return "none"

    def get_score(self, result: DirectInstanceResult) -> float | None:
        score = result.score
        if score is None and self.target_option is None:
            return None

        if self.target_option is not None:
            score = 1.0 if result.option == self.target_option else 0.0

        elif self.score_threshold is not None:
            if score is None:
                raise ValueError(
                    "Result doesn't have a score, probably becuase option score wansn't set and score_threshold was set."
                )
            score = 1.0 if score > self.score_threshold else 0.0

        if self.weight is None:
            raise ValueError(f"{self.criterion.name}'s weight is None, it shouldn't!")

        return score

    def get_result(self, result: DirectInstanceResult) -> MultiCriteriaItemResult:
        weight = cast(float, self.weight)
        score: float | None = self.get_score(result)
        return MultiCriteriaItemResult(
            criteria_name=self.criterion.name,
            weight=weight,
            score=score,
            weighted_score=score * weight if score is not None else None,
            option=result.option,
            strategy=self.get_strategy(),
            required=self.required,
        )

    @model_validator(mode="after")
    def validate_strategy(self) -> Self:
        if self.target_option is not None and self.score_threshold is not None:
            raise ValueError(
                f"{self.criterion.name}: exactly one of target_option or score_threshold must be set, not both"
            )
        return self


class MultiCriteria(BaseModel):
    items: list[MultiCriteriaItem] = Field(
        description="A list of MultiCriteriaItem objects representing the multiple criteria to be evaluated."
    )
    normalize_scores: bool = Field(
        default=True,
        description="Whether to normalize the scores for the criteria items. Normalization scales scores to a range between 0.0 and 1.0",
    )

    def get_aggregated_score(
        self, item_results: list[MultiCriteriaItemResult]
    ) -> float | None:
        item_results_criteria_names = [
            item_result.criteria_name for item_result in item_results
        ]
        if len(self.items) != len(item_results) or any(
            item.criterion.name not in item_results_criteria_names
            for item in self.items
        ):
            raise ValueError("Some criteria results are missing.")
        total = 0.0
        for item in self.items:
            item_result = next(
                iter(x for x in item_results if x.criteria_name == item.criterion.name)
            )
            if item_result.weighted_score is None:
                return None
            if item.required and item_result.weighted_score < item_result.weight:
                return 0.0
            total += item_result.weighted_score
        return round(total, 9)

    @classmethod
    def from_criteria(cls, criteria: list[Criteria]) -> "MultiCriteria":
        if not criteria:
            return cls(items=[])
        equal_weight = 1.0 / len(criteria)
        items = [MultiCriteriaItem(criterion=c, weight=equal_weight) for c in criteria]
        return cls(items=items)

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

    @model_validator(mode="after")
    def check_weights(self) -> Self:
        if all(item.weight is not None for item in self.items):
            total_weight = sum(cast(float, item.weight) for item in self.items)
            if not math.isclose(total_weight, 1.0, rel_tol=1e-9, abs_tol=1e-9):
                raise ValueError(
                    f"Total weight must sum to 1.0. Weights are: {', '.join(str(item.weight) for item in self.items)} which adds up to {total_weight}"
                )
        return self

    @model_validator(mode="after")
    def validate_score(self: Self) -> Self:
        invalid_items = []
        for item in self.items:
            if any(option.score is None for option in item.criterion.options):
                if item.target_option is None:
                    invalid_items.append(item.criterion.name)

        if len(invalid_items) > 0:
            raise ValueError(
                f"The following criteria are missing option scores: {', '.join(invalid_items)}. If you don't provide all option scores, target_option should be set."
            )

        return self

    @model_validator(mode="after")
    def set_criteria_name_if_needed(self) -> Self:
        for i, item in enumerate(self.items):
            if item.criterion.name == "":
                item.criterion.name = f"criteria_{i + 1}"
        return self

    @model_validator(mode="after")
    def normalize_scores_if_needed(self) -> Self:
        if self.normalize_scores:
            for item in self.items:
                scores: list[float | None] = [
                    option.score for option in item.criterion.options
                ]
                if all(score is not None for score in scores):
                    for option in item.criterion.options:
                        option.score = item.normalized(option.score)
                else:
                    logger.warning(
                        f"{item.criterion.name} option scores can't be normalized because one or more option scores are None"
                    )
        return self

    @model_validator(mode="after")
    def check_unique_criteria_names(self) -> Self:
        criteria_names = [item.criterion.name for item in self.items]
        if len(criteria_names) != len(set(criteria_names)):
            raise ValueError("All criteria names must be unique")
        return self


class MultiCriteriaDirectInstanceResult(BaseModel):
    multi_criteria: MultiCriteria = Field(
        description="The MultiCriteria configuration used for this evaluation."
    )
    criteria_results: list[DirectInstanceResult] = Field(
        description="A list of DirectInstanceResult objects, one for each criterion in the multi-criteria evaluation."
    )
    item_results: list[MultiCriteriaItemResult] = Field(
        description="A dictionary mapping criterion names to their respective weight/score tuples."
    )
    aggregated_score: float | None = Field(
        description="The overall aggregated score for the instance across all criteria."
    )
