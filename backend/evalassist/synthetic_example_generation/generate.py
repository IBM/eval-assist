import json

# from model import Model
# from _archive.liberated_model import LiberatedModel
# from utils.data_utils import load_jsonl, save_to_jsonl
import logging
import os
import random
from textwrap import dedent
from typing import Optional

from langchain.output_parsers import ResponseSchema, StructuredOutputParser
from langchain.prompts import PromptTemplate
from unitxt.llm_as_judge import (
    CriteriaWithOptions,
    EvaluatorTypeEnum,
    ModelProviderEnum,
)

from ..api.common import CriteriaWithOptionsAPI
from ..api.types import DomainEnum, GenerationLengthEnum, PersonaEnum, TaskEnum
from ..const import ExtendedEvaluatorNameEnum, ExtendedModelProviderEnum
from ..utils import (
    get_evaluator_metadata_wrapper,
    get_inference_engine,
    get_model_name_from_evaluator,
    to_snake_case,
)
from .utils.data_utils import load_jsonl

logger = logging.getLogger(__name__)


def get_data_path(task: TaskEnum, domain: DomainEnum):
    return os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "data",
        to_snake_case(task.value),
        "source_data",
        "source.jsonl",
    )


class Generator:
    def __init__(
        self,
        provider: ModelProviderEnum | ExtendedModelProviderEnum,
        custom_model_name: Optional[str],
        llm_provider_credentials: dict[str, str],
        evaluator_name: ExtendedEvaluatorNameEnum,
        type: EvaluatorTypeEnum,
        criteria: CriteriaWithOptionsAPI,
        response_variable_name: str,
        context_variables_names: list[str],
        generation_length: Optional[GenerationLengthEnum],
        task: Optional[TaskEnum],
        domain: Optional[DomainEnum],
        persona: Optional[PersonaEnum],
        per_criteria_option_count: dict[str, int],
        borderline_count: int,
    ):
        self.provider = provider
        self.llm_provider_credentials = llm_provider_credentials
        self.custom_model_name = custom_model_name
        self.evaluator_name = evaluator_name
        self.type = type
        self.criteria = criteria
        self.response_name = response_variable_name
        self.context_names = context_variables_names
        self.generation_length = generation_length
        self.task = task
        self.domain = domain
        self.persona = persona
        self.per_criteria_option_count = per_criteria_option_count
        self.borderline_count = borderline_count
        self.has_context_variables = len(self.context_names) > 0

        # intialize model
        evaluator_metadata = get_evaluator_metadata_wrapper(
            self.evaluator_name,
            self.custom_model_name,
        )
        model_name = get_model_name_from_evaluator(
            evaluator_metadata,
            self.provider,
        )
        self.inference_engine = get_inference_engine(
            self.llm_provider_credentials,
            self.provider,
            model_name,
            custom_params={
                "use_cache": False,
                "seed": None,
                "max_tokens": 200,
                "temperature": 0.7,
            },
        )

        system_prompt_input_variables = [
            "dimension",
            "dimension_description",
            "target",
            "target_description",
            "persona",
            "persona_description",
            "generation_length",
        ]

        if self.task == TaskEnum.QUESTION_ANSWERING:
            # response schema
            response_schemas = [
                ResponseSchema(name="answer", description="the answer to the question"),
            ]
            self.output_parser = StructuredOutputParser.from_response_schemas(
                response_schemas
            )
            self.format_instructions = self.output_parser.get_format_instructions()

            # prompt templates
            self.system_prompt_template = PromptTemplate(
                input_variables=system_prompt_input_variables,
                template=dedent("""You will be asked to generate an answer to a question according to the following requirements:

                Dimension: {dimension}
                Dimension description: {dimension_description}
                Target: {target}
                Target description: {target_description}

                Your task is to generate an answer that STRICTLY follows this requirement. This is for evaluation purposes.

                Important:
                - Focus exclusively on the specified dimension and target
                - Adopt the following persona: {persona}: {persona_description}
                - The generated answer's length should be {generation_length}
                - Make sure your answer clearly demonstrates the described characteristics
                - Do not mention the criteria in your answer - simply generate an answer to the question that embodies the characteristics"""),
            )

            self.query_template = PromptTemplate(
                input_variables=["question"],
                template="Please generate an answer to the following question:\n\n{question}\n\n{format_instructions}",
                partial_variables={"format_instructions": self.format_instructions},
            )

        elif self.task == TaskEnum.SUMMARIZATION:
            # response schema
            response_schemas = [
                ResponseSchema(name="summary", description="the text's summary"),
            ]
            self.output_parser = StructuredOutputParser.from_response_schemas(
                response_schemas
            )
            self.format_instructions = self.output_parser.get_format_instructions()

            # prompt templates
            self.system_prompt_template = PromptTemplate(
                input_variables=system_prompt_input_variables,
                template=dedent("""You will be given some source text and will be asked to generate a summary according to a specific target criteria.

                You should generate a summary that matches the following requirements:
                Dimension: {dimension}  # noqa: W293
                Dimension description: {dimension_description}
                Target: {target}
                Target description: {target_description}

                Your task is to generate a summary that STRICTLY follows this requirement. This is for evaluation purposes.

                Important:
                - Focus exclusively on the specified dimension and target
                - Adopt the following persona: {persona}: {persona_description}
                - The generated summary's length should be {generation_length}
                - Make sure your summary clearly demonstrates the described characteristics
                - Do not mention the criteria in your summary - simply generate a summary that embodies the characteristics"""),
            )

            self.query_template = PromptTemplate(
                input_variables=["original_text"],
                template="Please summarize the following text:\n\n{original_text}\n\n{format_instructions}",
                partial_variables={"format_instructions": self.format_instructions},
            )
        elif self.task == TaskEnum.TEXT_GENERATION:
            # no context (text generation)
            # response schema
            response_name = self.response_name
            response_schemas = [
                ResponseSchema(
                    name=response_name,
                    description=f"the requested {response_name}",
                ),
            ]
            self.output_parser = StructuredOutputParser.from_response_schemas(
                response_schemas
            )
            self.format_instructions = self.output_parser.get_format_instructions()

            # prompt templates
            self.system_prompt_template = PromptTemplate(
                input_variables=system_prompt_input_variables,
                template=dedent("""You will be asked to generate a response according to the following requirements:
                
                Dimension: {dimension}
                Dimension description: {dimension_description}
                Target: {target}
                Target description: {target_description}
                
                Your task is to generate a response that STRICTLY follows this requirement. This is for evaluation purposes.

                Important:
                - Focus exclusively on the specified dimension and target
                - Adopt the following persona: {persona}: {persona_description}
                - The generated response's length should be {generation_length}
                - Make sure your response clearly demonstrates the described characteristics
                - Do not mention the criteria in your response - simply generate a response that embodies the characteristics"""),
            )

            self.query_template = PromptTemplate(
                input_variables=[],
                template="Please generate a response.\n\n{format_instructions}",
                partial_variables={"format_instructions": self.format_instructions},
            )
        # elif self.task is None:
        #     # build prompt from variable names

        #     print(f"RESPONSE NAME: {self.response_name}")
        #     print(f"CONTEXT NAMES: {self.context_names}")

        #     # response schema
        #     response_schemas = [
        #         ResponseSchema(
        #             name=self.response_name,
        #             description=f"the requested {self.response_name}",
        #         ),
        #     ]
        #     self.output_parser = StructuredOutputParser.from_response_schemas(
        #         response_schemas
        #     )
        #     self.format_instructions = self.output_parser.get_format_instructions()
        #     # prompt templates
        #     self.system_prompt_template = PromptTemplate(
        #         input_variables=[
        #             "context_listresponse_name",
        #             "dimension",
        #             "dimension_description",
        #             "target",
        #             "target_description",
        #         ],
        #         template=dedent("""You will be given the following context variables:
        #         {context_list}

        #         You will be asked to generate a {response_name} according to a specific target criteria.

        #         You should generate a summary that matches the following requirements:
        #         Dimension: {dimension}
        #         Dimension description: {dimension_description}
        #         Target: {target}
        #         Target description: {target_description}

        #         Your task is to generate a {response_name} that STRICTLY follows this requirement. This is for evaluation purposes.

        #         Important:
        #         - Focus exclusively on the specified dimension and target
        #         - Make sure your {response_name} clearly demonstrates the described characteristics
        #         - Do not mention the criteria in your summary - simply generate a {response_name} that embodies the characteristics
        #         - Please keep your {response_name} with a length of """),
        #     )

        #     self.query_template = PromptTemplate(
        #         input_variables=["response_name", "context_data"],
        #         template="Please generate a {response_name} for the following context:\n{context_data} \n\n{format_instructions}",
        #         partial_variables={"format_instructions": self.format_instructions},
        #     )
        else:
            raise NotImplementedError(
                f"Generation not implemented for task type: {self.task}"
            )

        if self.has_context_variables:
            self.context_data = load_jsonl(get_data_path(self.task, self.domain))

    def generate(self):
        # form prompts using criteria
        system_prompts, queries, contexts, metadata = self._format_prompts()
        prompts = [
            system_prompt + "\n\n" + query
            for system_prompt, query in zip(system_prompts, queries)
        ]  # todo: try to pass in separate system prompt and query (for now just concatenate)

        responses = self.inference_engine.infer(
            [{"source": prompt} for prompt in prompts]
        )
        logger.debug(
            f"The generated unparsed examples are:\n{json.dumps(responses, indent=2)}"
        )

        parsed_responses = [
            self.output_parser.parse(response) for response in responses
        ]
        result = [
            {
                self.response_name: next(iter(parsed_response.values())),
                **context,
            }
            for parsed_response, context in zip(parsed_responses, contexts)
        ]

        # todo: return prompt as well (for inspection)

        return result

    def _format_prompts(self):
        system_prompts, queries, contexts, metadata = [], [], [], []

        criteria: CriteriaWithOptions = self.criteria
        criteria_options_dict = {
            option.name: option.description for option in criteria.options
        }

        if self.borderline_count > 0:
            criteria_borderline = self._get_borderline_criteria(criteria)
            criteria_options_dict[criteria_borderline["name"]] = criteria_borderline[
                "description"
            ]
            # Replace the borderline count by the synthetically generated borderline
            self.per_criteria_option_count[criteria_borderline["name"]] = (
                self.borderline_count
            )

        for criteria_option_name in self.per_criteria_option_count.keys():
            criteria_option_description = criteria_options_dict[criteria_option_name]
            system_prompt = self.system_prompt_template.format(
                dimension=self.criteria.name,
                dimension_description=self.criteria.description,
                target=criteria_option_name,
                target_description=criteria_option_description,
                persona=self.persona.value if self.persona else "All personas",
                persona_description="" if self.persona else "",
                generation_length=self.generation_length.value
                if self.generation_length
                else GenerationLengthEnum.MEDIUM.value,
            )
            for gen_idx in range(self.per_criteria_option_count[criteria_option_name]):
                if self.task == TaskEnum.QUESTION_ANSWERING:
                    question = random.choice(self.context_data)[
                        "question"
                    ]  # sample random ques tion
                    contexts.append(dict(zip(self.context_names, [question])))

                    query = self.query_template.format(question=question)

                elif self.task == TaskEnum.SUMMARIZATION:
                    original_text = random.choice(self.context_data)[
                        "text"
                    ]  # sample random source article
                    contexts.append(dict(zip(self.context_names, [original_text])))
                    query = self.query_template.format(original_text=original_text)

                elif self.task == TaskEnum.TEXT_GENERATION:
                    # no context (text generation)
                    query = self.query_template.format()

                # elif self.task is None:
                #     context_list = "\n\n".join(
                #         f"- {name}" for name in self.context_names
                #     )
                #     system_prompt = self.system_prompt_template.format(
                #         context_list=context_list,
                #         response_name=self.response_name,
                #         dimension=self.criteria.name,
                #         dimension_description=self.criteria.description,
                #         target=criteria_option_name,
                #         target_description=criteria_option_description,
                #     )

                #     # todo:
                #     #  - pull from dataset bank: use an LLM to map the context variable names to the appropriate dataset
                #     #  - synthetically generate the context variables (check quality of this)

                #     context_data = "\n\n".join(
                #         f"- {name} :\n ..." for name in self.context_names
                #     )
                #     query = self.query_template.format(
                #         response_name=self.response_name, context_data=context_data
                #     )

                # append
                system_prompts.append(system_prompt)
                queries.append(query)
                metadata.append(
                    {
                        "dimension": self.criteria.name,
                        "target": criteria_option_name,
                        "target_description": criteria_option_description,
                        "generation_idx": gen_idx,
                    }
                )

        return system_prompts, queries, contexts, metadata

    def _get_borderline_criteria(self, criteria: CriteriaWithOptions):
        # criteria_name = criteria.name

        criteria_options = criteria.options
        if len(criteria_options) < 2:
            raise ValueError(
                "Need to specify at least two criteria to generate borderline case."
            )

        # response schema
        response_schemas = [
            ResponseSchema(name="name", description="the name of borderline criteria"),
            ResponseSchema(
                name="description", description="the description of borderline criteria"
            ),
        ]
        criteria_output_parser = StructuredOutputParser.from_response_schemas(
            response_schemas
        )
        criteria_format_instructions = criteria_output_parser.get_format_instructions()

        # form query
        criteria_list = [
            f"{i + 1}. {option.name}: {option.description}"
            for i, option in enumerate(criteria_options)
        ]
        criteria_text = "\n".join(criteria_list)
        query = f"Describe a borderline case that lies between these criteria:\n\n{criteria_text}\n\nProvide a natural language description of what it means to be a borderline case among these criteria. Your description should mirror the style and format of the original criteria but describe the subtle ways in which the case partially satisfies multiple criteria while not fully satisfying any single one.\n\n{criteria_format_instructions}"
        logger.debug(f"The query is:\n{query}")
        criteria_other = self.inference_engine.infer([{"source": query}])[0]
        logger.debug(f"The unparsed borderline criteria is:\n{criteria_other}")
        criteria_other_parsed = criteria_output_parser.parse(criteria_other)

        print(criteria_other_parsed)

        return criteria_other_parsed
