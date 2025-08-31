import logging
import random
from collections.abc import Sequence
from concurrent.futures import ThreadPoolExecutor
from textwrap import dedent
from typing import Any, cast

from langchain.output_parsers import OutputFixingParser
from langchain.prompts import PromptTemplate
from langchain_core.exceptions import OutputParserException
from pydantic import BaseModel, Field, field_validator
from unitxt.inference import InferenceEngine

from .base import (
    DirectJudge,
    UnitxtInferenceEngineMixin,
    UnitxtInferenceLangchainRunnable,
)
from .types import Criteria, DirectInstance, DirectInstanceResult

logger = logging.getLogger(__name__)


class SimpleDirectJudge(
    DirectJudge, UnitxtInferenceLangchainRunnable, UnitxtInferenceEngineMixin
):
    generate_synthetic_persona: bool
    generate_feedback: bool
    judge_description_prompt: str | None

    def __init__(
        self,
        inference_engine: InferenceEngine,
        generate_synthetic_persona: bool = False,
        judge_description_prompt: str | None = None,
        generate_feedback: bool = False,
        use_self_consistency: bool = False,
    ):
        super().__init__(
            inference_engine=inference_engine, use_self_consistency=use_self_consistency
        )
        if generate_synthetic_persona and judge_description_prompt:
            raise ValueError(
                "Either provide set generate_synthetic_persona to False or don't provide a judge_description_prompt."
            )
        self.generate_synthetic_persona = generate_synthetic_persona
        self.judge_description_prompt = judge_description_prompt
        self.generate_feedback = generate_feedback

    def parse_response(self, unparsed_response, output_parser, klass, criterion):
        metadata = {}
        try:
            parsed_response = output_parser.parse(completion=unparsed_response)
            metadata["failed_generation"] = False
        except OutputParserException as e:
            logger.debug(
                f"Selected random option for model {self.inference_engine.get_engine_id()} because it was unable to generate a chosen option"
            )
            parsed_response = klass(
                selected_option=random.choice(
                    [o.name for o in criterion.options]  # nosec
                ),
                assessment="",
            )
            metadata["failed_generation"] = True
            metadata["failed_generation_original_output"] = unparsed_response
            metadata["failed_generation_final_output"] = e.llm_output
        return parsed_response, metadata

    def get_name(self) -> str:
        return f"simple{'_with_synthetic_persona' if self.generate_synthetic_persona else ''}{'_with_feedback' if self.generate_feedback else ''}{'_with_self_consistency' if self.use_self_consistency else ''}"

    def generate_personas(
        self,
        context_sections: list[str],
        predictions: list[str],
        criteria: Sequence[Criteria],
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

    def _run(
        self,
        instances: Sequence[DirectInstance],
        criteria: Sequence[Criteria],
    ) -> list[DirectInstanceResult]:
        output_parsers: list[OutputFixingParser] = []
        format_instructions_list = []
        criteria_options_list = []
        classes = []
        feedback_step_sections = []
        prediction_fields = []
        for criterion in criteria:
            criterion_names = [o.name for o in criterion.options]

            class DynamicOutputJudgeModel(BaseModel):
                assessment: str = Field(..., description="Step by step assessment")
                selected_option: str = Field(
                    ...,
                    description=f"The chosen option. Any of {', '.join([o.name for o in criterion.options])}",
                )

                @field_validator("selected_option")
                def validate_value(cls, v):
                    if v not in criterion_names:
                        raise ValueError(f"value must be one of {criterion_names}")
                    return v

            class DynamicOutputJudgeModelWithFeedback(DynamicOutputJudgeModel):
                feedback: str = Field(
                    default="",
                    description=f"Actionable suggestions that would help improve the evaluated {criterion.prediction_field if criterion.prediction_field is not None else 'response'} based on the assessment",
                )

            output_model_klass = (
                DynamicOutputJudgeModelWithFeedback
                if self.generate_feedback
                else DynamicOutputJudgeModel
            )

            classes.append(output_model_klass)

            output_parser: OutputFixingParser[DynamicOutputJudgeModel] = (
                self.get_pydantic_output_fixing_parser(output_model_klass)
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
            instance.context if instance.context is not None else {}
            for instance in instances
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

        futures = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            for unparsed_response, output_parser, klass, criterion in zip(
                unparsed_responses, output_parsers, classes, criteria
            ):
                futures.append(
                    executor.submit(
                        self.parse_response,
                        unparsed_response,
                        output_parser,
                        klass,
                        criterion,
                    )
                )

        parsed_responses = []
        parsing_metadatas = []
        for future in futures:
            parsed_response, metadata = future.result()
            parsed_responses.append(parsed_response)
            parsing_metadatas.append(metadata)

        explanations: list[str] = [r.assessment for r in parsed_responses]
        selected_options: list[str] = [r.selected_option for r in parsed_responses]
        feedbacks: list[str | None] = [
            None if not self.generate_feedback else r.feedback for r in parsed_responses
        ]
        return [
            DirectInstanceResult(
                criteria=criterion,
                option=selected_option,
                explanation=explanation,
                feedback=feedback,
                positional_bias=None,
                metadata={
                    **parsing_metadata,
                    "prompt": prompt,
                    "unparsed_response": unparsed_response,
                },
            )
            for selected_option, explanation, feedback, prompt, unparsed_response, criterion, parsing_metadata in zip(
                selected_options,
                explanations,
                feedbacks,
                prompts,
                unparsed_responses,
                criteria,
                parsing_metadatas,
            )
        ]
