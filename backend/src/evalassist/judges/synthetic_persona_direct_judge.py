import logging
import random
from collections.abc import Sequence
from textwrap import dedent
from typing import Any, cast

from langchain.output_parsers import OutputFixingParser
from langchain.prompts import PromptTemplate
from langchain_core.exceptions import OutputParserException
from pydantic import BaseModel, Field
from unitxt.inference import CrossProviderInferenceEngine, InferenceEngine
from unitxt.llm_as_judge import CriteriaWithOptions

from ..api.common import DirectInstance, DirectInstanceResult, DirectPositionalBias
from .base import DirectJudge, UnitxtInferenceLangchainRunnable

logger = logging.getLogger(__name__)


class SimpleDirectJudge(DirectJudge, UnitxtInferenceLangchainRunnable):
    generate_synthetic_persona: bool

    def __init__(
        self,
        inference_engine: InferenceEngine,
        generate_synthetic_persona=False,
    ):
        super().__init__(
            inference_engine=inference_engine,
        )
        self.generate_synthetic_persona = generate_synthetic_persona

    def get_name(self) -> str:
        return f"simple{'_with_synthetic_persona' if self.generate_synthetic_persona else ''}"

    def generate_persona(self, instance_str, criterion: CriteriaWithOptions):
        class SyntheticPersona(BaseModel):
            persona_name: str = Field(
                ...,
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
                "criteria_name": criterion.name,
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
                    Name: {criteria_name}
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
        print(persona)
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
        for criterion in criteria:

            class DynamicOutputJudgeModel(BaseModel):
                assessment: str = Field(..., description="Step by step assessment")
                selected_option: str = Field(
                    ...,
                    description=f"The chosen option. Any of {', '.join([o.name for o in criterion.options])}",
                )

            classes.append(DynamicOutputJudgeModel)

            output_parser: OutputFixingParser[DynamicOutputJudgeModel] = (
                self.get_pydantic_output_fixing_parser(DynamicOutputJudgeModel)
            )
            output_parsers.append(output_parser)

            format_instructions: str = output_parser.get_format_instructions()
            format_instructions_list.append(format_instructions)

            criteria_options: str = "\n- ".join(
                [f"{option.name}: {option.description}" for option in criterion.options]
            )
            criteria_options = "- " + criteria_options

            criteria_options_list.append(criteria_options)

        predictions: list[str] = [i.response for i in instances]
        context_variables_list: list[dict[str, str]] = [
            instance.context_variables for instance in instances
        ]
        str_context_variables_list: list[str] = [
            "\n".join(f"{k}: {v}" for k, v in c.items()) for c in context_variables_list
        ]

        context_sections: list[str] = [
            "\n\n### Context\n" + c + "\n" for c in str_context_variables_list
        ]

        if self.generate_synthetic_persona:
            persona_name, persona_description = self.generate_persona(
                instance_str="Context:\n"
                + str_context_variables_list[0]
                + "\nText to evaluate: "
                + cast(str, predictions[0]),
                criterion=criteria[0],
            )
        else:
            persona_name, persona_description = (
                "an evaluator",
                "an expert on evaluating text based on a rubric",
            )

        prompt_template = PromptTemplate(
            input_variables=[
                "text_to_evaluate",
                "context_section",
                "criteria_name",
                "criteria_description",
                "criteria_options",
                "format_instructions",
            ],
            partial_variables={
                "persona_name": persona_name,
                "persona_description": persona_description,
            },
            template=dedent(
                text="""\
                You are {persona_name}. You {persona_description}. You will be given:
                - **Criterion** (name, description, options)
                - **Optional context**
                - **A text** to evaluate

                Your job:
                1. Think step-by‑step through your reasoning about which option best fits.
                2. Write your full chain‑of‑thought *only* inside the `assessment` JSON field.
                3. The chain-of-thought should last no more than three paragraphs (6 to 8 sentences) and use markdown.
                4. At the end, set `"selected_option"` to one of the provided options based on the assessment.

                ### Criterion:
                Name: {criteria_name}
                Description: {criteria_description}
                Options:
                {criteria_options}{context_section}

                ### Text to evaluate
                {text_to_evaluate}

                {format_instructions}
            """,
            ),
        )

        prompts: list[str] = [
            prompt_template.format(
                text_to_evaluate=prediction,
                context_section=context_section,
                criteria_name=criterion.name,
                criteria_description=criterion.description,
                criteria_options=criterion_options,
                format_instructions=format_instructions,
            )
            for prediction, context_section, criterion, criterion_options, format_instructions in zip(
                predictions,
                context_sections,
                criteria,
                criteria_options_list,
                format_instructions_list,
            )
        ]

        responses: list[str] = cast(
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
            responses, output_parsers, classes, criteria
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

        return [
            DirectInstanceResult(
                option=selected_option,
                explanation=explanation,
                positional_bias=DirectPositionalBias(
                    detected=False,
                ),
                metadata={
                    "generated_persona_name": persona_name,
                    "generated_persona_description": persona_description,
                    "prompt": prompt,
                },
            )
            for selected_option, explanation, prompt in zip(
                selected_options, explanations, prompts
            )
        ]
