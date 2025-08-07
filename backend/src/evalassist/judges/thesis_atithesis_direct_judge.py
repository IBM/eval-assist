import json
from collections.abc import Sequence
from textwrap import dedent
from typing import cast

from langchain.output_parsers import (
    OutputFixingParser,
    ResponseSchema,
    StructuredOutputParser,
)
from langchain.prompts import PromptTemplate
from langchain_core.prompt_values import StringPromptValue
from langchain_core.runnables import RunnableLambda

from ..api.common import DirectInstance, DirectInstanceResult, DirectPositionalBias
from .base import DirectJudge


class ExperimentalThesisAntithesislDirectJudge(DirectJudge):
    def evaluate(
        self,
        instances: Sequence[DirectInstance],
    ) -> list[DirectInstanceResult]:
        def llm_invoke(text: StringPromptValue):
            # call your custom model here and return the raw text
            response = self.inference_engine.infer(
                [{"source": text.text, "data_classification_policy": ["public"]}]
            )[0]
            return response

        self.llm_runnable = RunnableLambda(llm_invoke)

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
            parser=first_stage_output_parser, llm=self.llm_runnable, max_retries=3
        )

        first_stage_format_instructions = (
            first_stage_output_parser.get_format_instructions()
        )
        criteria_options = "\n".join(
            [f"{option.name}: {option.description}" for option in self.criteria.options]
        )
        predictions: list[str] = [i.response for i in instances]
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
                You are a human evaluator. You will be given a text to evaluate based on a criterion alonside with optional context.
                You will evaluate the text based on a criterion. The criterion is composed by a description and a set of options.
                The evaluation is multi-stage.

                ### Criterion:
                Name: {criteria_name}
                Description: {criteria_description}
                Options:
                {criteria_options}

                ### Context
                {context}

                ### Text to evaluate
                {text_to_evaluate}

                ### First evaluation stage:
                In this first stage, you will assess why the text to evaluate would belong to each of the criterion options.
                {format_instructions}
                Don't output anything else than the json markdown.

                Output:

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
            parser=second_stage_output_parser, llm=self.llm_runnable, max_retries=3
        )

        second_stage_format_instructions = (
            second_stage_output_parser.get_format_instructions()
        )

        second_stage_prompt_template = PromptTemplate(
            input_variables=[],
            partial_variables={
                "format_instructions": second_stage_format_instructions,
                "criteria_option_names": ", ".join(
                    [option.name for option in self.criteria.options]
                ),
            },
            template=dedent(
                """\
                ### Second evaluation stage:
                In this second stage, you will choose a criteria option. Optionally, you can choose an alternative criteria option.
                Unless you are 100 percent sure of the chosen option, set an alternative option. If you choose to, leave the alternative option empty (empty string "").
                Remember you are a human evaluator, don't overcomplicate the choice.

                Available criteria options: {criteria_option_names}

                {format_instructions}
                Don't output anything else than the json markdown.

                Output:

            """,
            ),
        )

        second_stage_prompts = [
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
                {"role": "user", "content": second_stage_prompt},
            ]
            for first_stage_prompt, first_stage_parsed_response, second_stage_prompt in zip(
                first_stage_prompts,
                first_stage_parsed_responses,
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
        for unsure_index in unsure_indexes:
            option_one = second_stage_output_parsed_responses[unsure_index][
                "selected option"
            ]
            option_one_list.append(option_one)
            option_two = second_stage_output_parsed_responses[unsure_index][
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
                parser=third_stage_output_parser, llm=self.llm_runnable, max_retries=3
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
                    ### Third evaluation stage:
                    In this third stage, you will assess why the text to evaluate shouln't belong to each of the criterion options you feel unsure about ({option_one} and {option_two}).

                    {format_instructions}
                    Don't output anything else than the json markdown.

                    Output:

                """,
                ),
            )

            third_stage_prompt = third_stage_prompt_template.format()

            third_stage_messages = [
                *second_stage_messages_list[unsure_index],
                {
                    "role": "assistant",
                    "content": second_stage_output_parsed_responses_str[unsure_index],
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
            unsure_index,
        ) in zip(
            third_stage_output_parsed_responses,
            option_one_list,
            option_two_list,
            third_stage_messages_list,
            third_stage_output_parsed_responses_str,
            unsure_indexes,
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
                parser=fourth_stage_output_parser, llm=self.llm_runnable, max_retries=3
            )
            fourth_stage_output_parsers.append(fourth_stage_output_parser)

            fourth_stage_format_instructions = (
                fourth_stage_output_parser.get_format_instructions()
            )

            fourth_stage_prompt_template = PromptTemplate(
                input_variables=["text_to_evaluate", "context"],
                partial_variables={
                    "format_instructions": fourth_stage_format_instructions,
                    "option_one": option_one,
                    "option_two": option_two,
                    "option_one_description": next(
                        iter(
                            o.description
                            for o in self.criteria.options
                            if o.name == option_one
                        )
                    ),
                    "option_two_description": next(
                        iter(
                            o.description
                            for o in self.criteria.options
                            if o.name == option_two
                        )
                    ),
                },
                template=dedent(
                    """\
                    ### Fourth evaluation stage:
                    In this fourth stage, you will choose one of the options you felt unsure with: {option_one} or {option_two}.
                    In order to make a decision, take into account the arguments for and against the text to evaluate should be assign one of the options.

                    {option_one}: {option_one_description}
                    {option_two}: {option_two_description}

                    Context:
                    {context}

                    Text to evaluate:
                    {text_to_evaluate}

                    {format_instructions}
                    Don't output anything else than the json markdown.

                    Output:

                """,
                ),
            )

            fourth_stage_prompt = fourth_stage_prompt_template.format(
                text_to_evaluate=predictions[unsure_index],
                context=str_context_variables_list[unsure_index],
            )

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
        selected_options: list[str] = []
        explanations = []
        for is_unsure in is_unsure_list:
            if is_unsure:
                selected_options.append(fourth_stage_selected_option_list[i])
                explanations.append(
                    json.dumps(
                        fourth_stage_prompts[i]["source"]
                        + [
                            {
                                "role": "assistant",
                                "content": fourth_stage_output_parsed_responses[i][
                                    "selected option"
                                ],
                            }
                        ],
                        indent=4,
                    )
                )
                i += 1
            else:
                selected_options.append(second_stage_selected_option_list[j])
                explanations.append(
                    json.dumps(
                        second_stage_messages_list[j]
                        + [
                            {
                                "role": "assistant",
                                "content": second_stage_output_parsed_responses[i][
                                    "selected option"
                                ],
                            }
                        ],
                        indent=4,
                    )
                )
                j += 1

        return [
            DirectInstanceResult(
                option=selected_option,
                explanation=explanation,
                positional_bias=DirectPositionalBias(
                    detected=False,
                ),
            )
            for selected_option, explanation in zip(selected_options, explanations)
        ]

        return selected_options


# Results
# poor performance compared to unitxt judge, very high pos bias

# cards.judge_bench.wmt_human.chinese_to_english.quality,llama-4-maverick,translation_quality,"{""spearman"": 0.41858583036814806, ""positional_bias_rate"": 0.72, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.wmt_human.chinese_to_english.quality,llama-4-maverick,translation_quality,"{""spearman"": 0.41858583036814806, ""positional_bias_rate"": 0.72, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.wmt_human.english_to_german.quality,llama-4-maverick,translation_quality,"{""spearman"": 0.3624408935392445, ""positional_bias_rate"": 0.62, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.wmt_human.english_to_german.quality,llama-4-maverick,translation_quality,"{""spearman"": 0.40297387775146315, ""positional_bias_rate"": 0.56, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.cola.grammaticality,llama-4-maverick,grammar_and_punctuation,"{""accuracy"": 0.52, ""f1_macro"": 0.4285714285714286, ""positional_bias_rate"": 0.76, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.final_answer,llama-4-maverick,step_by_step_reasoning_bad_final_answer,"{""accuracy"": 0.68, ""f1_macro"": 0.5, ""positional_bias_rate"": 0.6, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.cola.grammaticality,llama-4-maverick,grammar_and_punctuation,"{""accuracy"": 0.58, ""f1_macro"": 0.5091164095371669, ""positional_bias_rate"": 0.58, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.final_answer,llama-4-maverick,step_by_step_reasoning_bad_final_answer,"{""accuracy"": 0.64, ""f1_macro"": 0.3902439024390244, ""positional_bias_rate"": 0.56, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.factuality,llama-4-maverick,step_by_step_reasoning_non_factual,"{""accuracy"": 0.64, ""f1_macro"": 0.3902439024390244, ""positional_bias_rate"": 0.68, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.commonsense,llama-4-maverick,step_by_step_reasoning_commonsense,"{""accuracy"": 0.72, ""f1_macro"": 0.5257452574525745, ""positional_bias_rate"": 0.72, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.hallucination,llama-4-maverick,step_by_step_reasoning_hallucination,"{""accuracy"": 0.48, ""f1_macro"": 0.3551587301587301, ""positional_bias_rate"": 0.56, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.commonsense,llama-4-maverick,step_by_step_reasoning_commonsense,"{""accuracy"": 0.7, ""f1_macro"": 0.5126705653021442, ""positional_bias_rate"": 0.76, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.factuality,llama-4-maverick,step_by_step_reasoning_non_factual,"{""accuracy"": 0.66, ""f1_macro"": 0.4476933073424301, ""positional_bias_rate"": 0.7, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.grammar,llama-4-maverick,step_by_step_reasoning_bad_grammar,"{""accuracy"": 0.7, ""f1_macro"": 0.5479204339963833, ""positional_bias_rate"": 0.58, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.coherency_and_logic,llama-4-maverick,step_by_step_reasoning_non_coherent,"{""accuracy"": 0.36, ""f1_macro"": 0.33333333333333337, ""positional_bias_rate"": 0.72, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.coherency_and_logic,llama-4-maverick,step_by_step_reasoning_non_coherent,"{""accuracy"": 0.42, ""f1_macro"": 0.3905002101723413, ""positional_bias_rate"": 0.48, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.grammar,llama-4-maverick,step_by_step_reasoning_bad_grammar,"{""accuracy"": 0.74, ""f1_macro"": 0.5776478232618583, ""positional_bias_rate"": 0.44, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.repetition,llama-4-maverick,step_by_step_reasoning_repetition,"{""accuracy"": 0.66, ""f1_macro"": 0.39759036144578314, ""positional_bias_rate"": 0.74, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.repetition,llama-4-maverick,step_by_step_reasoning_repetition,"{""accuracy"": 0.66, ""f1_macro"": 0.39759036144578314, ""positional_bias_rate"": 0.68, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.redundancy,llama-4-maverick,step_by_step_reasoning_redundancy,"{""accuracy"": 0.32, ""f1_macro"": 0.2621527777777778, ""positional_bias_rate"": 0.68, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.redundancy,llama-4-maverick,step_by_step_reasoning_redundancy,"{""accuracy"": 0.24, ""f1_macro"": 0.20833333333333331, ""positional_bias_rate"": 0.7, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.arithmetic,llama-4-maverick,step_by_step_reasoning_arithmetic,"{""accuracy"": 1.0, ""f1_macro"": 1.0, ""positional_bias_rate"": 1.0, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.arithmetic,llama-4-maverick,step_by_step_reasoning_arithmetic,"{""accuracy"": 1.0, ""f1_macro"": 1.0, ""positional_bias_rate"": 1.0, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.commonsense,llama-4-maverick,step_by_step_reasoning_commonsense,"{""accuracy"": 0.84, ""f1_macro"": 0.9130434782608695, ""positional_bias_rate"": 0.76, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.final_answer,llama-4-maverick,step_by_step_reasoning_bad_final_answer,"{""accuracy"": 0.54, ""f1_macro"": 0.38666666666666666, ""positional_bias_rate"": 0.5, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.commonsense,llama-4-maverick,step_by_step_reasoning_commonsense,"{""accuracy"": 0.88, ""f1_macro"": 0.9361702127659575, ""positional_bias_rate"": 0.78, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.final_answer,llama-4-maverick,step_by_step_reasoning_bad_final_answer,"{""accuracy"": 0.56, ""f1_macro"": 0.3969298245614035, ""positional_bias_rate"": 0.54, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.hallucination,llama-4-maverick,step_by_step_reasoning_hallucination,"{""accuracy"": 0.7, ""f1_macro"": 0.4117647058823529, ""positional_bias_rate"": 0.82, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.hallucination,llama-4-maverick,step_by_step_reasoning_hallucination,"{""accuracy"": 0.7, ""f1_macro"": 0.4117647058823529, ""positional_bias_rate"": 0.86, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.factuality,llama-4-maverick,step_by_step_reasoning_non_factual,"{""accuracy"": 0.86, ""f1_macro"": 0.6905393457117595, ""positional_bias_rate"": 0.96, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.coherency_and_logic,llama-4-maverick,step_by_step_reasoning_non_coherent,"{""accuracy"": 0.6, ""f1_macro"": 0.375, ""positional_bias_rate"": 0.56, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.coherency_and_logic,llama-4-maverick,step_by_step_reasoning_non_coherent,"{""accuracy"": 0.62, ""f1_macro"": 0.4273658830620856, ""positional_bias_rate"": 0.54, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.grammar,llama-4-maverick,step_by_step_reasoning_bad_grammar,"{""accuracy"": 0.82, ""f1_macro"": 0.45054945054945056, ""positional_bias_rate"": 0.76, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.grammar,llama-4-maverick,step_by_step_reasoning_bad_grammar,"{""accuracy"": 0.8, ""f1_macro"": 0.4444444444444444, ""positional_bias_rate"": 0.7, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.redundancy,llama-4-maverick,step_by_step_reasoning_redundancy,"{""accuracy"": 0.3, ""f1_macro"": 0.26439680538041194, ""positional_bias_rate"": 0.78, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.redundancy,llama-4-maverick,step_by_step_reasoning_redundancy,"{""accuracy"": 0.34, ""f1_macro"": 0.29214929214929214, ""positional_bias_rate"": 0.56, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.repetition,llama-4-maverick,step_by_step_reasoning_repetition,"{""accuracy"": 0.54, ""f1_macro"": 0.7012987012987013, ""positional_bias_rate"": 0.86, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.repetition,llama-4-maverick,step_by_step_reasoning_repetition,"{""accuracy"": 0.62, ""f1_macro"": 0.7654320987654321, ""positional_bias_rate"": 0.68, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.arithmetic,llama-4-maverick,step_by_step_reasoning_arithmetic,"{""accuracy"": 0.9, ""f1_macro"": 0.9473684210526315, ""positional_bias_rate"": 0.82, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.commonsense,llama-4-maverick,step_by_step_reasoning_commonsense,"{""accuracy"": 0.98, ""f1_macro"": 0.98989898989899, ""positional_bias_rate"": 0.92, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.commonsense,llama-4-maverick,step_by_step_reasoning_commonsense,"{""accuracy"": 0.96, ""f1_macro"": 0.9795918367346939, ""positional_bias_rate"": 0.94, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.final_answer,llama-4-maverick,step_by_step_reasoning_bad_final_answer,"{""accuracy"": 0.88, ""f1_macro"": 0.9361702127659575, ""positional_bias_rate"": 0.86, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.final_answer,llama-4-maverick,step_by_step_reasoning_bad_final_answer,"{""accuracy"": 0.82, ""f1_macro"": 0.9010989010989011, ""positional_bias_rate"": 0.82, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.factuality,llama-4-maverick,step_by_step_reasoning_non_factual,"{""accuracy"": 0.92, ""f1_macro"": 0.4791666666666667, ""positional_bias_rate"": 0.96, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.cosmos.hallucination,llama-4-maverick,step_by_step_reasoning_hallucination,"{""accuracy"": 0.52, ""f1_macro"": 0.37629937629937626, ""positional_bias_rate"": 0.62, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.factuality,llama-4-maverick,step_by_step_reasoning_non_factual,"{""accuracy"": 0.9, ""f1_macro"": 0.47368421052631576, ""positional_bias_rate"": 0.96, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.hallucination,llama-4-maverick,step_by_step_reasoning_hallucination,"{""accuracy"": 0.8, ""f1_macro"": 0.6279761904761905, ""positional_bias_rate"": 0.74, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.hallucination,llama-4-maverick,step_by_step_reasoning_hallucination,"{""accuracy"": 0.82, ""f1_macro"": 0.6021220159151194, ""positional_bias_rate"": 0.82, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.coherency_and_logic,llama-4-maverick,step_by_step_reasoning_non_coherent,"{""accuracy"": 0.8, ""f1_macro"": 0.6279761904761905, ""positional_bias_rate"": 0.62, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.grammar,llama-4-maverick,step_by_step_reasoning_bad_grammar,"{""accuracy"": 0.86, ""f1_macro"": 0.9247311827956989, ""positional_bias_rate"": 0.88, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.grammar,llama-4-maverick,step_by_step_reasoning_bad_grammar,"{""accuracy"": 0.86, ""f1_macro"": 0.9247311827956989, ""positional_bias_rate"": 0.8, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.redundancy,llama-4-maverick,step_by_step_reasoning_redundancy,"{""accuracy"": 0.6, ""f1_macro"": 0.554367201426025, ""positional_bias_rate"": 0.54, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.redundancy,llama-4-maverick,step_by_step_reasoning_redundancy,"{""accuracy"": 0.52, ""f1_macro"": 0.4652406417112299, ""positional_bias_rate"": 0.56, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.repetition,llama-4-maverick,step_by_step_reasoning_repetition,"{""accuracy"": 0.74, ""f1_macro"": 0.8505747126436781, ""positional_bias_rate"": 0.66, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.repetition,llama-4-maverick,step_by_step_reasoning_repetition,"{""accuracy"": 0.74, ""f1_macro"": 0.8505747126436781, ""positional_bias_rate"": 0.84, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.arithmetic,llama-4-maverick,step_by_step_reasoning_arithmetic,"{""accuracy"": 1.0, ""f1_macro"": 1.0, ""positional_bias_rate"": 1.0, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.arithmetic,llama-4-maverick,step_by_step_reasoning_arithmetic,"{""accuracy"": 1.0, ""f1_macro"": 1.0, ""positional_bias_rate"": 1.0, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.cosmos.contradiction,llama-4-maverick,step_by_step_reasoning_contradiction,"{""accuracy"": 0.78, ""f1_macro"": 0.6102055279943303, ""positional_bias_rate"": 0.54, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.cosmos.contradiction,llama-4-maverick,step_by_step_reasoning_contradiction,"{""accuracy"": 0.78, ""f1_macro"": 0.6102055279943303, ""positional_bias_rate"": 0.52, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.factuality,llama-4-maverick,step_by_step_reasoning_non_factual,"{""accuracy"": 0.9, ""f1_macro"": 0.7446373850868233, ""positional_bias_rate"": 0.96, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.cosmos.overall_quality,llama-4-maverick,step_by_step_reasoning_overall_quality,"{""spearman"": 0.32802288210075076, ""positional_bias_rate"": 0.48, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.cosmos.missing_steps,llama-4-maverick,step_by_step_reasoning_missing_steps,"{""accuracy"": 0.46, ""f1_macro"": 0.3688639551192146, ""positional_bias_rate"": 0.86, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.cosmos.missing_steps,llama-4-maverick,step_by_step_reasoning_missing_steps,"{""accuracy"": 0.48, ""f1_macro"": 0.38095238095238093, ""positional_bias_rate"": 0.84, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.drop.contradiction,llama-4-maverick,step_by_step_reasoning_contradiction,"{""accuracy"": 0.78, ""f1_macro"": 0.43820224719101125, ""positional_bias_rate"": 0.86, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.cosmos.overall_quality,llama-4-maverick,step_by_step_reasoning_overall_quality,"{""spearman"": 0.17072111897380235, ""positional_bias_rate"": 0.4, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.cosmos.coherence,llama-4-maverick,step_by_step_reasoning_coherency,"{""spearman"": -0.06627774754368523, ""positional_bias_rate"": 0.38, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.drop.contradiction,llama-4-maverick,step_by_step_reasoning_contradiction,"{""accuracy"": 0.72, ""f1_macro"": 0.4186046511627907, ""positional_bias_rate"": 0.68, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.drop.arithmetic,llama-4-maverick,step_by_step_reasoning_arithmetic,"{""accuracy"": 0.92, ""f1_macro"": 0.9583333333333334, ""positional_bias_rate"": 0.86, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.drop.coherence,llama-4-maverick,step_by_step_reasoning_coherency,"{""spearman"": 0.09524422708917425, ""positional_bias_rate"": 0.5, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.drop.coherence,llama-4-maverick,step_by_step_reasoning_coherency,"{""spearman"": 0.023494776067613663, ""positional_bias_rate"": 0.48, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.drop.overall_quality,llama-4-maverick,step_by_step_reasoning_overall_quality,"{""spearman"": 0.47686727449605487, ""positional_bias_rate"": 0.62, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.drop.missing_steps,llama-4-maverick,step_by_step_reasoning_missing_steps,"{""accuracy"": 0.44, ""f1_macro"": 0.4318181818181818, ""positional_bias_rate"": 0.68, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.drop.missing_steps,llama-4-maverick,step_by_step_reasoning_missing_steps,"{""accuracy"": 0.42, ""f1_macro"": 0.4005787515502274, ""positional_bias_rate"": 0.54, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.drop.overall_quality,llama-4-maverick,step_by_step_reasoning_overall_quality,"{""spearman"": 0.22732833841381506, ""positional_bias_rate"": 0.48, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.esnli.contradiction,llama-4-maverick,step_by_step_reasoning_contradiction,"{""accuracy"": 0.94, ""f1_macro"": 0.4845360824742268, ""positional_bias_rate"": 0.92, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.esnli.contradiction,llama-4-maverick,step_by_step_reasoning_contradiction,"{""accuracy"": 0.92, ""f1_macro"": 0.4791666666666667, ""positional_bias_rate"": 0.94, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.esnli.coherence,llama-4-maverick,step_by_step_reasoning_coherency,"{""spearman"": 0.3209862748320187, ""positional_bias_rate"": 0.64, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.esnli.missing_steps,llama-4-maverick,step_by_step_reasoning_missing_steps,"{""accuracy"": 0.34, ""f1_macro"": 0.31789995866060355, ""positional_bias_rate"": 0.86, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.esnli.overall_quality,llama-4-maverick,step_by_step_reasoning_overall_quality,"{""spearman"": 0.2519001742175537, ""positional_bias_rate"": 0.36, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.esnli.coherence,llama-4-maverick,step_by_step_reasoning_coherency,"{""spearman"": 0.323660621961353, ""positional_bias_rate"": 0.62, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.esnli.missing_steps,llama-4-maverick,step_by_step_reasoning_missing_steps,"{""accuracy"": 0.26, ""f1_macro"": 0.22236233711643547, ""positional_bias_rate"": 0.88, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.stepwise.esnli.coherency_and_logic,llama-4-maverick,step_by_step_reasoning_non_coherent,"{""accuracy"": 0.8, ""f1_macro"": 0.6279761904761905, ""positional_bias_rate"": 0.74, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.esnli.overall_quality,llama-4-maverick,step_by_step_reasoning_overall_quality,"{""spearman"": 0.472260255362492, ""positional_bias_rate"": 0.28, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.newswoom.informativeness,llama-4-maverick,summarization_informativeness,"{""spearman"": 0.27704662788431966, ""positional_bias_rate"": 0.5, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.newswoom.informativeness,llama-4-maverick,summarization_informativeness,"{""spearman"": 0.27893835018147484, ""positional_bias_rate"": 0.58, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.wmt_human.chinese_to_english.quality,llama-4-maverick,translation_quality,"{""spearman"": 0.41858583036814806, ""positional_bias_rate"": 0.72, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.wmt_human.english_to_german.quality,llama-4-maverick,translation_quality,"{""spearman"": 0.40297387775146315, ""positional_bias_rate"": 0.6, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.newswoom.fluency,llama-4-maverick,summarization_fluency,"{""spearman"": -0.01933915606022827, ""positional_bias_rate"": 0.26, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.newswoom.fluency,llama-4-maverick,summarization_fluency,"{""spearman"": -0.02445652206716336, ""positional_bias_rate"": 0.38, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.dices.safety,llama-4-maverick,assistant_message_general_harm,"{""accuracy"": 0.78, ""f1_macro"": 0.5686274509803921, ""positional_bias_rate"": 0.78, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.newswoom.relevance,llama-4-maverick,summarization_relevance,"{""spearman"": 0.5114294663353192, ""positional_bias_rate"": 0.46, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.dices.safety,llama-4-maverick,assistant_message_general_harm,"{""accuracy"": 0.74, ""f1_macro"": 0.5393338058114813, ""positional_bias_rate"": 0.9, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.newswoom.coherence,llama-4-maverick,summarization_coherence,"{""spearman"": 0.31674220830593064, ""positional_bias_rate"": 0.52, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.newswoom.coherence,llama-4-maverick,summarization_coherence,"{""spearman"": 0.08745879145769354, ""positional_bias_rate"": 0.42, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.roscoe.overall.cosmos.coherence,llama-4-maverick,step_by_step_reasoning_coherency,"{""spearman"": -0.12287370007803666, ""positional_bias_rate"": 0.48, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.inferential_strategies.sound_reasoning,llama-4-maverick,logical_validity_of_reasoning,"{""accuracy"": 0.82, ""f1_macro"": 0.9010989010989011, ""positional_bias_rate"": 0.7, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.inferential_strategies.sound_reasoning,llama-4-maverick,logical_validity_of_reasoning,"{""accuracy"": 0.8, ""f1_macro"": 0.8888888888888888, ""positional_bias_rate"": 0.7, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.toxic_chat.jailbreaking,llama-4-maverick,user_message_jailbreak,"{""accuracy"": 0.5, ""f1_macro"": 0.39290917921321034, ""positional_bias_rate"": 0.54, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.toxic_chat.toxicity,llama-4-maverick,toxicity,"{""accuracy"": 0.72, ""f1_macro"": 0.6880570409982174, ""positional_bias_rate"": 0.46, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.toxic_chat.toxicity,llama-4-maverick,toxicity,"{""accuracy"": 0.74, ""f1_macro"": 0.7060153776571687, ""positional_bias_rate"": 0.52, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.newswoom.relevance,llama-4-maverick,summarization_relevance,"{""spearman"": 0.26993794041136615, ""positional_bias_rate"": 0.32, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
# cards.judge_bench.toxic_chat.jailbreaking,llama-4-maverick,user_message_jailbreak,"{""accuracy"": 0.56, ""f1_macro"": 0.45436507936507936, ""positional_bias_rate"": 0.56, ""corr_reponse_length/accuracy"": null, ""corr_context_length/accuracy"": null, ""corr_response_length/pos_bias"": null, ""corr_context_length/pos_bias"": null}"
