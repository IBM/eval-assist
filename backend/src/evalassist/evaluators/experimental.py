from textwrap import dedent
from typing import cast

from evalassist.api.common import Instance
from langchain.output_parsers import (
    OutputFixingParser,
    ResponseSchema,
    StructuredOutputParser,
)
from langchain.prompts import PromptTemplate
from langchain_core.prompt_values import StringPromptValue
from langchain_core.runnables import RunnableLambda

from . import DirectEvaluator


class ExperimentalDirectJudge(DirectEvaluator):
    def evaluate(
        self,
        instances: list[Instance],
    ) -> list[str]:
        def llm_invoke(text: StringPromptValue):
            # call your custom model here and return the raw text
            response = self.inference_engine.infer(
                [{"source": text.text, "data_classification_policy": ["public"]}]
            )[0]
            return response

        self.llm_runnable = RunnableLambda(llm_invoke).with_retry(
            retry_if_exception_type=(Exception,),
            wait_exponential_jitter=True,
            stop_after_attempt=3,
        )

        # First stage

        first_stage_response_schemas = [
            ResponseSchema(
                name=f"Arguments for {option.name}",
                description=f"The argument for evaluating the text as {option.name}",
            )
            for option in self.criteria.options
        ]

        first_stage_output_parser = StructuredOutputParser.from_response_schemas(
            first_stage_response_schemas
        )
        first_stage_output_parser = OutputFixingParser.from_llm(
            parser=first_stage_output_parser,
            llm=self.llm_runnable,
        )

        first_stage_format_instructions = (
            first_stage_output_parser.get_format_instructions()
        )
        criteria_options = [
            f"{option.name}: {option.description}" for option in self.criteria.options
        ]
        predictions = self.get_predictions(instances)
        context_variables_list = [instance.context_variables for instance in instances]
        str_context_variables_list = [
            "\n".join(f"{k}: {v}" for k, v in c.items()) for c in context_variables_list
        ]
        first_stage_prompt_template = PromptTemplate(
            input_variables=["text_to_evaluate", "context"],
            partial_variables={
                "format_instructions": first_stage_format_instructions,
                "criteria_options": criteria_options,
                "criteria_name": self.criteria.name,
                "criteria_description": self.criteria.description,
            },
            template=dedent(
                """\
                You are a human evaluator. You will be given a text to evaluate based on a criterion alongide with optional context.
                You will evaluate the text based on a criterion. The criterion is composed by a description and a set of options.
                The evaluation is multi-stage.

                ### Criterion:
                Name: {criteria_name}
                Description: {criteria_description}

                ### Context
                {context}

                ### Text to evaluate
                {text_to_evaluate}

                1st evaluation stage:
                In this first stage, you will assess why the text to evaluate would belong to each of the criterion options.
                {format_instructions}
            """,
            ),
        )

        first_stage_prompts = [
            first_stage_prompt_template.format(
                text_to_evaluate=prediction,
                context=context,
            )
            for prediction, context in zip(predictions, str_context_variables_list)
        ]
        # print(first_stage_prompts[0])
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
            for response in first_stage_responses
        ]
        first_stage_parsed_responses = [
            "\n".join([f"{k}: {v}" for k, v in parsed_response.items()])
            for parsed_response in first_stage_parsed_responses
        ]
        # print("first_stage_parsed_responses[0]")
        # print(first_stage_parsed_responses[0])

        # Second stage

        second_stage_response_schemas = [
            ResponseSchema(
                name="selected option",
                description="the selection to apply the action to",
            ),
            ResponseSchema(
                name="alternative selected option",
                description="the selection to apply the action to",
            ),
        ]

        second_stage_output_parser = StructuredOutputParser.from_response_schemas(
            second_stage_response_schemas
        )
        second_stage_output_parser = OutputFixingParser.from_llm(
            parser=second_stage_output_parser,
            llm=self.llm_runnable,
        )

        second_stage_format_instructions = (
            second_stage_output_parser.get_format_instructions()
        )

        second_stage_prompt_template = PromptTemplate(
            input_variables=[],
            partial_variables={
                "format_instructions": second_stage_format_instructions,
            },
            template=dedent(
                """\
                Second stage:
                In this second stage, you will choose a criteria option. Optionally, you can choose an alternative criteria option.
                Unless you are 100 percent sure of the chosen option, set an alternative option. If you choose to, leave the alternative option empty (empty string "").
                Remember you are a human evaluator, don't overcomplicate the choice. Choose what is more intuitive and obvious.

                {format_instructions}
            """,
            ),
        )

        second_stage_prompt_prompts = [
            second_stage_prompt_template.format(
                text_to_evaluate=prediction,
                context=context,
            )
            for prediction, context in zip(predictions, str_context_variables_list)
        ]

        second_stage_messages_list = [
            [
                {"role": "user", "content": first_stage_prompt},
                {"role": "assistant", "content": first_stage_parsed_response},
                {"role": "user", "content": second_stage_prompt_prompt},
            ]
            for first_stage_prompt, first_stage_parsed_response, second_stage_prompt_prompt in zip(
                first_stage_prompts,
                first_stage_parsed_responses,
                second_stage_prompt_prompts,
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
        second_stage_output_parsed_responses_str = [
            "\n".join([f"{k}: {v}" for k, v in parsed_response.items()])
            for parsed_response in second_stage_output_parsed_responses
        ]
        second_stage_selected_option_list = [
            second_stage_output_parsed_response["selected option"]
            for second_stage_output_parsed_response in second_stage_output_parsed_responses
        ]

        # print(json.dumps(second_stage_output_parsed_responses[0], indent=2))

        # Third stage (if required)

        is_unsure_list = [
            second_stage_output_parsed_response["alternative selected option"] != ""
            for second_stage_output_parsed_response in second_stage_output_parsed_responses
        ]
        unsure_indexes = []
        for i, (is_unsure, selected_option) in enumerate(
            zip(is_unsure_list, second_stage_selected_option_list)
        ):
            if is_unsure:
                unsure_indexes.append(i)

        third_stage_messages_list = []
        third_stage_prompts = []
        third_stage_output_parsers = []
        option_one_list = []
        option_two_list = []
        for is_unsure in unsure_indexes:
            option_one = second_stage_output_parsed_responses[is_unsure][
                "selected option"
            ]
            option_one_list.append(option_one)
            option_two = second_stage_output_parsed_responses[is_unsure][
                "alternative selected option"
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

            third_stage_output_parser = StructuredOutputParser.from_response_schemas(
                third_stage_response_schemas
            )
            third_stage_output_parser = OutputFixingParser.from_llm(
                parser=third_stage_output_parser,
                llm=self.llm_runnable,
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
                    Third stage:
                    In this third stage, you will assess why the text to evaluate shouln't belong to each of the criterion options you feel unsure about ({option_one} and {option_two}).

                    {format_instructions}
                """,
                ),
            )

            third_stage_prompt = third_stage_prompt_template.format()

            third_stage_messages = [
                *second_stage_messages_list[is_unsure],
                {
                    "role": "assistant",
                    "content": second_stage_output_parsed_responses_str[is_unsure],
                },
                {"role": "user", "content": third_stage_prompt},
            ]
            third_stage_messages_list.append(third_stage_messages)
            third_stage_full_prompt = {
                "source": third_stage_messages,
                "data_classification_policy": ["public"],
            }
            third_stage_prompts.append(third_stage_full_prompt)

        third_stage_output_responses = cast(
            list[str], self.inference_engine.infer(third_stage_prompts)
        )
        third_stage_output_parsed_responses = [
            third_stage_output_parser.parse(response)
            for third_stage_output_parser, response in zip(
                third_stage_output_parsers, third_stage_output_responses
            )
        ]
        third_stage_output_parsed_responses_str = [
            "\n".join([f"{k}: {v}" for k, v in parsed_response.items()])
            for parsed_response in third_stage_output_parsed_responses
        ]

        # Fourth stage (if required)

        fourth_stage_prompts = []
        fourth_stage_output_parsers = []
        for (
            third_stage_output_parsed_response,
            option_one,
            option_two,
            third_stage_messages,
            third_stage_output_parsed_response_str,
        ) in zip(
            third_stage_output_parsed_responses,
            option_one_list,
            option_two_list,
            third_stage_messages_list,
            third_stage_output_parsed_responses_str,
        ):
            fourth_stage_response_schemas = [
                ResponseSchema(
                    name="selected option",
                    description=f"the selected option (either '{option_one}' or '{option_two}')",
                )
            ]

            fourth_stage_output_parser = StructuredOutputParser.from_response_schemas(
                fourth_stage_response_schemas
            )
            fourth_stage_output_parser = OutputFixingParser.from_llm(
                parser=fourth_stage_output_parser,
                llm=self.llm_runnable,
            )
            fourth_stage_output_parsers.append(fourth_stage_output_parser)

            fourth_stage_format_instructions = (
                fourth_stage_output_parser.get_format_instructions()
            )

            fourth_stage_prompt_template = PromptTemplate(
                input_variables=[],
                partial_variables={
                    "format_instructions": fourth_stage_format_instructions,
                    "option_one": option_one,
                    "option_two": option_two,
                },
                template=dedent(
                    """\
                    Fourth stage:
                    In this fourth stage, you will choose one of the options you felt unsure with: {option_one} or {option_two}.
                    In order to make a decision, take into account the arguments for and against the text to evaluate should be assign one of the options.

                    {format_instructions}
                """,
                ),
            )

            fourth_stage_prompt = fourth_stage_prompt_template.format()

            fourth_stage_messages = [
                *third_stage_messages,
                {
                    "role": "assistant",
                    "content": third_stage_output_parsed_response_str,
                },
                {"role": "user", "content": fourth_stage_prompt},
            ]
            fourth_stage_full_prompt = {
                "source": fourth_stage_messages,
                "data_classification_policy": ["public"],
            }
            fourth_stage_prompts.append(fourth_stage_full_prompt)

        fourth_stage_output_responses = cast(
            list[str], self.inference_engine.infer(fourth_stage_prompts)
        )
        fourth_stage_output_parsed_responses = [
            fourth_stage_output_parser.parse(response)
            for fourth_stage_output_parser, response in zip(
                fourth_stage_output_parsers, fourth_stage_output_responses
            )
        ]
        fourth_stage_selected_option_list = [
            fourth_stage_output_parsed_response["selected option"]
            for fourth_stage_output_parsed_response in fourth_stage_output_parsed_responses
        ]
        # if len(fourth_stage_prompts)>0:
        #     print(json.dumps(fourth_stage_prompts[0], indent=2))

        i = 0
        j = 0
        results: list[str] = []
        for is_unsure in is_unsure_list:
            if is_unsure:
                results.append(fourth_stage_selected_option_list[i])
                i += 1
            else:
                results.append(second_stage_selected_option_list[j])
                j += 1

        # for prediction, result in zip(predictions, results):
        #     print(f"The text\n'{prediction}'\nwas evaluated as\n{result}")

        return results

    def parse_results(self, dataset):
        return dataset
