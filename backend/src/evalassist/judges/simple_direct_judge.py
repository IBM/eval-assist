import logging
import random
from collections.abc import Sequence
from textwrap import dedent
from typing import Any, cast

from langchain.output_parsers import OutputFixingParser
from langchain.prompts import PromptTemplate
from langchain_core.exceptions import OutputParserException
from pydantic import BaseModel, Field, field_validator
from unitxt.inference import CrossProviderInferenceEngine, InferenceEngine
from unitxt.llm_as_judge import CriteriaWithOptions

from .base import (
    DirectJudge,
    UnitxtInferenceEngineMixin,
    UnitxtInferenceLangchainRunnable,
)
from .types import DirectInstance, DirectInstanceResult, DirectPositionalBias

logger = logging.getLogger(__name__)


class SimpleDirectJudge(
    DirectJudge, UnitxtInferenceLangchainRunnable, UnitxtInferenceEngineMixin
):
    generate_synthetic_persona: bool

    def __init__(
        self,
        inference_engine: InferenceEngine,
        generate_synthetic_persona: bool = False,
        judge_description_prompt: str | None = None,
        generate_feedback: bool = False,
    ):
        super().__init__(
            inference_engine=inference_engine,
        )
        if generate_synthetic_persona and judge_description_prompt:
            raise ValueError(
                "Either provide set generate_synthetic_persona to False or don't provide a judge_description_prompt."
            )
        self.generate_synthetic_persona = generate_synthetic_persona
        self.judge_description_prompt = judge_description_prompt
        self.generate_feedback = generate_feedback

    def get_name(self) -> str:
        return f"simple{'_with_synthetic_persona' if self.generate_synthetic_persona else ''}{'_with_feedback' if self.generate_feedback else ''}"

    def generate_persona(self, instance_str, criterion: CriteriaWithOptions):
        class SyntheticPersona(BaseModel):
            persona_name: str = Field(
                default=...,
                description=f"The persona that will evaluate a {criterion.prediction_field} based on the criteria {criterion.name}",
            )
            persona_description: str = Field(
                ...,
                description="The description of why the <persona_name> is ideal to perform the evaluation. Don't include the the initial 'you'",
            )

        output_parser: OutputFixingParser[SyntheticPersona] = (
            self.get_pydantic_output_fixing_parser(SyntheticPersona)
        )

        format_instruction = output_parser.get_format_instructions()

        template = PromptTemplate(
            input_variables=[],
            partial_variables={
                "criteria_name_section": f"Criteria name: {criterion.name}"
                if criterion.name
                else "",
                "criteria_description": criterion.description,
                "criteria_options": "\n".join(
                    [f"{o.name}: {o.description}" for o in criterion.options]
                ),
                "instance_example": instance_str,
                "format_instruction": format_instruction,
            },
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

                    The persona info will be used as this: "You are <persona_name>. Your task is to evaluate a text to evaluate. You <persona_description>, which makes you the appropiate persona to perform the evaluation".
                    {format_instruction}
                """
            ),
        )

        prompt = template.format()
        response = cast(
            str,
            cast(CrossProviderInferenceEngine, self.inference_engine)(
                [{"source": prompt, "data_classification_policy": ["public"]}]
            )[0],
        )
        parsed_response = output_parser.parse(response)
        persona = parsed_response
        return persona.persona_name, persona.persona_description

    def _run(
        self,
        instances: Sequence[DirectInstance],
        criteria: Sequence[CriteriaWithOptions],
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

            criteria_options: str = "\n- ".join(
                [f"{option.name}: {option.description}" for option in criterion.options]
            )
            criteria_options = "- " + criteria_options

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
            instance.context_variables for instance in instances
        ]
        str_context_variables_list: list[str | None] = [
            "\n".join(f"{k}: {v}" for k, v in c.items()) if len(c) else None
            for c in context_variables_list
        ]

        context_sections: list[str] = [
            ("\n\n### Context\n" + c + "\n") if c is not None else ""
            for c in str_context_variables_list
        ]
        judge_description_section: str
        if self.judge_description_prompt:
            judge_description_section = self.judge_description_prompt
        else:
            if self.generate_synthetic_persona:
                persona_name, persona_description = self.generate_persona(
                    instance_str=("Context:\n" + str_context_variables_list[0])
                    if str_context_variables_list[0]
                    else "" + "\nText to evaluate: " + cast(str, predictions[0]),
                    criterion=criteria[0],
                )
            else:
                persona_name, persona_description = (
                    "an evaluator",
                    "an expert on evaluating text based on a rubric",
                )
            judge_description_section = (
                f"You are {persona_name}. You {persona_description}."
            )

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
            ],
            partial_variables={
                "judge_description_section": judge_description_section,
            },
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

                ### Criterion:
                {criteria_name_section}
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
                criteria_name_section=f"Criteria name: {criterion.name}"
                if criterion.name
                else "",
                criteria_description=criterion.description,
                criteria_options=criterion_options,
                format_instructions=format_instructions,
                prediction_field=prediction_field,
                feedback_step_section=feedback_step_section,
            )
            for prediction, context_section, criterion, criterion_options, format_instructions, prediction_field, feedback_step_section in zip(
                predictions,
                context_sections,
                criteria,
                criteria_options_list,
                format_instructions_list,
                prediction_fields,
                feedback_step_sections,
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

        for response, output_parser, klass, criterion in zip(
            unparsed_responses, output_parsers, classes, criteria
        ):
            try:
                parsed_response = output_parser.parse(completion=response)
            except OutputParserException:
                logger.debug(
                    f"Selected random option for model {self.inference_engine.get_engine_id()} because it was unable to generate a chosen option"
                )
                parsed_response = klass(
                    selected_option=random.choice(
                        [o.name for o in criterion.options]  # nosec
                    ),
                    assessment="",
                )

            parsed_responses.append(parsed_response)
        explanations: list[str] = [r.assessment for r in parsed_responses]
        selected_options: list[str] = [r.selected_option for r in parsed_responses]
        feedbacks: list[str | None] = [
            None
            if not self.generate_feedback
            else (r.feedback if r.feedback != "" else "Nothing to improve.")
            for r in parsed_responses
        ]
        return [
            DirectInstanceResult(
                option=selected_option,
                explanation=explanation,
                feedback=feedback,
                positional_bias=DirectPositionalBias(
                    detected=False,
                ),
                metadata={"prompt": prompt, "unparsed_response": unparsed_response},
            )
            for selected_option, explanation, feedback, prompt, unparsed_response in zip(
                selected_options, explanations, feedbacks, prompts, unparsed_responses
            )
        ]
