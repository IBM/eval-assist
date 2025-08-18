from collections.abc import Sequence
from textwrap import dedent
from typing import cast

from evalassist.judges.base import DirectJudge, UnitxtInferenceLangchainRunnable
from evalassist.utils import CriteriaWithOptions
from langchain.output_parsers import OutputFixingParser
from langchain.prompts import PromptTemplate
from pydantic import BaseModel, Field
from unitxt.inference import InferenceEngine

from ..api.common import DirectInstance, DirectInstanceResult, DirectPositionalBias


class CustomPromptDirectJudge(DirectJudge, UnitxtInferenceLangchainRunnable):
    prompt: str

    def __init__(
        self,
        inference_engine: InferenceEngine,
        prompt: str,
    ):
        super().__init__(
            inference_engine=inference_engine,
        )
        self.prompt = prompt

    def get_name(self) -> str:
        return "custom_prompt"

    def _run(
        self,
        instances: Sequence[DirectInstance],
        criteria: Sequence[CriteriaWithOptions],
    ) -> Sequence[DirectInstanceResult]:
        class JudgeOutput(BaseModel):
            assessment: str = Field(..., description="Step by step assessment")
            selected_option: str = Field(
                ...,
                description=f"The chosen option. Any of {', '.join([o.name for o in criteria[0].options])}",
            )

        output_parser: OutputFixingParser[JudgeOutput] = (
            self.get_pydantic_output_fixing_parser(JudgeOutput)
        )
        format_instructions: str = output_parser.get_format_instructions()

        prompt_template = PromptTemplate(
            input_variables=[
                "text_to_evaluate",
                "context_section",
                "criteria_name",
                "criteria_description",
                "criteria_options",
            ],
            partial_variables={
                "format_instructions": format_instructions,
                "prompt": self.prompt,
            },
            template=dedent(
                """\
{prompt}

You will be given:
- **Criterion** (name, description, options)
- **Optional context**
- **A text** to evaluate

### Criterion:
Name: {criteria_name}
Description: {criteria_description}
Options:
{criteria_options}

### Context
{context_section}

### Text to evaluate
{text_to_evaluate}

### Output format
{format_instructions}
""",
            ),
        )

        prompts = []
        for instance in instances:
            context_section: str = "\n".join(
                f"{k}: {v}" for k, v in instance.context_variables.items()
            )
            criteria_options: str = "- " + "\n- ".join(
                [
                    f"{option.name}: {option.description}"
                    for option in criteria[0].options
                ]
            )
            prompt = prompt_template.format(
                text_to_evaluate=instance.response,
                context_section=context_section,
                criteria_name=criteria[0].name,
                criteria_description=criteria[0].description,
                criteria_options=criteria_options,
            )
            prompts.append(prompt)

        responses: list[str] = cast(
            list[str],
            self.inference_engine.infer(
                dataset=[
                    {"source": prompt, "data_classification_policy": ["public"]}
                    for prompt in prompts
                ]
            ),
        )
        judge_outputs: list[JudgeOutput] = [
            output_parser.parse(completion=response) for response in responses
        ]

        return [
            DirectInstanceResult(
                option=judge_output.selected_option,
                explanation=judge_output.assessment,
                positional_bias=DirectPositionalBias(
                    detected=False,
                ),
                metadata={
                    "prompt": prompt,
                },
            )
            for judge_output, prompt in zip(judge_outputs, prompts)
        ]
