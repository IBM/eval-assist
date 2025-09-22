from abc import ABC, abstractmethod
from collections import Counter
from dataclasses import dataclass
from typing import Any, Generic, Literal, TypeVar, cast

from langchain.output_parsers import (
    OutputFixingParser,
    ResponseSchema,
    StructuredOutputParser,
)
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompt_values import StringPromptValue
from langchain_core.runnables import RunnableLambda
from pydantic import BaseModel
from unitxt.inference import InferenceEngine

from .types import (
    Criteria,
    CriteriaOption,
    DirectInstance,
    DirectInstanceResult,
    DirectPositionalBias,
    Instance,
    MultiCriteria,
    MultiCriteriaDirectInstanceResult,
    MultiCriteriaItemResult,
    PairwiseInstance,
    PairwiseInstanceResult,
)

# ----------------------------------------------------------------------
# Core abstract judge definition
# ----------------------------------------------------------------------
InstanceTypeVar = TypeVar("InstanceTypeVar", bound=Instance)
ReturnVarType = TypeVar("ReturnVarType")


@dataclass
class JudgeDescriptor:
    name: str
    eval_type: Literal["direct", "pairwise"]
    inference_engine_id: str

    def __str__(self) -> str:
        return f"{self.name}-{self.eval_type}-{self.inference_engine_id}"


class UnitxtInferenceEngineMixin:
    inference_engine: InferenceEngine

    def __init__(
        self,
        inference_engine,
        *args,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)
        self.inference_engine = inference_engine

    def get_inference_engine_id(self) -> str:
        """Return the identifier of the underlying inference engine."""
        return "_".join(self.inference_engine.get_engine_id().split("_")[:-1])


class BaseJudge(
    ABC,
    Generic[InstanceTypeVar, ReturnVarType],
):
    """
    Abstract base class for all judges.

    A *judge* evaluates one or more ``Instance`` objects against a set of
    ``Criteria`` and returns a result specific to the concrete implementation.
    """

    self_consistency: int = False
    check_positional_bias: bool = False

    def __init__(
        self,
        self_consistency: bool | int = False,
        check_positional_bias: bool = False,
        *args,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)
        if self_consistency < 0:
            raise ValueError(
                "self_consistency must have a boolean value or be an int greater than 0."
            )
        self.self_consistency = (
            self_consistency
            if isinstance(self_consistency, int)
            and not isinstance(self_consistency, bool)
            else (3 if self_consistency is True else 0)
        )

        self.check_positional_bias = check_positional_bias

    def get_ai_message_from_prompt(
        self, prompt: str, role: Literal["system", "user", "assistant"] = "user"
    ) -> dict[str, str]:
        return {
            "role": role,
            "content": prompt,
        }

    def evaluate(
        self,
        instances: list[InstanceTypeVar] | list[str],
        criteria: Criteria | list[Criteria] | str,
    ) -> list[ReturnVarType]:
        """Run the judge on a batch of instances and return the results."""
        if isinstance(criteria, list):
            if len(criteria) != len(instances):
                raise ValueError(
                    f"The provided criteria list must be equal in length with the instances. {len(criteria)} != {len(instances)}"
                )
            if len(criteria) == 0:
                raise ValueError("Criteria list is empty")

        elif not isinstance(criteria, str) and not isinstance(criteria, Criteria):
            raise ValueError(
                f"criteria parameter must be of type Criteria or str, you provided a {type(criteria)}"
            )

        parsed_criteria = self._get_parsed_criteria(
            cast(list[Criteria] | list[str], [criteria] * len(instances))
            if isinstance(criteria, str) or isinstance(criteria, Criteria)
            else criteria
        )
        parsed_instances = self._get_instances_from_str(instances)

        if self.self_consistency > 0:
            parsed_instances = [
                instance
                for instance in parsed_instances
                for _ in range(self.self_consistency)
            ]
            parsed_criteria = [
                criterion
                for criterion in parsed_criteria
                for _ in range(self.self_consistency)
            ]

        results: list[ReturnVarType] = self._evaluate(
            instances=parsed_instances,
            criteria=parsed_criteria,
        )

        return results

    def __call__(
        self,
        instances: list[InstanceTypeVar] | list[str],
        criteria: Criteria | list[Criteria] | str,
    ) -> list[ReturnVarType]:
        return self.evaluate(
            instances=instances,
            criteria=criteria,
        )

    @abstractmethod
    def _evaluate(
        self,
        instances: list[InstanceTypeVar],
        criteria: list[Criteria],
    ) -> list[ReturnVarType]: ...

    @abstractmethod
    def _run(
        self,
        instances: list[InstanceTypeVar],
        criteria: list[Criteria],
    ) -> list[ReturnVarType]: ...

    @abstractmethod
    def _get_instances_from_str(
        self, instances: list[InstanceTypeVar] | list[str] | list[list[str]]
    ) -> list[InstanceTypeVar]: ...

    @abstractmethod
    def _get_parsed_criteria(
        self, criteria: list[Criteria] | list[str]
    ) -> list[Criteria]: ...

    @abstractmethod
    def get_predictions(self, instances: list[InstanceTypeVar]) -> Any:
        """Return the raw predictions (e.g., LLM responses) for the given instances."""
        ...

    @abstractmethod
    def get_descriptor(self) -> JudgeDescriptor:
        """Get an object with primary information of the judge"""
        ...

    @abstractmethod
    def get_name(self) -> str:
        """Get the name of the judge"""
        ...

    def __str__(self):
        return str(self.get_descriptor())


# ----------------------------------------------------------------------
# Concrete abstract subclasses for the two main evaluation modes
# ----------------------------------------------------------------------
class BaseDirectJudge(BaseJudge[DirectInstance, DirectInstanceResult], ABC):
    def _evaluate(
        self,
        instances: list[DirectInstance],
        criteria: list[Criteria],
    ) -> list[DirectInstanceResult]:
        if self.check_positional_bias:
            results: list[DirectInstanceResult] = self._run(
                instances=[*instances, *instances],
                criteria=[
                    *criteria,
                    *[
                        Criteria(
                            name=criterion.name,
                            description=criterion.description,
                            prediction_field=criterion.prediction_field,
                            context_fields=criterion.context_fields,
                            examples=criterion.examples,
                            options=list(reversed(criterion.options)),
                        )
                        for criterion in criteria
                    ],
                ],
            )

            results_len: int = len(instances)
            results = [
                DirectInstanceResult(
                    criteria=results[i].criteria,
                    instance=instances[i],
                    option=results[i].option,
                    explanation=results[i].explanation,
                    feedback=results[i].feedback,
                    metadata=results[i].metadata,
                    positional_bias=DirectPositionalBias(
                        detected=results[i].option != results[i + results_len].option,
                        result=results[results_len + i],
                    ),
                )
                for i in range(results_len)
            ]
        else:
            results = self._run(instances=instances, criteria=criteria)

        # add numeric scores from criteria if possible
        for r in results:
            score: float | None = (
                r.criteria.get_score_from_option(r.option)
                if r.criteria is not None
                else None
            )
            if score is None:
                try:
                    # try to use the option name as the numeric score
                    score = float(r.option)
                except (ValueError, TypeError):
                    pass
            r.score = score

        if self.self_consistency > 0:
            # apply majority voting for each of the self consistency evaluations
            parsed_results = []
            for i in range(0, len(results), self.self_consistency):
                selected_options = [
                    results[j].option for j in range(i, i + self.self_consistency)
                ]
                most_common_option = Counter(selected_options).most_common(1)[0][0]
                index_of_most_common = selected_options.index(most_common_option)
                to_update_result_index = i + index_of_most_common
                to_update_result = results[to_update_result_index]
                to_update_result.option = most_common_option
                if all(
                    r.score is not None for r in results[i : i + self.self_consistency]
                ):
                    # set the mean of the scores as the score
                    to_update_result.score = (
                        sum(
                            cast(float, r.score)
                            for r in results[i : i + self.self_consistency]
                        )
                        / self.self_consistency
                    )

                to_update_result.metadata["self_consistency"] = {
                    "selected_options": selected_options,
                }
                parsed_results.append(results[to_update_result_index])
            return parsed_results

        return results

    def evaluate_multi_criteria(
        self,
        instances: list[DirectInstance] | list[str],
        multi_criteria: MultiCriteria | list[str] | list[Criteria],
    ) -> list[MultiCriteriaDirectInstanceResult]:
        if isinstance(multi_criteria, list):
            criteria = self._get_parsed_criteria(multi_criteria)
            parsed_multi_criteria = MultiCriteria.from_criteria(criteria)
        else:
            parsed_multi_criteria = multi_criteria

        multi_criteria_items = parsed_multi_criteria.items
        criteria_count = len(multi_criteria_items)
        replicated_instances, replicated_criteria = zip(
            *[
                [instance, weighted_criterion.criterion]
                for instance in instances
                for weighted_criterion in multi_criteria_items
            ]
        )
        replicated_instances = list(replicated_instances)
        replicated_criteria = list(replicated_criteria)

        results = self.evaluate(replicated_instances, replicated_criteria)  # type: ignore

        final_results: list[MultiCriteriaDirectInstanceResult] = []
        for i in range(0, len(replicated_instances), criteria_count):
            criteria_results = results[i : i + criteria_count]
            item_results: list[MultiCriteriaItemResult] = [
                item.get_result(per_criteria_result)
                for item, per_criteria_result in zip(
                    parsed_multi_criteria.items, criteria_results
                )
            ]
            result = MultiCriteriaDirectInstanceResult(
                multi_criteria=parsed_multi_criteria,
                criteria_results=criteria_results,
                item_results=item_results,
                aggregated_score=parsed_multi_criteria.get_aggregated_score(
                    item_results=item_results
                ),
            )
            final_results.append(result)
        return final_results

    def _get_instances_from_str(
        self, instances: list[DirectInstance] | list[str] | list[list[str]]
    ) -> list[DirectInstance]:
        parsed_instances: list[DirectInstance]
        if isinstance(instances, list) and all(isinstance(x, str) for x in instances):
            parsed_instances = cast(
                list[DirectInstance],
                [
                    DirectInstance(
                        context={},
                        expected_result=None,
                        metadata=None,
                        response=i,
                    )
                    for i in cast(list[str], instances)
                ],
            )
        else:
            parsed_instances = cast(list[DirectInstance], instances)
        return parsed_instances

    def _get_parsed_criteria(
        self, criteria: list[Criteria] | list[str]
    ) -> list[Criteria]:
        if isinstance(criteria, list) and all(isinstance(x, str) for x in criteria):
            return [
                Criteria(
                    name="",
                    description=description,
                    options=[
                        CriteriaOption(name="Yes", description="", score=1.0),
                        CriteriaOption(name="No", description="", score=0.0),
                    ],
                    prediction_field="response",
                )
                for description in cast(list[str], criteria)
            ]
        else:
            return [
                Criteria(
                    name=criterion.name,
                    description=criterion.description,
                    options=criterion.options,
                    prediction_field=criterion.prediction_field,
                    context_fields=criterion.context_fields,
                    examples=criterion.examples,
                )
                for criterion in cast(list[Criteria], criteria)
            ]

    @abstractmethod
    def _run(
        self,
        instances: list[DirectInstance],
        criteria: list[Criteria],
    ) -> list[DirectInstanceResult]: ...

    def get_predictions(self, instances: list[DirectInstance]) -> list[str]:
        return [i.response for i in instances]

    def get_descriptor(self) -> JudgeDescriptor:
        return JudgeDescriptor(self.get_name(), "direct", "")


class BasePairwiseJudge(BaseJudge[PairwiseInstance, PairwiseInstanceResult], ABC):
    def __init__(
        self,
        *args,
        **kwargs,
    ):
        super().__init__(
            *args,
            **kwargs,
        )
        if self.self_consistency:
            raise ValueError(
                "Self consistency is not supported on pairwise comparison judges yet."
            )

    def _evaluate(
        self,
        instances: list[PairwiseInstance],
        criteria: list[Criteria],
    ) -> list[PairwiseInstanceResult]:
        if self.check_positional_bias:
            results: list[PairwiseInstanceResult] = self._run(
                instances=[
                    *instances,
                    *[
                        PairwiseInstance(
                            context=i.context,
                            expected_result=i.expected_result,
                            metadata=i.metadata,
                            responses=list(reversed(i.responses)),
                        )
                        for i in instances
                    ],
                ],
                criteria=[
                    *criteria,
                    *criteria,
                ],
            )

            results_len: int = int(len(results) / 2)

            for instance_result, positional_bias_instance_result in zip(
                results[:results_len], results[results_len:]
            ):
                responses_count = len(instance_result.root)
                for i, response_result in enumerate(instance_result.root.values()):
                    positional_bias_result_response = list(
                        positional_bias_instance_result.root.values()
                    )[responses_count - i - 1]
                    response_result.positional_bias = [
                        a != b
                        for a, b in zip(
                            response_result.contest_results,
                            reversed(positional_bias_result_response.contest_results),
                        )
                    ]

            return results
        else:
            return self._run(instances=instances, criteria=criteria)

    @abstractmethod
    def _run(
        self,
        instances: list[PairwiseInstance],
        criteria: list[Criteria],
    ) -> list[PairwiseInstanceResult]: ...

    def get_predictions(self, instances: list[PairwiseInstance]) -> list[list[str]]:
        return [i.responses for i in instances]

    def get_descriptor(self) -> JudgeDescriptor:
        return JudgeDescriptor(self.get_name(), "pairwise", "")

    def _get_instances_from_str(
        self,
        instances: list[PairwiseInstance] | list[str] | list[list[str]],
    ) -> list[PairwiseInstance]:
        parsed_instances: list[PairwiseInstance]
        if isinstance(instances, list) and all(isinstance(x, str) for x in instances):
            parsed_instances = cast(
                list[PairwiseInstance],
                [
                    PairwiseInstance(
                        context={},
                        expected_result=None,
                        metadata=None,
                        responses=i,
                    )
                    for i in cast(list[list[str]], instances)
                ],
            )
        else:
            parsed_instances = cast(list[PairwiseInstance], instances)
        return parsed_instances

    def _get_parsed_criteria(
        self, criteria: list[Criteria] | list[str]
    ) -> list[Criteria]:
        if isinstance(criteria, list) and all(isinstance(x, str) for x in criteria):
            return [
                Criteria(
                    name="",
                    description=description,
                )
                for description in cast(list[str], criteria)
            ]
        else:
            return cast(list[Criteria], criteria)


# ----------------------------------------------------------------------
# Helper mix‑in for judges that use LangChain runnables
# ----------------------------------------------------------------------
class UnitxtInferenceLangchainRunnable(UnitxtInferenceEngineMixin):
    max_retries: int

    def __init__(
        self,
        max_retries: int = 3,
        *args,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)
        self.max_retries = max_retries

    def _get_runnable_lambda(self) -> RunnableLambda[StringPromptValue, str]:
        """
        Create a LangChain ``RunnableLambda`` that forwards the prompt to the
        underlying ``InferenceEngine`` and returns the raw LLM response.

        Returns
        -------
        RunnableLambda[StringPromptValue, str]
            A callable runnable that can be used in LangChain pipelines.
        """

        def llm_invoke(text: StringPromptValue) -> str:
            # Call the custom model here and return the raw text
            response: str = cast(
                str,
                self.inference_engine.infer(
                    dataset=[
                        {
                            "source": text.text,
                            "data_classification_policy": ["public"],
                        }
                    ]
                )[0],
            )
            return response

        return RunnableLambda(func=llm_invoke)

    def get_pydantic_output_fixing_parser(
        self, pydantic_object: type[BaseModel]
    ) -> OutputFixingParser[Any]:
        """
        Create an ``OutputFixingParser`` for a given Pydantic model.

        Parameters
        ----------
        pydantic_object : Type[BaseModel]
            The Pydantic model class used to parse the LLM output.

        Returns
        -------
        OutputFixingParser[Any]
            Configured parser with retry logic.
        """
        return OutputFixingParser.from_llm(
            llm=self._get_runnable_lambda(),
            parser=PydanticOutputParser(pydantic_object=pydantic_object),
            max_retries=self.max_retries,
        )

    def get_structured_output_fixing_parser(
        self, response_schemas: list[ResponseSchema]
    ) -> OutputFixingParser[Any]:
        """
        Create an ``OutputFixingParser`` for a given Pydantic model.

        Parameters
        ----------
        pydantic_object : Type[BaseModel]
            The Pydantic model class used to parse the LLM output.

        Returns
        -------
        OutputFixingParser[Any]
            Configured parser with retry logic.
        """
        return OutputFixingParser.from_llm(
            llm=self._get_runnable_lambda(),
            parser=StructuredOutputParser.from_response_schemas(response_schemas),
            max_retries=self.max_retries,
        )
