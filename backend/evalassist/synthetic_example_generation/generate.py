import json

# from model import Model
# from _archive.liberated_model import LiberatedModel
# from utils.data_utils import load_jsonl, save_to_jsonl
import logging
import random
from textwrap import dedent

from langchain.output_parsers import ResponseSchema, StructuredOutputParser
from langchain.prompts import PromptTemplate
from unitxt.llm_as_judge import CriteriaWithOptions

from ..utils import (
    get_evaluator_metadata_wrapper,
    get_inference_engine,
    get_model_name_from_evaluator,
)
from .utils.data_utils import load_jsonl

logger = logging.getLogger(__name__)


class Generator:
    def __init__(self, config):
        self.config = config

        self.model_config = config["model"]
        self.generation_config = config["generation"]
        self.criteria = self.generation_config["criteria"]
        # self.task_type = self.generation_config["task-type"]
        self.task_type = None  # todo: TEMP
        self.response_name = self.generation_config["response_name"]
        self.context_names = self.generation_config["context_names"]
        self.is_context = len(self.context_names) > 0
        self.context = {}

        if self.is_context:
            # response with context

            if self.task_type == "question_answering":
                self.context_data = load_jsonl(
                    "backend/src/synthetic_example_generation/data/qa/source_data/questions.jsonl"
                )

                # response schema
                response_schemas = [
                    ResponseSchema(
                        name="answer", description="the answer to the question"
                    ),
                ]
                self.output_parser = StructuredOutputParser.from_response_schemas(
                    response_schemas
                )
                self.format_instructions = self.output_parser.get_format_instructions()

                # prompt templates
                self.system_prompt_template = PromptTemplate(
                    input_variables=[
                        "dimension",
                        "dimension_description",
                        "target",
                        "target_description",
                        "max_new_tokens",
                    ],
                    template=dedent("""You will be asked to generate an answer to a question according to the following requirements:

                    Dimension: {dimension}  # noqa: W293
                    Dimension description: {dimension_description}
                    Target: {target}
                    Target description: {target_description}

                    Your task is to generate an answer that STRICTLY follows this requirement. This is for evaluation purposes.

                    Important:
                    - Focus exclusively on the specified dimension and target
                    - Make sure your answer clearly demonstrates the described characteristics
                    - Do not mention the criteria in your answer - simply generate an answer to the question that embodies the characteristics"""),
                )

                self.query_template = PromptTemplate(
                    input_variables=["question"],
                    template="Please generate an answer to the following question:\n\n{question}\n\n{format_instructions}",
                    partial_variables={"format_instructions": self.format_instructions},
                )

            elif self.task_type == "summarization":
                self.context_data = load_jsonl(
                    "backend/src/synthetic_example_generation/data/summarization/source_data/articles.jsonl"
                )

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
                    input_variables=[
                        "dimension",
                        "dimension_description",
                        "target",
                        "target_description",
                        "max_new_tokens",
                    ],
                    template=dedent("""You will be given some source text and will be asked to generate a summary according to a specific target criteria.

                    You should generate a summary that matches the following requirements:
                    Dimension: {dimension}  # noqa: W293
                    Dimension description: {dimension_description}
                    Target: {target}
                    Target description: {target_description}

                    Your task is to generate a summary that STRICTLY follows this requirement. This is for evaluation purposes.

                    Important:
                    - Focus exclusively on the specified dimension and target
                    - Make sure your summary clearly demonstrates the described characteristics
                    - Do not mention the criteria in your summary - simply generate a summary that embodies the characteristics
                    - Please keep your summary less than tokens"""),
                )

                self.query_template = PromptTemplate(
                    input_variables=["original_text"],
                    template="Please summarize the following text:\n\n{original_text}\n\n{format_instructions}",
                    partial_variables={"format_instructions": self.format_instructions},
                )

            elif self.task_type is None:
                # build prompt from variable names

                print(f"RESPONSE NAME: {self.response_name}")
                print(f"CONTEXT NAMES: {self.context_names}")

                # response schema
                response_schemas = [
                    ResponseSchema(
                        name=self.response_name,
                        description=f"the requested {self.response_name}",
                    ),
                ]
                self.output_parser = StructuredOutputParser.from_response_schemas(
                    response_schemas
                )
                self.format_instructions = self.output_parser.get_format_instructions()

                # prompt templates
                self.system_prompt_template = PromptTemplate(
                    input_variables=[
                        "context_listresponse_name",
                        "dimension",
                        "dimension_description",
                        "target",
                        "target_description",
                        "max_new_tokens",
                    ],
                    template=dedent("""You will be given the following context variables:
                    {context_list}
    
                    You will be asked to generate a {response_name} according to a specific target criteria.
    
                    You should generate a summary that matches the following requirements:
                    Dimension: {dimension}
                    Dimension description: {dimension_description}
                    Target: {target}
                    Target description: {target_description}
    
                    Your task is to generate a {response_name} that STRICTLY follows this requirement. This is for evaluation purposes.
    
                    Important:
                    - Focus exclusively on the specified dimension and target
                    - Make sure your {response_name} clearly demonstrates the described characteristics
                    - Do not mention the criteria in your summary - simply generate a {response_name} that embodies the characteristics
                    - Please keep your {response_name} less than {max_new_tokens} tokens"""),
                )

                self.query_template = PromptTemplate(
                    input_variables=["response_name", "context_data"],
                    template="Please generate a {response_name} for the following context:\n{context_data} \n\n{format_instructions}",
                    partial_variables={"format_instructions": self.format_instructions},
                )

            else:
                raise NotImplementedError(
                    f"Generation not implemented for task type: {self.task_type}"
                )

        else:
            # no context (text generation)

            # response schema
            response_variable_name = self.generation_config["response_variable_name"]
            response_schemas = [
                ResponseSchema(
                    name=response_variable_name,
                    description=f"the requested {response_variable_name}",
                ),
            ]
            self.output_parser = StructuredOutputParser.from_response_schemas(
                response_schemas
            )
            self.format_instructions = self.output_parser.get_format_instructions()

            # prompt templates
            self.system_prompt_template = PromptTemplate(
                input_variables=[
                    "dimension",
                    "dimension_description",
                    "target",
                    "target_description",
                    "max_new_tokens",
                ],
                template=dedent("""You will be asked to generate a response according to the following requirements:
                
                Dimension: {dimension}
                Dimension description: {dimension_description}
                Target: {target}
                Target description: {target_description}
                
                Please adopt the following persona: {persona}

                Your task is to generate a response that STRICTLY follows this requirement. This is for evaluation purposes.

                Important:
                - Focus exclusively on the specified dimension and target
                - Make sure your response clearly demonstrates the described characteristics
                - Do not mention the criteria in your response - simply generate a response that embodies the characteristics"""),
            )

            self.query_template = PromptTemplate(
                input_variables=[],
                template="Please generate a response.\n\n{format_instructions}",
                partial_variables={"format_instructions": self.format_instructions},
            )

        # intialize model
        evaluator_metadata = get_evaluator_metadata_wrapper(
            self.model_config["evaluator_name"],
            self.model_config["custom_model_name"],
        )
        model_name = get_model_name_from_evaluator(
            evaluator_metadata,
            self.model_config["provider"],
        )
        self.inference_engine = get_inference_engine(
            self.model_config["llm_provider_credentials"],
            self.model_config["provider"],
            model_name,
            custom_params={
                "use_cache": False,
                "seed": None,
                "max_tokens": 200,
                "temperature": 0.7,
            },
        )

    def generate(self):
        # form prompts using criteria
        system_prompts, queries, metadata = self._format_prompts()
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

        # print("RESPONSES")
        # print(responses)

        # parse the last response (the borderline case)
        parsed_response = self.output_parser.parse(responses[-1])

        # todo: return prompt as well (for inspection)

        return parsed_response, self.context

    def _format_prompts(self):
        system_prompts, queries, metadata = [], [], []

        criteria: CriteriaWithOptions = self.generation_config["criteria"]
        criteria_dict = {option.name: option.description for option in criteria.options}
        criteria_borderline = self._get_borderline_criteria(criteria)
        criteria_dict[criteria_borderline["name"]] = criteria_borderline["description"]

        generation_params = self.generation_config["gen_params"]

        for target, target_description in criteria_dict.items():
            for gen_idx in range(generation_params["num_generations_per_criteria"]):
                if self.is_context:
                    if self.task_type == "question_answering":
                        question = random.choice(self.context_data)[
                            "question"
                        ]  # sample random question
                        self.context = dict(zip(self.context_names, [question]))

                        system_prompt = self.system_prompt_template.format(
                            dimension=self.criteria.name,
                            dimension_description=self.criteria.description,
                            target=target,
                            target_description=target_description,
                            max_new_tokens=generation_params["max_new_tokens"],
                        )
                        query = self.query_template.format(question=question)

                    elif self.task_type == "summarization":
                        original_text = random.choice(self.context_data)[
                            "text"
                        ]  # sample random source article
                        self.context = dict(zip(self.context_names, [original_text]))

                        system_prompt = self.system_prompt_template.format(
                            dimension=self.criteria.name,
                            dimension_description=self.criteria.description,
                            target=target,
                            target_description=target_description,
                            max_new_tokens=generation_params["max_new_tokens"],
                        )
                        query = self.query_template.format(original_text=original_text)

                    elif self.task_type is None:
                        context_list = "\n\n".join(
                            f"- {name}" for name in self.context_names
                        )
                        system_prompt = self.system_prompt_template.format(
                            context_list=context_list,
                            response_name=self.response_name,
                            dimension=self.criteria.name,
                            dimension_description=self.criteria.description,
                            target=target,
                            target_description=target_description,
                            max_new_tokens=generation_params["max_new_tokens"],
                        )

                        # todo:
                        #  - pull from dataset bank: use an LLM to map the context variable names to the appropriate dataset
                        #  - synthetically generate the context variables (check quality of this)

                        context_data = "\n\n".join(
                            f"- {name} :\n ..." for name in self.context_names
                        )
                        query = self.query_template.format(
                            response_name=self.response_name, context_data=context_data
                        )

                else:
                    # no context (text generation)

                    system_prompt = self.system_prompt_template.format(
                        dimension=self.criteria.name,
                        dimension_description=self.criteria.description,
                        target=target,
                        target_description=target_description,
                        max_new_tokens=generation_params["max_new_tokens"],
                    )
                    query = self.query_template.format()

                # append
                system_prompts.append(system_prompt)
                queries.append(query)
                metadata.append(
                    {
                        "dimension": self.criteria.name,
                        "target": target,
                        "target_description": target_description,
                        "generation_idx": gen_idx,
                    }
                )

        return system_prompts, queries, metadata

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
