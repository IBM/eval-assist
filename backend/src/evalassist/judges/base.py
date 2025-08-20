from abc import ABC, abstractmethod
from collections.abc import Sequence
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
from unitxt.inference import CrossProviderInferenceEngine, InferenceEngine
from unitxt.llm_as_judge import Criteria, CriteriaOption, CriteriaWithOptions

from .types import (
    DirectInstance,
    DirectInstanceResult,
    DirectPositionalBias,
    Instance,
    PairwiseInstance,
    PairwiseInstanceResult,
)

# ----------------------------------------------------------------------
# Core abstract judge definition
# ----------------------------------------------------------------------
InstanceTypeVar = TypeVar("InstanceTypeVar", bound=Instance)
CriteriaTypeVar = TypeVar("CriteriaTypeVar", bound=Criteria)
ReturnVarType = TypeVar("ReturnVarType")


@dataclass
class JudgeDescriptor:
    name: str
    evalType: Literal["direct", "pairwise"]
    inference_engine_id: str


@dataclass
class InferenceEngineMixin:
    inference_engine: InferenceEngine


class Judge(
    ABC, Generic[InstanceTypeVar, CriteriaTypeVar, ReturnVarType], InferenceEngineMixin
):
    """
    Abstract base class for all judges.

    A *judge* evaluates one or more ``Instance`` objects against a set of
    ``Criteria`` and returns a result specific to the concrete implementation.

    Attributes
    ----------
    inference_engine: InferenceEngine
        The engine used to query LLMs.
    """

    inference_engine: InferenceEngine

    def __init__(
        self,
        inference_engine: InferenceEngine,
    ) -> None:
        """
        Initialise a judge.

        Parameters
        ----------
        inference_engine : InferenceEngine
            The inference engine that will be used to call the LLM.
        """
        self.inference_engine = inference_engine

    def get_inference_engine_id(self) -> str:
        """Return the identifier of the underlying inference engine."""
        return self.inference_engine.get_engine_id()

    def get_ai_message_from_prompt(
        self, prompt: str, role: Literal["system", "user", "assistant"] = "user"
    ) -> dict[str, str]:
        return {
            "role": role,
            "content": prompt,
        }

    def evaluate(
        self,
        instances: Sequence[InstanceTypeVar] | Sequence[str] | Sequence[list[str]],
        criteria: CriteriaTypeVar | Sequence[CriteriaTypeVar] | str,
        check_positional_bias: bool = False,
    ) -> Sequence[ReturnVarType]:
        """Run the judge on a batch of instances and return the results."""
        if (
            isinstance(criteria, Sequence)
            and not isinstance(criteria, str)
            and len(criteria) != len(instances)
        ):
            raise ValueError(
                f"The provided criteria list must be equal in length with the instances. {len(criteria)} != {len(instances)}"
            )
        parsed_criteria: Sequence[CriteriaTypeVar] | Sequence[str]
        if isinstance(criteria, str):
            parsed_criteria = [criteria] * len(instances)
        elif isinstance(criteria, Sequence):
            parsed_criteria = criteria
        else:
            parsed_criteria = [criteria] * len(instances)

        parsed_criteria = self._get_parsed_criteria(parsed_criteria)
        parsed_instances = self._get_instances_from_str(instances)

        results: Sequence[ReturnVarType] = self._evaluate(
            instances=parsed_instances,
            criteria=parsed_criteria,
            check_positional_bias=check_positional_bias,
        )
        return results

    def __call__(
        self,
        instances: Sequence[InstanceTypeVar] | Sequence[str] | Sequence[list[str]],
        criteria: CriteriaTypeVar | Sequence[CriteriaTypeVar] | str,
        check_positional_bias: bool = False,
    ) -> Sequence[ReturnVarType]:
        return self.evaluate(instances, criteria, check_positional_bias)

    @abstractmethod
    def _evaluate(
        self,
        instances: Sequence[InstanceTypeVar],
        criteria: Sequence[CriteriaTypeVar],
        check_positional_bias: bool,
    ) -> Sequence[ReturnVarType]: ...

    @abstractmethod
    def _run(
        self,
        instances: Sequence[InstanceTypeVar],
        criteria: Sequence[CriteriaTypeVar],
    ) -> Sequence[ReturnVarType]: ...

    @abstractmethod
    def _get_instances_from_str(
        self, instances: Sequence[InstanceTypeVar] | Sequence[str] | Sequence[list[str]]
    ) -> Sequence[InstanceTypeVar]: ...

    @abstractmethod
    def _get_parsed_criteria(
        self, criteria: Sequence[CriteriaTypeVar] | Sequence[str]
    ) -> Sequence[CriteriaTypeVar]: ...

    @abstractmethod
    def get_predictions(self, instances: Sequence[InstanceTypeVar]) -> Any:
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


# ----------------------------------------------------------------------
# Concrete abstract subclasses for the two main evaluation modes
# ----------------------------------------------------------------------
class DirectJudge(
    Judge[DirectInstance, CriteriaWithOptions, DirectInstanceResult], ABC
):
    def _evaluate(
        self,
        instances: Sequence[DirectInstance],
        criteria: Sequence[CriteriaWithOptions],
        check_positional_bias: bool = False,
    ) -> Sequence[DirectInstanceResult]:
        if check_positional_bias:
            results: Sequence[DirectInstanceResult] = self._run(
                instances=[*instances, *instances],
                criteria=[
                    *criteria,
                    *[
                        CriteriaWithOptions(
                            name=criterion.name,
                            description=criterion.description,
                            option_map=criterion.option_map,
                            prediction_field=criterion.prediction_field,
                            context_fields=criterion.context_fields,
                            options=list(reversed(criterion.options)),
                        )
                        for criterion in criteria
                    ],
                ],
            )

            results_len: int = int(len(results) / 2)
            results = [
                DirectInstanceResult(
                    option=results[i].option,
                    explanation=results[i].explanation,
                    metadata=results[i].metadata,
                    positional_bias=DirectPositionalBias(
                        detected=results[i].option != results[i + results_len].option,
                        option=results[i + results_len].option,
                        explanation=results[i + results_len].explanation,
                    ),
                )
                for i in range(cast(int, results_len))
            ]
            return results
        else:
            return self._run(instances=instances, criteria=criteria)

    def _get_instances_from_str(
        self, instances: Sequence[DirectInstance] | Sequence[str] | Sequence[list[str]]
    ) -> Sequence[DirectInstance]:
        parsed_instances: Sequence[DirectInstance]
        if isinstance(instances, Sequence) and all(
            isinstance(x, str) for x in instances
        ):
            parsed_instances = cast(
                Sequence[DirectInstance],
                [
                    DirectInstance(
                        context_variables={},
                        expected_result=None,
                        metadata=None,
                        response=i,
                    )
                    for i in cast(Sequence[str], instances)
                ],
            )
        else:
            parsed_instances = cast(Sequence[DirectInstance], instances)
        return parsed_instances

    def _get_parsed_criteria(
        self, criteria: Sequence[CriteriaWithOptions] | Sequence[str]
    ) -> Sequence[CriteriaWithOptions]:
        if isinstance(criteria, Sequence) and all(isinstance(x, str) for x in criteria):
            return [
                CriteriaWithOptions(
                    name="llm_judge",
                    description=description,
                    options=[
                        CriteriaOption(name="Yes", description=""),
                        CriteriaOption(name="No", description=""),
                    ],
                    prediction_field="response",
                )
                for description in cast(Sequence[str], criteria)
            ]
        else:
            return [
                CriteriaWithOptions(
                    name=criterion.name,
                    description=criterion.description,
                    options=criterion.options,
                    prediction_field=criterion.prediction_field,
                )
                for criterion in cast(Sequence[CriteriaWithOptions], criteria)
            ]

    @abstractmethod
    def _run(
        self,
        instances: Sequence[DirectInstance],
        criteria: Sequence[CriteriaWithOptions],
    ) -> Sequence[DirectInstanceResult]: ...

    def get_predictions(self, instances: Sequence[DirectInstance]) -> list[str]:
        return [i.response for i in instances]

    def get_descriptor(self) -> JudgeDescriptor:
        return JudgeDescriptor(
            self.get_name(), "direct", self.get_inference_engine_id()
        )


class PairwiseJudge(Judge[PairwiseInstance, Criteria, PairwiseInstanceResult], ABC):
    def _evaluate(
        self,
        instances: Sequence[PairwiseInstance],
        criteria: Sequence[Criteria],
        check_positional_bias: bool,
    ) -> Sequence[PairwiseInstanceResult]:
        if check_positional_bias:
            results: Sequence[PairwiseInstanceResult] = self._run(
                instances=[
                    *instances,
                    *[
                        PairwiseInstance(
                            context_variables=i.context_variables,
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
        instances: Sequence[PairwiseInstance],
        criteria: Sequence[Criteria],
    ) -> Sequence[PairwiseInstanceResult]: ...

    def get_predictions(self, instances: Sequence[PairwiseInstance]) -> list[list[str]]:
        return [i.responses for i in instances]

    def get_descriptor(self) -> JudgeDescriptor:
        return JudgeDescriptor(
            self.get_name(), "pairwise", self.inference_engine.get_engine_id()
        )

    def _get_instances_from_str(
        self,
        instances: Sequence[PairwiseInstance] | Sequence[str] | Sequence[list[str]],
    ) -> Sequence[PairwiseInstance]:
        parsed_instances: Sequence[PairwiseInstance]
        if isinstance(instances, Sequence) and all(
            isinstance(x, str) for x in instances
        ):
            parsed_instances = cast(
                Sequence[PairwiseInstance],
                [
                    PairwiseInstance(
                        context_variables={},
                        expected_result=None,
                        metadata=None,
                        responses=i,
                    )
                    for i in cast(Sequence[list[str]], instances)
                ],
            )
        else:
            parsed_instances = cast(Sequence[PairwiseInstance], instances)
        return parsed_instances

    def _get_parsed_criteria(
        self, criteria: Sequence[Criteria] | Sequence[str]
    ) -> Sequence[Criteria]:
        if isinstance(criteria, Sequence) and all(isinstance(x, str) for x in criteria):
            return [
                CriteriaWithOptions(
                    name="llm_judge",
                    description=description,
                )
                for description in cast(Sequence[str], criteria)
            ]
        else:
            return cast(Sequence[CriteriaWithOptions], criteria)


# ----------------------------------------------------------------------
# Helper mix‑in for judges that use LangChain runnables
# ----------------------------------------------------------------------
class UnitxtInferenceLangchainRunnable(InferenceEngineMixin):
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
                cast(CrossProviderInferenceEngine, self.inference_engine).infer(
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
            max_retries=3,
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
            max_retries=3,
        )
