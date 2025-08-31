from collections.abc import Sequence
from textwrap import dedent
from typing import Any, cast

from langchain.output_parsers import OutputFixingParser, ResponseSchema
from langchain.prompts import PromptTemplate

from .base import DirectJudge, UnitxtInferenceLangchainRunnable
from .types import Criteria, DirectInstance, DirectInstanceResult


class ThesisAntithesisDirectJudge(DirectJudge, UnitxtInferenceLangchainRunnable):
    def get_name(self) -> str:
        return "thesis_untithesis"

    def _run(
        self,
        instances: Sequence[DirectInstance],
        criteria: Sequence[Criteria],
    ) -> list[DirectInstanceResult]:
        # # make it easier for models to create json object
        # for option in cast(CriteriaWithOptions, self.criteria).options:
        #     if len(option.name) == 1:
        #         adapted_option_name = f"option_{option.name}"
        #         if cast(CriteriaWithOptions, self.criteria).option_map is not None:
        #             cast(CriteriaWithOptions, self.criteria).option_map[adapted_option_name] = (
        #                 cast(CriteriaWithOptions, self.criteria).option_map[option.name]
        #             )
        #             del cast(CriteriaWithOptions, self.criteria).option_map[option.name]
        #         option.name = adapted_option_name

        # First stage

        first_stage_response_schemas_list: list[list[ResponseSchema]] = [
            [
                ResponseSchema(
                    name=f"Arguments for {option.name}",
                    description=f"The argument for evaluating the text as {option.name}",
                )
                for option in criterion.options
            ]
            for criterion in criteria
        ]

        first_stage_output_parser_list = [
            self.get_structured_output_fixing_parser(first_stage_response_schemas)
            for first_stage_response_schemas in first_stage_response_schemas_list
        ]

        first_stage_format_instructions_list = [
            first_stage_output_parser.get_format_instructions()
            for first_stage_output_parser in first_stage_output_parser_list
        ]

        criteria_options_list = [
            "\n".join(
                [f"{option.name}: {option.description}" for option in criterion.options]
            )
            for criterion in criteria
        ]

        predictions: list[str] = [i.response for i in instances]
        context_variables_list = [
            instance.context if instance.context is not None else {}
            for instance in instances
        ]
        str_context_variables_list = [
            "\n".join(f"{k}: {v}" for k, v in c.items()) for c in context_variables_list
        ]
        first_stage_prompt_template_list = [
            PromptTemplate(
                input_variables=["text_to_evaluate", "context"],
                partial_variables={
                    "format_instructions": first_stage_format_instructions,
                    "criteria_options": criteria_options,
                    "criteria_name": criterion.name,
                    "criteria_description": criterion.description,
                },
                template=dedent(
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
                For each option of the criterion, provide a CoT step-by-step reasoning explaining why the text *would* fit that option. If there is no supporting evidence, respond with "No arguments.". If in doubt, provide the arguments anyway.

                ### Output format
                {format_instructions}
            """,
                ),
            )
            for first_stage_format_instructions, criteria_options, criterion in zip(
                first_stage_format_instructions_list, criteria_options_list, criteria
            )
        ]

        first_stage_prompts = [
            first_stage_prompt_template.format(
                text_to_evaluate=prediction,
                context=context,
            )
            for prediction, context, first_stage_prompt_template in zip(
                predictions,
                str_context_variables_list,
                first_stage_prompt_template_list,
            )
        ]

        first_stage_messages = [
            [self.get_ai_message_from_prompt(p)] for p in first_stage_prompts
        ]

        first_stage_responses = cast(
            list[str],
            self.inference_engine.infer(
                [
                    {"source": prompt, "data_classification_policy": ["public"]}
                    for prompt in first_stage_prompts
                ]
            ),
        )

        first_stage_parsed_responses = [
            first_stage_output_parser.parse(response)
            for response, first_stage_output_parser in zip(
                first_stage_responses, first_stage_output_parser_list
            )
        ]

        # Second stage

        second_stage_response_schemas = [
            ResponseSchema(
                name="selected_option",
                description="Main selected criterion option",
            ),
            ResponseSchema(
                name="alternative_selected_option",
                description="Optinal alternative selected criterion option",
            ),
        ]

        second_stage_output_parser = self.get_structured_output_fixing_parser(
            second_stage_response_schemas
        )

        second_stage_format_instructions = (
            second_stage_output_parser.get_format_instructions()
        )

        second_stage_prompt_template = PromptTemplate(
            input_variables=["criteria_option_names"],
            partial_variables={
                "format_instructions": second_stage_format_instructions,
            },
            template=dedent(
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
            """,
            ),
        )

        second_stage_prompts = [
            second_stage_prompt_template.format(
                criteria_option_names=", ".join(
                    [option.name for option in criterion.options]
                )
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
                first_stage_responses,
                second_stage_prompts,
            )
        ]

        second_stage_output_responses = cast(
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
        second_stage_output_parsed_responses = [
            second_stage_output_parser.parse(response)
            for response in second_stage_output_responses
        ]
        second_stage_selected_option_list = [
            second_stage_output_parsed_response["selected_option"]
            for second_stage_output_parsed_response in second_stage_output_parsed_responses
        ]

        # Third stage (if required)

        is_unsure_list = [
            second_stage_output_parsed_response["alternative_selected_option"] != ""
            for second_stage_output_parsed_response in second_stage_output_parsed_responses
        ]
        unsure_indexes: list[int] = []
        for i, (is_unsure, selected_option) in enumerate(
            zip(is_unsure_list, second_stage_selected_option_list)
        ):
            if is_unsure:
                unsure_indexes.append(i)

        third_stage_messages_list: list[list[dict[str, str]]] = []
        third_stage_output_parsers = []
        option_one_list = []
        option_two_list = []
        for unsure_index in unsure_indexes:
            option_one = second_stage_output_parsed_responses[unsure_index][
                "selected_option"
            ]
            option_one_list.append(option_one)
            option_two = second_stage_output_parsed_responses[unsure_index][
                "alternative_selected_option"
            ]
            option_two_list.append(option_two)

            third_stage_response_schemas = [
                ResponseSchema(
                    name=option_one,
                    description=f"The argument for not evaluating the text as {option_one}",
                ),
                ResponseSchema(
                    name=option_two,
                    description=f"The argument for not evaluating the text as {option_two}",
                ),
            ]

            third_stage_output_parser = self.get_structured_output_fixing_parser(
                third_stage_response_schemas
            )

            third_stage_output_parsers.append(third_stage_output_parser)

            third_stage_format_instructions = (
                third_stage_output_parser.get_format_instructions()
            )

            third_stage_prompt_template = PromptTemplate(
                input_variables=[],
                partial_variables={
                    "format_instructions": third_stage_format_instructions,
                    "option_one": option_one,
                    "option_two": option_two,
                },
                template=dedent(
                    """\
                    ### Stage 3: Examining Alternatives

                    You previously narrowed your choice to two options: **Option {option_one}** and **Option {option_two}**.

                    Your task now is to critically assess **why the text should *not*** be assigned to each of these options.

                    - Provide a brief rationale for why the text fails to match **Option {option_one}**.
                    - Provide a brief rationale for why the text fails to match **Option {option_two}**.

                    ### Output format
                    {format_instructions}
                """,
                ),
            )

            third_stage_prompt = third_stage_prompt_template.format()

            third_stage_messages = [
                *second_stage_messages_list[unsure_index],
                self.get_ai_message_from_prompt(
                    second_stage_output_responses[unsure_index], "assistant"
                ),
                self.get_ai_message_from_prompt(third_stage_prompt),
            ]
            third_stage_messages_list.append(third_stage_messages)

        third_stage_output_responses = cast(
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
        fourth_stage_output_parsers = []
        for (
            option_one,
            option_two,
            third_stage_messages,
            third_stage_output_response,
            unsure_index,
        ) in zip(
            option_one_list,
            option_two_list,
            third_stage_messages_list,
            third_stage_output_responses,
            unsure_indexes,
        ):
            fourth_stage_response_schemas = [
                ResponseSchema(
                    name="explanation",
                    description="An explanation that clearly states why you selected that option",
                ),
                ResponseSchema(
                    name="selected_option",
                    description=f"the selected option (either '{option_one}' or '{option_two}')",
                ),
            ]

            fourth_stage_output_parser: OutputFixingParser[Any] = (
                self.get_structured_output_fixing_parser(fourth_stage_response_schemas)
            )
            fourth_stage_output_parsers.append(fourth_stage_output_parser)

            fourth_stage_format_instructions = (
                fourth_stage_output_parser.get_format_instructions()
            )

            fourth_stage_prompt_template = PromptTemplate(
                input_variables=[
                    "text_to_evaluate",
                    "context",
                    "option_one_description",
                    "option_two_description",
                ],
                partial_variables={
                    "format_instructions": fourth_stage_format_instructions,
                    "option_one": option_one,
                    "option_two": option_two,
                },
                template=dedent(
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
                ),
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
            )

            fourth_stage_messages: list[dict[str, str]] = [
                *third_stage_messages,
                self.get_ai_message_from_prompt(
                    third_stage_output_response, "assistant"
                ),
                self.get_ai_message_from_prompt(fourth_stage_prompt),
            ]
            fourth_stage_messages_list.append(fourth_stage_messages)

        fourth_stage_output_responses = cast(
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
        fourth_stage_output_parsed_responses = [
            fourth_stage_output_parser.parse(response)
            for fourth_stage_output_parser, response in zip(
                fourth_stage_output_parsers, fourth_stage_output_responses
            )
        ]
        fourth_stage_selected_option_list = [
            fourth_stage_output_parsed_response["selected_option"]
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
                    fourth_stage_output_parsed_responses[i]["explanation"]
                )
                full_messages_list.append(
                    fourth_stage_messages_list[i]
                    + [
                        self.get_ai_message_from_prompt(
                            fourth_stage_output_responses[i], "assistant"
                        )
                    ]
                )
                amount_of_stages.append(2)
                i += 1
            else:
                selected_options.append(second_stage_selected_option_list[j])
                explanations.append(
                    first_stage_parsed_responses[j][
                        f"Arguments for {second_stage_selected_option_list[j]}"
                    ]
                )
                full_messages_list.append(
                    second_stage_messages_list[j]
                    + [
                        self.get_ai_message_from_prompt(
                            second_stage_output_responses[j], "assistant"
                        )
                    ]
                )
                amount_of_stages.append(4)
            j += 1
        return [
            DirectInstanceResult(
                criteria=criterion,
                option=selected_option,
                explanation=explanation,
                metadata={"Number of stages": str(stages_count)},
            )
            for selected_option, explanation, stages_count, criterion in zip(
                selected_options, explanations, amount_of_stages, criteria
            )
        ]
