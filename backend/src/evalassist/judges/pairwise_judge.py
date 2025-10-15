import logging
from textwrap import dedent
from typing import Literal, cast

from evalassist.judges.batch_parser import BatchRepairParser
from evalassist.judges.utils import generate_dynamic_pydantic_model, get_context_dict
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts.prompt import PromptTemplate
from pydantic import BaseModel, Field
from unitxt.inference import InferenceEngine

from .base import BasePairwiseJudge, JudgeDescriptor, UnitxtInferenceEngineMixin
from .types import Criteria, PairwiseInstance, PairwiseInstanceResult

logger = logging.getLogger(__name__)


class PairwiseJudge(BasePairwiseJudge, UnitxtInferenceEngineMixin):
    on_generation_failure: Literal["raise", "random"]
    tie_enabled: bool

    def __init__(
        self,
        inference_engine: InferenceEngine,
        self_consistency: bool | int = False,
        on_generation_failure: Literal["raise", "random"] = "random",
        tie_enabled: bool = True,
        *args,
        **kwargs,
    ):
        super().__init__(
            inference_engine=inference_engine,
            self_consistency=self_consistency,
            *args,
            **kwargs,
        )

        if on_generation_failure not in ["raise", "random"]:
            raise ValueError(
                "on_generation_failure must be either 'raise' or 'random'. Received {on_generation_failure} instead."
            )
        self.on_generation_failure = on_generation_failure
        self.tie_enabled = tie_enabled

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

    def get_name(self) -> str:
        return f"simple{f'_with_self_consistency_{self.self_consistency}_attempts' if self.self_consistency else ''}"

    def get_descriptor(self) -> JudgeDescriptor:
        judge_descriptor = JudgeDescriptor(self.get_name(), "pairwise", "")
        judge_descriptor.inference_engine_id = self.get_inference_engine_id()
        return judge_descriptor

    def generate_pydantic_model(
        self,
        model_name: str,
        valid_options: list[str],
    ) -> type[BaseModel]:
        def validate_selected_option(cls, value: str) -> str:
            if value not in valid_options:
                raise ValueError(f"value must be one of {valid_options}")
            return value

        field_defs = [
            (
                "explanation",
                str,
                Field(..., description="Step by step explanation of the evaluation"),
                [],
            ),
            (
                "selected_option",
                str,
                Field(
                    ...,
                    description=f"The chosen option. Any of {', '.join(valid_options)}",
                ),
                [validate_selected_option],
            ),
        ]
        model: type[BaseModel] = generate_dynamic_pydantic_model(model_name, field_defs)
        return model

    def _run(
        self,
        instances: list[PairwiseInstance],
        criteria: list[Criteria],
    ) -> list[PairwiseInstanceResult]:
        # for instance in instances:
        #     if len(instance.responses) != 2:
        #         raise ValueError(
        #             f"The number of texts to compare must be equal to 2 for all the instances. Received {len(instance.responses)} texts."
        #         )

        output_parsers: list[PydanticOutputParser] = []
        format_instructions_list = []
        classes = []
        prediction_fields = []
        valid_options_list = []
        for instance, criterion in zip(instances, criteria):
            prediction_field = (
                criterion.prediction_field
                if criterion.prediction_field is not None
                else "response"
            ).lower()
            prediction_fields.append(prediction_field)
            valid_options = [
                *[
                    f"{prediction_field}_{i + 1}"
                    for i in range(len(instance.responses))
                ],
                "tie",
            ]
            valid_options_list.append(valid_options)
            klass = self.generate_pydantic_model(
                model_name=f"{criterion.name}_model",
                valid_options=valid_options,
            )
            classes.append(klass)

            output_parser = PydanticOutputParser(pydantic_object=klass)
            output_parsers.append(output_parser)

            format_instructions: str = output_parser.get_format_instructions()
            format_instructions_list.append(format_instructions)

        context_variables_list: list[dict[str, str]] = [
            get_context_dict(instance, criterion)
            for instance, criterion in zip(instances, criteria)
        ]
        str_context_variables_list: list[str | None] = [
            "\n\n".join(f"- {k}: {v}" for k, v in c.items()) if len(c) else None
            for c in context_variables_list
        ]

        context_sections: list[str] = [
            ("\n\n## Context\n\n" + c + "\n") if c is not None else ""
            for c in str_context_variables_list
        ]
        judge_description_sections = [
            f"You are a an evaluator. You are an expert on comparing {prediction_field} texts based on a criterion."
            for prediction_field in prediction_fields
        ]

        tie_sections = [
            f'\n\n## Tie option\n\nIf two or more of the {prediction_field} texts are equally good based on the criteria, set the `"selected_option"` field as `"tie"`.\n\n'
            if self.tie_enabled
            else ""
            for prediction_field in prediction_fields
        ]

        responses_sections = [
            "\n".join(
                [
                    f"{prediction_field}_{i + 1}: {response}"
                    for i, response in enumerate(instance.responses)
                ]
            )
            for instance, prediction_field in zip(instances, prediction_fields)
        ]

        prompt_template = PromptTemplate(
            input_variables=[
                "context_section",
                # "examples_section",
                "criteria_name_section",
                "criteria_description",
                "format_instructions",
                "prediction_field",
                "judge_description_section",
                "tie_section",
                "responses_section",
            ],
            template=dedent(
                text="""\
                {judge_description_section}

                You will be given:
                - **Criterion** (name and description)
                - **Optional context**
                - The **{prediction_field}** texts to evaluate


                ## Required evaluation behavior (follow these precisely):

                1. Read the *criterion* and the *context* carefully.
                2. Compare each candidate {prediction_field} against the criterion and the reference context.
                3. Decide which candidate best satisfies the criterion (or decide tie if two or more candidates are equally good).
                4. Write your reasoning in the `"explanation"`, using clear markdown bullet points that describe why one response is better. Keep it concise and factual.
                5. Set `"selected_option"` to exactly one of the following values: {valid_options}.


                ## Criteria: {criteria_name_section}

                {criteria_description}
                {context_section}
                ## The {prediction_field} texts to evaluate
                {responses_section}
                {tie_section}
                ## Output format

                {format_instructions}
                Output must be valid JSON only — no extra text.
            """,
            ),
        )

        prompts: list[str] = [
            prompt_template.format(
                context_section=context_section,
                # examples_section=self.get_in_context_example_as_str(criterion),
                criteria_name_section=criterion.name if criterion.name else "\n",
                criteria_description=criterion.description,
                format_instructions=format_instructions,
                prediction_field=prediction_field,
                judge_description_section=judge_description_section,
                tie_section=tie_section,
                responses_section=responses_section,
                valid_options=", ".join([f'"{v}"' for v in valid_options]),
            )
            for context_section, criterion, format_instructions, prediction_field, judge_description_section, tie_section, responses_section, valid_options in zip(
                context_sections,
                criteria,
                format_instructions_list,
                prediction_fields,
                judge_description_sections,
                tie_sections,
                responses_sections,
                valid_options_list,
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

        parser = BatchRepairParser(
            inference_engine=self.inference_engine,
            max_retries=3,
            on_generation_failure=self.on_generation_failure,
        )

        parsed_responses, parsing_metadatas = parser.parse_all_responses(
            unparsed_responses=unparsed_responses,
            on_failure_default=valid_options_list,
            output_parsers=output_parsers,
        )

        explanations: list[str] = [r.explanation for r in parsed_responses]
        selected_options: list[str] = [r.selected_option for r in parsed_responses]
        parsed_selected_options = []
        for selected_option in selected_options:
            if selected_option == "tie":
                parsed_selected_options.append("tie")
            else:
                parsed_selected_options.append(int(selected_option.split("_")[1]) - 1)
        return [
            PairwiseInstanceResult(
                instance=instance,
                criteria=criterion,
                selected_option=selected_option,
                explanation=explanation,
                metadata={
                    **parsing_metadata,
                    "prompt": prompt,
                    "unparsed_response": unparsed_response,
                },
            )
            for selected_option, explanation, prompt, unparsed_response, criterion, parsing_metadata, instance in zip(
                parsed_selected_options,
                explanations,
                prompts,
                unparsed_responses,
                criteria,
                parsing_metadatas,
                instances,
            )
        ]
