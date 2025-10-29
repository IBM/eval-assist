import logging
from collections.abc import Callable
from textwrap import dedent
from typing import Any, Literal, cast

from evalassist.judges.batch_repair_parser import BatchRepairParser
from evalassist.judges.utils import (
    build_format_instructions,
    generate_dynamic_pydantic_model,
    get_context_dict,
    get_to_evaluate_text,
    is_float,
)
from langchain_core.prompts.prompt import PromptTemplate
from pydantic import BaseModel, Field
from unitxt.inference import InferenceEngine

from .base import BaseDirectJudge, JudgeDescriptor, UnitxtInferenceEngineMixin
from .types import Criteria, DirectInstanceResult, Instance

logger = logging.getLogger(__name__)


class DirectJudge(BaseDirectJudge, UnitxtInferenceEngineMixin):
    generate_synthetic_persona: bool
    generate_feedback: bool
    judge_description_prompt: str | None
    on_generation_failure: Literal["raise", "random"]

    def __init__(
        self,
        inference_engine: InferenceEngine,
        generate_synthetic_persona: bool = False,
        judge_description_prompt: str | None = None,
        generate_feedback: bool = False,
        self_consistency: bool | int = False,
        on_generation_failure: Literal["raise", "random"] = "random",
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

    def get_name(self) -> str:
        return f"in_house{'_with_synthetic_persona' if self.generate_synthetic_persona else ''}{'_with_feedback' if self.generate_feedback else ''}{f'_with_self_consistency_{self.self_consistency}_attempts' if self.self_consistency else ''}"

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
        format_instructions_list = []
        for criterion in unique_criteria:
            dynamic_model = generate_dynamic_pydantic_model(
                model_name="structured_output_model",
                field_definitions=[
                    (
                        "persona_name",
                        str,
                        Field(
                            ...,
                            description=f"The name of the persona responsible for evaluating the {criterion.to_evaluate_field} according to the criterion {criterion.name}.",
                        ),
                        [],
                    ),
                    (
                        "persona_description",
                        str,
                        Field(
                            ...,
                            description="The description of why the <persona_name> is ideal to perform the evaluation. Don't include the the initial 'you'. For example: 'an expert on evaluating text based on a rubric' or 'a customer support specialist experienced in clarity and tone explanation'.",
                        ),
                        [],
                    ),
                ],
            )
            synthetic_persona_klasses.append(dynamic_model)
            format_instructions_list.append(build_format_instructions(dynamic_model))

        template = dedent(
            text="""\
                Your task is to generate a persona that is the most appropriate to evaluate a text based on the following criteria.
                You will be provided with the criteria name, description and options and an example instance.

                ### Criterion:

                {criteria_name_section}
                Description: {criteria_description}
                Options:
                {criteria_options}

                For the persona, you will generate the name or role (e.g. a doctor, a philosopher, a lawyer) and a brief description that makes emphasis on what makes the persona the ideal for performing the evaluation (e.g. have a lot of experience reading and writing email summaries).

                ### Output format

                The persona info will be used as this:
                "You are <persona_name>. Your task is to evaluate a {to_evaluate_field}. You <persona_description>".

                {format_instruction}
            """
        )

        messages_list: list[list[dict[str, str]]] = [
            [
                {
                    "role": "user",
                    "content": template.format(
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
                        to_evaluate_field=criterion.to_evaluate_field
                        if criterion.to_evaluate_field
                        else "text",
                        instance_example=instance_example_str,
                        format_instruction=format_instruction,
                    ),
                }
            ]
            for criterion, instance_example_str, format_instruction in zip(
                criteria, instance_examples_str, format_instructions_list
            )
        ]

        unparsed_responses: list[str] = cast(
            list[str],
            self.inference_engine.infer(
                dataset=[
                    {"source": messages, "data_classification_policy": ["public"]}
                    for messages in messages_list
                ]
            ),
        )

        parser = BatchRepairParser(
            inference_engine=self.inference_engine,
            max_retries=3,
            on_generation_failure=self.on_generation_failure,
        )

        parsed_responses, _ = parser.parse_and_repair(
            unparsed_responses=unparsed_responses,
            on_failure_default={"persona_name": "", "persona_description": ""},
            model_classes=synthetic_persona_klasses,
            previous_messages_list=messages_list,
        )

        personas = [
            (persona.persona_name, persona.persona_description)  # type: ignore
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
                        description=f"Actionable suggestions that would help improve the evaluated {criterion.to_evaluate_field if criterion.to_evaluate_field is not None else 'response'} based on the explanation",
                    ),
                    [],
                )
            )
            model = generate_dynamic_pydantic_model(
                f"{model_name}WithFeedback", field_defs
            )
        return model

    def get_in_context_example_as_str(self, criterion: Criteria):
        if not criterion.examples:
            return ""

        title = "\n\n## Examples\n\nTake into account the following examples when performing the evaluation.\n\n"
        examples_str = []
        for i, example in enumerate(criterion.examples):
            context: dict[str, str] = get_context_dict(
                cast(Instance, example.instance), criterion
            )
            context_str: str = (
                "\n\n".join(f"- {k}: {v}" for k, v in context.items())
                if len(context)
                else ""
            )
            context_section_str: str = (
                ("\n#### Context\n\n" + context_str) if context_str else ""
            )

            prediction_section = f"#### The {criterion.to_evaluate_field if criterion.to_evaluate_field else 'text'} to evaluate\n{get_to_evaluate_text(cast(Instance, example.instance), criterion)}"

            explanation_section = (
                f"#### Explanation: {example.explanation}\n\n"
                if example.explanation
                else ""
            )

            ground_truth_section = f"#### Selected option: {example.selected_option}"

            example_str = f"### Example {i + 1}:\n{context_section_str}\n\n{prediction_section}\n\n{explanation_section}{ground_truth_section}\n"
            examples_str.append(example_str)
        res = title + "\n\n".join(examples_str) + "\n[End of examples]"
        return res

    def _run(
        self,
        instances: list[Instance],
        criteria: list[Criteria],
    ) -> list[DirectInstanceResult]:
        format_instructions_list = []
        criteria_options_list = []
        criteria_option_names_list = []
        model_classes = []
        feedback_step_sections = []
        to_evaluate_fields = []
        for criterion in criteria:
            klass = self.generate_pydantic_model(
                model_name=f"{criterion.name}_model",
                criterion=criterion,
                include_feedback=self.generate_feedback,
            )
            model_classes.append(klass)

            criteria_options: str = "\n".join(
                [
                    f"- {option.name}{f': {option.description}' if option.description else ''}"
                    for option in criterion.options
                ]
            )
            criteria_option_names_list.append(
                ", ".join([f'"{option.name}"' for option in criterion.options])
            )

            criteria_options_list.append(criteria_options)

            to_evaluate_field = (
                criterion.to_evaluate_field
                if criterion.to_evaluate_field is not None
                else "response"
            )
            to_evaluate_fields.append(to_evaluate_field)

            feedback_step_section = (
                f'7. At the end, provide "feedback" consisting of actionable suggestions that would help improve the evaluated {to_evaluate_field}. Unlike the explanation, which explains the reasoning behind the judgment, the feedback should focus on guiding refinement. For example, in creative writing, it could suggest improving clarity, coherence, or narrative flow. In analytical tasks, it could recommend strengthening evidence, refining arguments, or correcting inaccuracies. Keep feedback concise and specific enough to support iterative improvement. If you consider that the {to_evaluate_field} is optimal, leave the "feedback" field empty ("")'
                if self.generate_feedback
                else ""
            )
            feedback_step_sections.append(feedback_step_section)
            format_instructions_list.append(build_format_instructions(klass))

        predictions: list[str] = [
            cast(str, get_to_evaluate_text(instance, criterion))
            for instance, criterion in zip(instances, criteria)
        ]
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
        judge_description_sections = []
        if self.judge_description_prompt:
            judge_description_sections = [self.judge_description_prompt] * len(criteria)
        elif self.generate_synthetic_persona:
            personas = self.generate_personas(
                context_sections=context_sections,
                predictions=predictions,
                criteria=criteria,
            )
            judge_description_sections = [
                f"You are {persona_name}. You are {persona_description}"
                for persona_name, persona_description in personas
            ]
        else:
            judge_description_sections = [
                "You are an expert evaluator. Your task is to objectively and concisely assess a text against a given criterion and optional context. Focus on the substance of the text, follow the instructions carefully, and produce output strictly in the required JSON format. Do not include any explanations, commentary, or text outside the JSON object."
            ] * len(criteria)

        system_template = dedent(
            """\
            {judge_description_section}

            You must output only valid JSON with no extra text.
            Use the following schema and formatting rules:
            {format_instructions}
            """
        )

        user_template = dedent(
            """\
                You will be given:
                - **Criterion** (name, description, options)
                - **Optional context**
                - **The {to_evaluate_field}** to evaluate

                ## Required evaluation behavior (follow these precisely):

                1. Read the *criterion* and the *context* carefully.

                2. Compare the {to_evaluate_field} to the criterion and the context.

                3. Decide which criterion option best fits the {to_evaluate_field}.

                • If more than one option seems plausible:
                    - Choose the one that best satisfies the criterion based on the strongest evidence, not speculation.
                    - If still unclear, select the option that is closest but explain the ambiguity in "explanation".

                4. Write your reasoning in the "explanation", using clear markdown bullet points that describe why one option fits best. When possible, cite specific excerpts or features from the {to_evaluate_field} that support your choice.

                5. Set `"selected_option"` to exactly one of the following values: {criteria_option_names}.

                6. Before submitting your final answer, verify that:
                - The output is valid JSON
                - All keys are quoted
                - There are no trailing commas
                - `"selected_option"` matches exactly one allowed value
                {feedback_step_section}

                ## Criteria:{criteria_name_section}
                Description: {criteria_description}
                Options:
                {criteria_options}{examples_section}{context_section}

                ## The {to_evaluate_field} to evaluate

                {text_to_evaluate}
                """
        )

        messages_list: list[list[dict[str, str]]] = [
            [
                {
                    "role": "system",
                    "content": system_template.format(
                        judge_description_section=judge_description_section,
                        format_instructions=format_instructions,
                    ),
                },
                {
                    "role": "user",
                    "content": user_template.format(
                        text_to_evaluate=prediction,
                        context_section=context_section,
                        examples_section=self.get_in_context_example_as_str(criterion),
                        criteria_name_section=(
                            f"\n\nCriteria name: {criterion.name}"
                            if criterion.name
                            else "\n"
                        ),
                        criteria_description=criterion.description,
                        criteria_options=criterion_options,
                        to_evaluate_field=to_evaluate_field,
                        feedback_step_section=feedback_step_section,
                        criteria_option_names=criteria_option_names,
                    ),
                },
            ]
            for prediction, context_section, criterion, criterion_options, format_instructions, to_evaluate_field, feedback_step_section, judge_description_section, criteria_option_names in zip(
                predictions,
                context_sections,
                criteria,
                criteria_options_list,
                format_instructions_list,
                to_evaluate_fields,
                feedback_step_sections,
                judge_description_sections,
                criteria_option_names_list,
            )
        ]

        dataset = [
            {
                "source": messages,
                "data_classification_policy": ["public"],
            }
            for messages in messages_list
        ]

        unparsed_responses: list[str] = cast(
            list[str],
            self.inference_engine(dataset=dataset),
        )

        parser = BatchRepairParser(
            inference_engine=self.inference_engine,
            max_retries=3,
            on_generation_failure=self.on_generation_failure,
        )

        parsed_responses, parsing_metadatas = parser.parse_and_repair(
            unparsed_responses=unparsed_responses,
            on_failure_default=[
                {"selected_option": [option.name for option in criterion.options]}
                for criterion in criteria
            ],
            model_classes=model_classes,
            previous_messages_list=messages_list,
        )
        explanations: list[str] = [r.explanation for r in parsed_responses]  # type: ignore
        selected_options: list[str] = [r.selected_option for r in parsed_responses]  # type: ignore
        feedbacks: list[str | None] = [
            None if not self.generate_feedback else r.feedback  # type: ignore
            for r in parsed_responses  # type: ignore
        ]
        results: list[DirectInstanceResult] = [
            DirectInstanceResult(
                instance=instance,
                criteria=criterion,
                selected_option=selected_option,
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
                messages_list,
                unparsed_responses,
                criteria,
                parsing_metadatas,
                instances,
            )
        ]
        if self.generate_synthetic_persona:
            for result, judge_description_section in zip(
                results, judge_description_sections
            ):
                result.metadata["persona"] = judge_description_section
        return results

    def evaluate_with_custom_prompt(
        self,
        judge_prompts: list[str],
        valid_outputs: list[str] | tuple[int, int] | None = None,
    ) -> list[DirectInstanceResult]:
        field_defs: list[tuple[str, type, Any, list[Callable[..., Any]]]] = [
            (
                "explanation",
                str,
                Field(..., description="Step by step explanation of the evaluation"),
                [],
            ),
        ]
        selected_field: Literal["selected_option", "selected_score"]

        if valid_outputs is not None:
            if isinstance(valid_outputs, list):

                def validate_selected_option(cls, value: str) -> str:
                    if value not in valid_outputs:
                        raise ValueError(f"value must be one of {valid_outputs}")
                    return value

                selected_field = "selected_option"
                field_defs.append(
                    (
                        selected_field,
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

                selected_field = "selected_score"
                field_defs.append(
                    (
                        selected_field,
                        int,
                        Field(
                            ...,
                            description=f"The chosen score. A number between {valid_outputs[0]} and {valid_outputs[1]}",
                        ),
                        [validate_selected_score],
                    )
                )
        else:
            selected_field = "selected_score"
            field_defs.append(
                (
                    selected_field,
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

        prompt_template = PromptTemplate(
            input_variables=["judge_prompt"],
            partial_variables={
                "format_instructions": build_format_instructions(dynamic_model),
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
            self.inference_engine(
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
        parser = BatchRepairParser(
            inference_engine=self.inference_engine,
            max_retries=3,
            on_generation_failure=self.on_generation_failure,
        )

        parsed_responses, parsing_metadatas = parser.parse_and_repair(
            unparsed_responses=unparsed_responses,
            on_failure_default={selected_field: on_failure_default_options},
            model_classes=[dynamic_model] * len(unparsed_responses),
        )

        explanations: list[str] = [r.explanation for r in parsed_responses]  # type: ignore
        selected_options: list[str] = [
            getattr(r, "selected_option", str(getattr(r, "selected_score", None)))
            for r in parsed_responses
        ]

        return [
            DirectInstanceResult(
                selected_option=selected_option,
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
