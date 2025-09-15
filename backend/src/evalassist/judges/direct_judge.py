import asyncio
import logging
import random
from collections.abc import Callable
from textwrap import dedent
from typing import Any, Literal, cast

from evalassist.judges.utils import (
    generate_dynamic_pydantic_model,
    get_context_dict,
    is_float,
)
from langchain.output_parsers import OutputFixingParser
from langchain.prompts import PromptTemplate
from langchain_core.exceptions import OutputParserException
from pydantic import BaseModel, Field
from unitxt.inference import InferenceEngine

from .base import BaseDirectJudge, JudgeDescriptor, UnitxtInferenceLangchainRunnable
from .types import Criteria, DirectInstance, DirectInstanceResult

logger = logging.getLogger(__name__)


class SafeEventLoopPolicy(asyncio.DefaultEventLoopPolicy):
    def get_event_loop(self):
        try:
            return super().get_event_loop()
        except RuntimeError:
            loop = self.new_event_loop()
            self.set_event_loop(loop)
            return loop


asyncio.set_event_loop_policy(SafeEventLoopPolicy())


class DirectJudge(BaseDirectJudge, UnitxtInferenceLangchainRunnable):
    generate_synthetic_persona: bool
    generate_feedback: bool
    judge_description_prompt: str | None
    on_generation_failure: Literal["raise", "random"]

    def __init__(
        self,
        inference_engine: InferenceEngine,
        max_retries: int,
        generate_synthetic_persona: bool = False,
        judge_description_prompt: str | None = None,
        generate_feedback: bool = False,
        self_consistency: bool | int = False,
        on_generation_failure: Literal["raise", "random"] = "random",
    ):
        super().__init__(
            inference_engine=inference_engine,
            self_consistency=self_consistency,
            max_retries=max_retries,
        )

        if on_generation_failure not in ["raise", "random"]:
            raise ValueError(
                "on_generation_failure must be either 'raise' or 'random'. Received {on_generation_failure} instead."
            )
        self.on_generation_failure = on_generation_failure

        if generate_synthetic_persona and judge_description_prompt:
            raise ValueError(
                "Either provide set generate_synthetic_persona to False or don't provide a judge_description_prompt."
            )

        if self.self_consistency:
            temp = getattr(self.inference_engine, "temperature", None)
            if temp is not None:
                try:
                    if float(temp) == 0.0:
                        logger.warning(
                            "Self-consistency may not bring any benefit when temperature is 0."
                        )
                except (TypeError, ValueError):
                    logger.debug(
                        "Could not interpret temperature value for self-consistency check."
                    )

        self.generate_synthetic_persona = generate_synthetic_persona
        self.judge_description_prompt = judge_description_prompt
        self.generate_feedback = generate_feedback

    async def parse_response_async(
        self,
        unparsed_response: str,
        output_parser: OutputFixingParser,
        klass: type[BaseModel],
        on_failure_default: str | int | list[str | int],
    ) -> tuple[Any, dict[str, Any]]:
        metadata = {}
        try:
            # Always use the async parse when in async context
            parsed_response = await output_parser.aparse(completion=unparsed_response)
            metadata["generation_failed"] = False

        except OutputParserException as e:
            # fallback behavior if parsing fails
            if self.on_generation_failure == "raise":
                raise ValueError(
                    f"The judge was unable to generate a valid evaluation result. The model {self.inference_engine.get_engine_id()}'s output's validation failed with the following error:\n{e.llm_output}"
                )
            else:
                if on_failure_default is None:
                    selected_option = ""
                elif isinstance(on_failure_default, (str, int)):
                    selected_option = on_failure_default
                else:
                    selected_option = random.choice(on_failure_default)  # nosec

                parsed_response = klass(
                    selected_option=selected_option,
                    assessment="",
                )
                metadata["generation_failed"] = True
                metadata["generation_failed_original_output"] = unparsed_response
                metadata["generation_failed_final_output"] = e.llm_output

        return parsed_response, metadata

    async def parse_all_responses_async(
        self,
        unparsed_responses: list[str],
        output_parsers: list[OutputFixingParser],
        classes: list[type[BaseModel]],
        on_failure_default: list[str | int | list[str | int]],
    ) -> tuple[list[Any], list[dict[str, Any]]]:
        tasks = []
        for unparsed_response, output_parser, klass, on_failure_default_item in zip(
            unparsed_responses, output_parsers, classes, on_failure_default
        ):
            tasks.append(
                self.parse_response_async(
                    unparsed_response=unparsed_response,
                    output_parser=output_parser,
                    klass=klass,
                    on_failure_default=on_failure_default_item,
                )
            )
        results = await asyncio.gather(*tasks)
        parsed_responses, metadatas = zip(*results)
        return list(parsed_responses), list(metadatas)

    def parse_all_responses(
        self,
        unparsed_responses: list[str],
        output_parsers: list[OutputFixingParser],
        classes: list[type[BaseModel]],
        on_failure_default: list[str | int | list[str | int]],
    ):
        return asyncio.run(
            self.parse_all_responses_async(
                unparsed_responses, output_parsers, classes, on_failure_default
            )
        )

    def get_name(self) -> str:
        return f"simple{'_with_synthetic_persona' if self.generate_synthetic_persona else ''}{'_with_feedback' if self.generate_feedback else ''}{f'_with_self_consistency_{self.self_consistency}_attempts' if self.self_consistency else ''}"

    def get_descriptor(self) -> JudgeDescriptor:
        judge_descriptor = JudgeDescriptor(self.get_name(), "direct", "")
        judge_descriptor.inference_engine_id = self.get_inference_engine_id()
        return judge_descriptor

    def generate_personas(
        self,
        context_sections: list[str],
        predictions: list[str],
        criteria: list[Criteria],
    ) -> list[tuple[str, str]]:
        unique_criteria_instance: list[tuple[Criteria, tuple[str, str]]] = list(
            {
                criterion.name: (criterion, (context_section, prediction))
                for criterion, context_section, prediction in zip(
                    criteria, context_sections, predictions
                )
            }.values()
        )
        unique_criteria, instance_examples = zip(*unique_criteria_instance)  # type: ignore
        unique_criteria: list[Criteria] = list(unique_criteria)
        instance_examples: list[tuple[str, str]] = list(instance_examples)

        instance_examples_str = [
            context_section + "\nText to evaluate: " + prediction
            for context_section, prediction in instance_examples
        ]

        synthetic_persona_klasses = []
        output_parsers = []
        format_instructions = []
        for criterion in unique_criteria:

            class SyntheticPersona(BaseModel):
                persona_name: str = Field(
                    default=...,
                    description=f"The name of the persona responsible for evaluating the {criterion.prediction_field} according to the criterion {criterion.name}.",
                )
                persona_description: str = Field(
                    ...,
                    description="The description of why the <persona_name> is ideal to perform the evaluation. Don't include the the initial 'you'. For example: 'an expert on evaluating text based on a rubric' or 'a customer support specialist experienced in clarity and tone assessment'.",
                )

            synthetic_persona_klasses.append(SyntheticPersona)

            output_parser: OutputFixingParser = self.get_pydantic_output_fixing_parser(
                SyntheticPersona
            )
            output_parsers.append(output_parser)
            format_instructions.append(output_parser.get_format_instructions())

        template = PromptTemplate(
            input_variables=[
                "criteria_name_section"
                "criteria_description"
                "criteria_options"
                "prediction_field"
                "instance_example"
                "format_instruction"
            ],
            template=dedent(
                text="""\
                    Your task is to generate a persona that is the most appropriate to evaluate a text based on the following criteria.
                    You will be provided with the criteria name, description and options and an example instance.

                    ### Criterion:

                    {criteria_name_section}
                    Description: {criteria_description}
                    Options:
                    {criteria_options}

                    ### Example instance

                    {instance_example}

                    For the persona, you will generate the name or role (e.g. a doctor, a philosopher, a lawyer) and a brief description that makes emphasis on what makes the persona the ideal for performing the evaluation (e.g. have a lot of experience reading and writing email summaries).

                    ### Output format

                    The persona info will be used as this:
                    "You are <persona_name>. Your task is to evaluate a {prediction_field}. You <persona_description>".

                    {format_instruction}
                """
            ),
        )

        prompts = [
            template.format(
                criteria_name_section=f"Criteria name: {criterion.name}"
                if criterion.name
                else "",
                criteria_description=criterion.description,
                criteria_options="\n".join(
                    [
                        f"- {o.name}{f': {o.description}' if o.description else ''}"
                        for o in criterion.options
                    ]
                ),
                prediction_field=criterion.prediction_field
                if criterion.prediction_field
                else "text",
                instance_example=instance_example_str,
                format_instruction=format_instruction,
            )
            for criterion, instance_example_str, format_instruction in zip(
                criteria, instance_examples_str, format_instructions
            )
        ]

        unparsed_responses = self.inference_engine(
            [
                {"source": prompt, "data_classification_policy": ["public"]}
                for prompt in prompts
            ]
        )

        parsed_responses = [
            output_parser.parse(unparsed_response)
            for output_parser, unparsed_response in zip(
                output_parsers, unparsed_responses
            )
        ]
        personas = [
            (persona.persona_name, persona.persona_description)
            for persona in parsed_responses
        ]  # type: ignore
        criteria_name_to_persona = {
            criterion.name: persona
            for criterion, persona in zip(unique_criteria, personas)
        }
        personas_completed = [
            criteria_name_to_persona[criterion.name] for criterion in criteria
        ]
        return personas_completed

    def generate_pydantic_model(
        self,
        model_name: str,
        criterion: Criteria,
        include_feedback: bool,
    ) -> type[BaseModel]:
        criteria_option_names = [option.name for option in criterion.options]

        def validate_selected_option(cls, value: str) -> str:
            if value not in criteria_option_names:
                raise ValueError(f"value must be one of {criteria_option_names}")
            return value

        field_defs = [
            (
                "assessment",
                str,
                Field(..., description="Step by step explanation of the evaluation"),
                [],
            ),
            (
                "selected_option",
                str,
                Field(
                    ...,
                    description=f"The chosen option. Any of {', '.join(criteria_option_names)}",
                ),
                [validate_selected_option],
            ),
        ]
        model: type[BaseModel]
        if not include_feedback:
            model = generate_dynamic_pydantic_model(model_name, field_defs)
        else:
            field_defs.append(
                (
                    "feedback",
                    str,
                    Field(
                        default="",
                        description=f"Actionable suggestions that would help improve the evaluated {criterion.prediction_field if criterion.prediction_field is not None else 'response'} based on the assessment",
                    ),
                    [],
                )
            )
            model = generate_dynamic_pydantic_model(
                f"{model_name}WithFeedback", field_defs
            )
        return model

    def _run(
        self,
        instances: list[DirectInstance],
        criteria: list[Criteria],
    ) -> list[DirectInstanceResult]:
        output_parsers: list[OutputFixingParser] = []
        format_instructions_list = []
        criteria_options_list = []
        classes = []
        feedback_step_sections = []
        prediction_fields = []
        for criterion in criteria:
            klass = self.generate_pydantic_model(
                model_name=f"{criterion.name}_model",
                criterion=criterion,
                include_feedback=self.generate_feedback,
            )
            classes.append(klass)

            output_parser: OutputFixingParser = self.get_pydantic_output_fixing_parser(
                klass
            )
            output_parsers.append(output_parser)

            format_instructions: str = output_parser.get_format_instructions()
            format_instructions_list.append(format_instructions)

            criteria_options: str = "\n".join(
                [
                    f"- {option.name}{f': {option.description}' if option.description else ''}"
                    for option in criterion.options
                ]
            )
            criteria_options_list.append(criteria_options)

            prediction_field = (
                criterion.prediction_field
                if criterion.prediction_field is not None
                else "response"
            )
            prediction_fields.append(prediction_field)

            feedback_step_section = (
                f'5. At the end, provide "feedback" consisting of actionable suggestions that would help improve the evaluated {prediction_field}. Unlike the assessment, which explains the reasoning behind the judgment, the feedback should focus on guiding refinement. For example, in creative writing, it could suggest improving clarity, coherence, or narrative flow. In analytical tasks, it could recommend strengthening evidence, refining arguments, or correcting inaccuracies. Keep feedback concise and specific enough to support iterative improvement. If you consider that the {prediction_field} is optimal, leave the "feedback" field empty ("")'
                if self.generate_feedback
                else ""
            )
            feedback_step_sections.append(feedback_step_section)

        predictions: list[str] = [i.response for i in instances]
        context_variables_list: list[dict[str, str]] = [
            get_context_dict(instance, criterion)
            for instance, criterion in zip(instances, criteria)
        ]
        str_context_variables_list: list[str | None] = [
            "\n\n".join(f"- {k}: {v}" for k, v in c.items()) if len(c) else None
            for c in context_variables_list
        ]

        context_sections: list[str] = [
            ("\n\n### Context\n\n" + c + "\n") if c is not None else ""
            for c in str_context_variables_list
        ]
        if self.judge_description_prompt:
            judge_description_sections = [self.judge_description_prompt] * len(criteria)
        else:
            if self.generate_synthetic_persona:
                personas = self.generate_personas(
                    context_sections=context_sections,
                    predictions=predictions,
                    criteria=criteria,
                )
            else:
                persona_name, persona_description = (
                    "an evaluator",
                    "an expert on evaluating text based on a rubric.",
                )
                personas = [(persona_name, persona_description)] * len(criteria)
            judge_description_sections = [
                f"You are a {persona_name}. You are {persona_description}"
                for persona_name, persona_description in personas
            ]

        prompt_template = PromptTemplate(
            input_variables=[
                "text_to_evaluate",
                "context_section",
                "criteria_name_section",
                "criteria_description",
                "criteria_options",
                "format_instructions",
                "prediction_field",
                "feedback_step_section",
                "judge_description_section",
            ],
            template=dedent(
                text="""\
                {judge_description_section}

                You will be given:
                - **Criterion** (name, description, options)
                - **Optional context**
                - **The {prediction_field}** to evaluate

                ### Important steps:

                1. Think step-by‑step through your reasoning about which option best fits.
                2. Write your full chain‑of‑thought *only* inside the `assessment` JSON field.
                3. The chain-of-thought should use markdown code for easier reading and parsing.
                4. Set `"selected_option"` to one of the provided options based on the assessment.
                {feedback_step_section}

                ### Criteria:{criteria_name_section}
                Description: {criteria_description}
                Options:
                {criteria_options}{context_section}

                ### The {prediction_field} to evaluate

                {text_to_evaluate}

                ### Output format

                {format_instructions}
                Output must be valid JSON only — no extra text.
            """,
            ),
        )

        prompts: list[str] = [
            prompt_template.format(
                text_to_evaluate=prediction,
                context_section=context_section,
                criteria_name_section=f"\n\nCriteria name: {criterion.name}"
                if criterion.name
                else "\n",
                criteria_description=criterion.description,
                criteria_options=criterion_options,
                format_instructions=format_instructions,
                prediction_field=prediction_field,
                feedback_step_section=feedback_step_section,
                judge_description_section=judge_description_section,
            )
            for prediction, context_section, criterion, criterion_options, format_instructions, prediction_field, feedback_step_section, judge_description_section in zip(
                predictions,
                context_sections,
                criteria,
                criteria_options_list,
                format_instructions_list,
                prediction_fields,
                feedback_step_sections,
                judge_description_sections,
            )
        ]

        unparsed_responses: list[str] = cast(
            list[str],
            self.inference_engine.infer(
                dataset=[
                    {"source": prompt, "data_classification_policy": ["public"]}
                    for prompt in prompts
                ]
            ),
        )
        parsed_responses: list[Any] = []

        parsed_responses, parsing_metadatas = self.parse_all_responses(
            unparsed_responses=unparsed_responses,
            output_parsers=output_parsers,
            classes=classes,
            on_failure_default=[
                [option.name for option in criterion.options] for criterion in criteria
            ],
        )

        explanations: list[str] = [r.assessment for r in parsed_responses]
        selected_options: list[str] = [r.selected_option for r in parsed_responses]
        feedbacks: list[str | None] = [
            None if not self.generate_feedback else r.feedback for r in parsed_responses
        ]
        return [
            DirectInstanceResult(
                instance=instance,
                criteria=criterion,
                option=selected_option,
                explanation=explanation,
                feedback=feedback,
                # score=next(iter(option.name for option in criterion.options if option.name == selected_option)).score,
                positional_bias=None,
                metadata={
                    **parsing_metadata,
                    "prompt": prompt,
                    "unparsed_response": unparsed_response,
                },
            )
            for selected_option, explanation, feedback, prompt, unparsed_response, criterion, parsing_metadata, instance in zip(
                selected_options,
                explanations,
                feedbacks,
                prompts,
                unparsed_responses,
                criteria,
                parsing_metadatas,
                instances,
            )
        ]

    def evaluate_with_custom_prompt(
        self,
        judge_prompts: list[str],
        valid_outputs: list[str] | tuple[int, int] | None = None,
    ) -> list[DirectInstanceResult]:
        field_defs: list[tuple[str, type, Any, list[Callable[..., Any]]]] = [
            (
                "assessment",
                str,
                Field(..., description="Step by step explanation of the evaluation"),
                [],
            ),
        ]

        if valid_outputs is not None:
            if isinstance(valid_outputs, list):

                def validate_selected_option(cls, value: str) -> str:
                    if value not in valid_outputs:
                        raise ValueError(f"value must be one of {valid_outputs}")
                    return value

                field_defs.append(
                    (
                        "selected_option",
                        str,
                        Field(
                            ...,
                            description=f"The chosen option. Any of {', '.join(valid_outputs)}",
                        ),
                        [validate_selected_option],
                    )
                )
            else:
                if len(valid_outputs) != 2:
                    raise ValueError(
                        "If a tuple is provided as valid_outputs, it must have two element as it is interpreted as a numerical interval."
                    )
                if not isinstance(valid_outputs, tuple):
                    raise ValueError(
                        f"valid_outputs must be of type tuple. Instead, got type {type(valid_outputs)}"
                    )
                if not isinstance(valid_outputs[0], int) or not isinstance(
                    valid_outputs[0], int
                ):
                    raise ValueError(
                        f"valid_outputs's numerical interval got unexpected types, you provided Tuple[{type(valid_outputs[0])}, {type(valid_outputs[1])}]"
                    )

                def validate_selected_score(cls, value: float) -> float:
                    if not (valid_outputs[0] <= value <= valid_outputs[1]):
                        raise ValueError(
                            f"Value must be greater or equal than {valid_outputs[0]} and less or equal than {valid_outputs[1]}"
                        )  # type: ignore
                    return value

                field_defs.append(
                    (
                        "selected_score",
                        int,
                        Field(
                            ...,
                            description=f"The chosen score. A number between {valid_outputs[0]} and {valid_outputs[1]}",
                        ),
                        [validate_selected_score],
                    )
                )
        else:
            field_defs.append(
                (
                    "selected_score",
                    int,
                    Field(
                        ...,
                        description="The chosen option.",
                    ),
                    [],
                )
            )

        dynamic_model = generate_dynamic_pydantic_model(
            "structured_output_model", field_defs
        )

        output_parser: OutputFixingParser = self.get_pydantic_output_fixing_parser(
            dynamic_model
        )

        format_instructions: str = output_parser.get_format_instructions()

        prompt_template = PromptTemplate(
            input_variables=["judge_prompt"],
            partial_variables={
                "format_instructions": format_instructions,
            },
            template=dedent(
                text="""\
                    {judge_prompt}

                    ### Output format
                    {format_instructions}

                    Only output the json instance, anything else will result in a failed generation.
                """,
            ),
        )

        prompts: list[str] = [
            prompt_template.format(
                judge_prompt=judge_prompt,
            )
            for judge_prompt in judge_prompts
        ]

        unparsed_responses: list[str] = cast(
            list[str],
            self.inference_engine.infer(
                dataset=[
                    {"source": prompt, "data_classification_policy": ["public"]}
                    for prompt in prompts
                ]
            ),
        )

        on_failure_default_options = []
        if valid_outputs is not None:
            if isinstance(valid_outputs, list):
                on_failure_default_options = valid_outputs
            else:
                on_failure_default_options = list(
                    range(valid_outputs[0], valid_outputs[1] + 1, 1)
                )

        else:
            on_failure_default_options = [""]

        on_failure_default_options = on_failure_default_options * len(judge_prompts)

        parsed_responses, parsing_metadatas = self.parse_all_responses(
            unparsed_responses=unparsed_responses,
            output_parsers=[output_parser] * len(unparsed_responses),
            classes=[dynamic_model] * len(unparsed_responses),
            on_failure_default=cast(
                list[str | int | list[str | int]], on_failure_default_options
            ),
        )

        explanations: list[str] = [r.assessment for r in parsed_responses]
        selected_options: list[str] = [
            getattr(r, "selected_option", str(getattr(r, "selected_score", None)))
            for r in parsed_responses
        ]

        return [
            DirectInstanceResult(
                option=selected_option,
                score=float(selected_option) if is_float(selected_option) else None,
                explanation=explanation,
                metadata={
                    **parsing_metadata,
                    "prompt": prompt,
                    "unparsed_response": unparsed_response,
                },
            )
            for selected_option, explanation, prompt, unparsed_response, parsing_metadata in zip(
                selected_options,
                explanations,
                prompts,
                unparsed_responses,
                parsing_metadatas,
            )
        ]
