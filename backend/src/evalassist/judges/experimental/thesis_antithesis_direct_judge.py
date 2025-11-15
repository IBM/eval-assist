from textwrap import dedent
from typing import cast

from evalassist.judges.batch_repair_parser import BatchRepairParser
from evalassist.judges.utils import (
    build_format_instructions,
    generate_dynamic_pydantic_model,
    get_context_dict,
    get_to_evaluate_text,
)
from pydantic import Field
from pydantic.main import BaseModel

from ..base import BaseDirectJudge, UnitxtInferenceEngineMixin
from ..types import Criteria, DirectInstanceResult, Instance


class ThesisAntithesisDirectJudge(BaseDirectJudge, UnitxtInferenceEngineMixin):
    def get_name(self) -> str:
        return "thesis_untithesis"

    def _run(
        self,
        instances: list[Instance],
        criteria: list[Criteria],
    ) -> list[DirectInstanceResult]:
        parser = BatchRepairParser(
            inference_engine=self.inference_engine,
            max_retries=3,
            on_generation_failure="raise",
        )

        # First stage
        first_stage_models: list[type[BaseModel]] = [
            generate_dynamic_pydantic_model(
                model_name="first_stage_model",
                field_definitions=[
                    (
                        f"Arguments for {option.name}",
                        str,
                        Field(
                            ...,
                            description=f"The argument for evaluating the text as {option.name}",
                        ),
                        [],
                    )
                    for option in criterion.options
                ],
            )
            for criterion in criteria
        ]

        first_stage_format_instructions_list = [
            build_format_instructions(klass) for klass in first_stage_models
        ]

        criteria_options_list = [
            "\n".join(
                [f"{option.name}: {option.description}" for option in criterion.options]
            )
            for criterion in criteria
        ]

        predictions: list[str] = [
            cast(str, get_to_evaluate_text(instance, criterion))
            for instance, criterion in zip(instances, criteria)
        ]
        context_variables_list: list[dict[str, str]] = [
            get_context_dict(instance, criterion)
            for instance, criterion in zip(instances, criteria)
        ]
        str_context_variables_list = [
            "\n".join(f"{k}: {v}" for k, v in c.items()) for c in context_variables_list
        ]
        first_stage_prompt_template = dedent(
            """\
            You are an impartial evaluator. Your task is to assess the given text based on a single criterion, which includes:
            - **Name**: {criteria_name}
            - **Description**: {criteria_description}
            - **Options**:
            {criteria_options}

            You may also receive **optional context**:
            {context}

            **Text to evaluate**:
            {text_to_evaluate}

            ### First Evaluation Stage:
            For each option of the criterion, provide a detailed argument explaining why the text *would* fit that option. If there is no supporting evidence, respond with "No arguments.". If in doubt, provide the arguments anyway. You must output only valid JSON with no extra text.
            Use the following schema and formatting rules:

            ### Output format
            {format_instructions}
        """
        )

        first_stage_prompts = [
            first_stage_prompt_template.format(
                text_to_evaluate=prediction,
                context=context,
                format_instructions=first_stage_format_instructions,
                criteria_options=criteria_options,
                criteria_name=criterion.name,
                criteria_description=criterion.description,
            )
            for prediction, context, criterion, first_stage_format_instructions, criteria_options in zip(
                predictions,
                str_context_variables_list,
                criteria,
                first_stage_format_instructions_list,
                criteria_options_list,
            )
        ]

        first_stage_messages = [
            [self.get_ai_message_from_prompt(p)] for p in first_stage_prompts
        ]

        first_stage_unparsed_responses = cast(
            list[str],
            self.inference_engine.infer(
                [
                    {"source": prompt, "data_classification_policy": ["public"]}
                    for prompt in first_stage_prompts
                ]
            ),
        )

        first_stage_parsed_responses, _ = parser.parse_and_repair(
            unparsed_responses=first_stage_unparsed_responses,
            model_classes=first_stage_models,
        )

        # Second stage
        second_stage_model = generate_dynamic_pydantic_model(
            model_name="second_stage_model",
            field_definitions=[
                (
                    "selected_option",
                    str,
                    Field(
                        ...,
                        description="Main selected criterion option",
                    ),
                    [],
                ),
                (
                    "alternative_selected_option",
                    str,
                    Field(
                        ...,
                        description="Optinal alternative selected criterion option",
                    ),
                    [],
                ),
            ],
        )

        second_stage_format_instructions = build_format_instructions(second_stage_model)

        second_stage_prompt_template = dedent(
            """\
            ### Stage 2: Option Selection

            Your task:
            - Select the single criterion option that best matches the text.
            - Optionally, choose an **alternative** option if you’re not completely certain.
            - If fully confident in your first choice, leave the alternative as an empty string.

            Available options:
            {criteria_option_names}

            ### Output format
            {format_instructions}
        """
        )

        second_stage_prompts = [
            second_stage_prompt_template.format(
                criteria_option_names=", ".join(
                    [option.name for option in criterion.options]
                ),
                format_instructions=second_stage_format_instructions,
            )
            for criterion in criteria
        ]

        second_stage_messages_list = [
            [
                *first_stage_message,
                self.get_ai_message_from_prompt(
                    first_stage_parsed_response, "assistant"
                ),
                self.get_ai_message_from_prompt(second_stage_prompt),
            ]
            for first_stage_message, first_stage_parsed_response, second_stage_prompt in zip(
                first_stage_messages,
                first_stage_unparsed_responses,
                second_stage_prompts,
            )
        ]

        second_stage_unparsed_responses = cast(
            list[str],
            self.inference_engine.infer(
                [
                    {
                        "source": second_stage_messages,
                        "data_classification_policy": ["public"],
                    }
                    for second_stage_messages in second_stage_messages_list
                ]
            ),
        )
        second_stage_output_parsed_responses, _ = parser.parse_and_repair(
            second_stage_unparsed_responses,
            [second_stage_model] * len(second_stage_unparsed_responses),
        )

        # Third stage (if required)
        second_stage_selected_option_list = [
            second_stage_output_parsed_response.model_dump()["selected_option"]
            for second_stage_output_parsed_response in second_stage_output_parsed_responses
        ]

        is_unsure_list = [
            second_stage_output_parsed_response.model_dump()[
                "alternative_selected_option"
            ]
            != ""
            for second_stage_output_parsed_response in second_stage_output_parsed_responses
        ]
        unsure_indexes: list[int] = []
        for i, (is_unsure, selected_option) in enumerate(
            zip(is_unsure_list, second_stage_selected_option_list)
        ):
            if is_unsure:
                unsure_indexes.append(i)

        third_stage_messages_list: list[list[dict[str, str]]] = []
        third_stage_format_instructions_list = []
        third_stage_models = []
        option_one_list = []
        option_two_list = []
        for unsure_index in unsure_indexes:
            option_one = second_stage_output_parsed_responses[
                unsure_index
            ].model_dump()["selected_option"]
            option_one_list.append(option_one)
            option_two = second_stage_output_parsed_responses[
                unsure_index
            ].model_dump()["alternative_selected_option"]
            option_two_list.append(option_two)

            third_stage_model = generate_dynamic_pydantic_model(
                model_name="third_stage_model",
                field_definitions=[
                    (
                        option_one,
                        str,
                        Field(
                            ...,
                            description=f"The argument for not evaluating the text as {option_one}",
                        ),
                        [],
                    ),
                    (
                        option_two,
                        str,
                        Field(
                            ...,
                            description=f"The argument for not evaluating the text as {option_two}",
                        ),
                        [],
                    ),
                ],
            )

            third_stage_models.append(third_stage_model)

            format_instructions = build_format_instructions(third_stage_model)
            third_stage_format_instructions_list.append(format_instructions)

            third_stage_prompt_template = dedent(
                """\
                ### Stage 3: Examining Alternatives

                You previously narrowed your choice to two options: **Option {option_one}** and **Option {option_two}**.

                Your task now is to critically assess **why the text should *not*** be assigned to each of these options.

                - Provide a brief rationale for why the text fails to match **Option {option_one}**.
                - Provide a brief rationale for why the text fails to match **Option {option_two}**.

                ### Output format
                {format_instructions}
            """,
            )

            third_stage_prompt = third_stage_prompt_template.format(
                option_one=option_one,
                option_two=option_two,
                format_instructions=format_instructions,
            )

            third_stage_messages = [
                *second_stage_messages_list[unsure_index],
                self.get_ai_message_from_prompt(
                    second_stage_unparsed_responses[unsure_index], "assistant"
                ),
                self.get_ai_message_from_prompt(third_stage_prompt),
            ]
            third_stage_messages_list.append(third_stage_messages)

        third_stage_unparsed_responses = cast(
            list[str],
            self.inference_engine.infer(
                [
                    {
                        "source": third_stage_messages,
                        "data_classification_policy": ["public"],
                    }
                    for third_stage_messages in third_stage_messages_list
                ]
            ),
        )

        # Fourth stage (if required)
        fourth_stage_messages_list = []
        fourth_stage_output_models = []
        for (
            option_one,
            option_two,
            third_stage_messages,
            third_stage_unparsed_response,
            unsure_index,
        ) in zip(
            option_one_list,
            option_two_list,
            third_stage_messages_list,
            third_stage_unparsed_responses,
            unsure_indexes,
        ):
            fourth_stage_output_model = generate_dynamic_pydantic_model(
                model_name="fourth_stage_model",
                field_definitions=[
                    (
                        "explanation",
                        str,
                        Field(
                            ...,
                            description="An explanation that clearly states why you selected that option",
                        ),
                        [],
                    ),
                    (
                        "selected_option",
                        str,
                        Field(
                            ...,
                            description=f"the selected option (either '{option_one}' or '{option_two}')",
                        ),
                        [],
                    ),
                ],
            )
            fourth_stage_output_models.append(fourth_stage_output_model)
            fourth_stage_format_instructions = build_format_instructions(
                fourth_stage_output_model
            )

            fourth_stage_prompt_template = dedent(
                """\
                ### Stage 4: Final Decision

                You have narrowed down your choices to two possible options:
                - **Option {option_one}**: {option_one_description}
                - **Option {option_two}**: {option_two_description}

                **Task**:
                1. Review the arguments *for* and *against* each option.
                2. Provide an explanation that describes, step by step, why you chose that option.
                3. Choose the one you believe fits best.

                **Context**:
                {context}

                **Text to evaluate**:
                {text_to_evaluate}

                ### Output format
                {format_instructions}
            """,
            )

            fourth_stage_prompt = fourth_stage_prompt_template.format(
                text_to_evaluate=predictions[unsure_index],
                context=str_context_variables_list[unsure_index],
                option_one_description=next(
                    iter(
                        o.description
                        for o in criteria[unsure_index].options
                        if o.name == option_one
                    )
                ),
                option_two_description=next(
                    iter(
                        o.description
                        for o in criteria[unsure_index].options
                        if o.name == option_two
                    )
                ),
                format_instructions=fourth_stage_format_instructions,
                option_one=option_one,
                option_two=option_two,
            )

            fourth_stage_messages: list[dict[str, str]] = [
                *third_stage_messages,
                self.get_ai_message_from_prompt(
                    third_stage_unparsed_response, "assistant"
                ),
                self.get_ai_message_from_prompt(fourth_stage_prompt),
            ]
            fourth_stage_messages_list.append(fourth_stage_messages)

        fourth_stage_unparsed_responses = cast(
            list[str],
            self.inference_engine.infer(
                [
                    {
                        "source": fourth_stage_messages,
                        "data_classification_policy": ["public"],
                    }
                    for fourth_stage_messages in fourth_stage_messages_list
                ]
            ),
        )

        fourth_stage_output_parsed_responses, _ = parser.parse_and_repair(
            unparsed_responses=fourth_stage_unparsed_responses,
            model_classes=fourth_stage_output_models,
        )

        fourth_stage_selected_option_list = [
            fourth_stage_output_parsed_response.model_dump()["selected_option"]
            for fourth_stage_output_parsed_response in fourth_stage_output_parsed_responses
        ]

        i = 0
        j = 0
        selected_options: list[str] = []
        explanations = []
        amount_of_stages = []
        full_messages_list = []

        for is_unsure in is_unsure_list:
            if is_unsure:
                selected_options.append(fourth_stage_selected_option_list[i])
                explanations.append(
                    fourth_stage_output_parsed_responses[i].model_dump()["explanation"]
                )
                full_messages_list.append(
                    fourth_stage_messages_list[i]
                    + [
                        self.get_ai_message_from_prompt(
                            fourth_stage_unparsed_responses[i], "assistant"
                        )
                    ]
                )
                amount_of_stages.append(4)
                i += 1
            else:
                selected_options.append(second_stage_selected_option_list[j])
                explanations.append(
                    first_stage_parsed_responses[j].model_dump()[
                        f"Arguments for {second_stage_selected_option_list[j]}"
                    ]
                )
                full_messages_list.append(
                    second_stage_messages_list[j]
                    + [
                        self.get_ai_message_from_prompt(
                            second_stage_unparsed_responses[j], "assistant"
                        )
                    ]
                )
                amount_of_stages.append(2)
            j += 1
        return [
            DirectInstanceResult(
                criteria=criterion,
                selected_option=selected_option,
                explanation=explanation,
                metadata={"Number of stages": str(stages_count)},
            )
            for selected_option, explanation, stages_count, criterion in zip(
                selected_options, explanations, amount_of_stages, criteria
            )
        ]
