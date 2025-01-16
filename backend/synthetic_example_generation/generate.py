from langchain.prompts import PromptTemplate
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
from model import Model
# from _archive.liberated_model import LiberatedModel
from utils.data_utils import load_jsonl, save_to_jsonl
import os


class Generator:

    def __init__(self,
                 config,
                 generation_type):

        self.config = config
        self.generation_type = generation_type

        # configs
        experiment_config = config['experiments'].get(self.generation_type)
        if not experiment_config:
            raise ValueError(f"no experiment configuration found for task type: {self.generation_type}")

        self.generation_config = experiment_config['generation-config']
        self.task_type = self.generation_config.get('task-type', "")
        self.use_liberated_model = self.generation_config.get('use-liberated-model', False)
        self.rubric = self.generation_config.get('rubric', {})

        # generation parameters
        generation_params = config['defaults']['generation-params']
        if self.task_type == "text":
            task_params = generation_params['text-params']
        elif self.task_type == "qa":
            task_params = generation_params['qa-params']
        elif self.task_type == "summarization":
            task_params = generation_params['summarization-params']
        else:
            raise ValueError(f"unknown task type: {self.task_type}")

        self.num_generations_per_criteria = task_params['num-generations-per-criteria']
        self.min_new_tokens = task_params['min_new_tokens']
        self.max_new_tokens = task_params['max_new_tokens']
        self.temperature = task_params['temperature']

        # load source data (for tasks that require it)
        if self.task_type in ["qa", "summarization"]:
            self.num_sources = task_params['num-sources']
            self.source_data = load_jsonl(task_params['source-data'], n=self.num_sources)

        # init generator
        if self.task_type == "text":
            self._init_text()
        elif self.task_type == "qa":
            self._init_qa()
        elif self.task_type == "summarization":
            self._init_summarization()
        else:
            raise ValueError(f"task type not implemented: {self.task_type}")

        # model
        # self.model = LiberatedModel(self.config) if self.use_liberated_model else Model(self.config)
        self.model = Model(self.config, generation_type)

    def _init_text(self):

        # response schema
        response_schemas = [
            ResponseSchema(name="sentence", description="the requested sentence"),
        ]
        self.output_parser = StructuredOutputParser.from_response_schemas(response_schemas)
        self.format_instructions = self.output_parser.get_format_instructions()

        # prompt templates
        self.system_prompt_template = PromptTemplate(
            input_variables=["dimension", "target", "target_description", "max_new_tokens"],
            template="""You will asked to generate a sentence according to the following requirements:
Dimension: {dimension}
Target: {target}
Description: {target_description}

Your task is to generate a sentence that STRICTLY follows this requirement. This is for evaluation purposes.

Important:
- Focus exclusively on the specified dimension and target
- Make sure your sentence clearly demonstrates the described characteristics
- Do not mention the criteria in your sentence - simply generate a sentence that embodies the characteristics"""
        )

        self.query_template = PromptTemplate(
            input_variables=[],
            template="Please generate a sentence.\n\n{format_instructions}",
            partial_variables={"format_instructions": self.format_instructions}
        )

    def _init_qa(self):

        # response schema
        response_schemas = [
            ResponseSchema(name="answer", description="answer to the question"),
        ]
        self.output_parser = StructuredOutputParser.from_response_schemas(response_schemas)
        self.format_instructions = self.output_parser.get_format_instructions()

        # prompt templates
        self.system_prompt_template = PromptTemplate(
            input_variables=["dimension", "target", "target_description", "max_new_tokens"],
            template="""You will asked to generate an answer to a question according to the following requirements:
Dimension: {dimension}
Target: {target}
Description: {target_description}

Your task is to generate an answer that STRICTLY follows this requirement. This is for evaluation purposes.

Important:
- Focus exclusively on the specified dimension and target
- Make sure your answer clearly demonstrates the described characteristics
- Do not mention the criteria in your answer - simply generate an answer to the question that embodies the characteristics"""
        )

        self.query_template = PromptTemplate(
            input_variables=["question"],
            template="Please generate an answer to the following question:\n\n{question}\n\n{format_instructions}",
            partial_variables={"format_instructions": self.format_instructions}
        )

    def _init_summarization(self):

        # response schema
        response_schemas = [
            ResponseSchema(name="summary", description="summary of the source text"),
        ]
        self.output_parser = StructuredOutputParser.from_response_schemas(response_schemas)
        self.format_instructions = self.output_parser.get_format_instructions()

        # prompt templates
        self.system_prompt_template = PromptTemplate(
            input_variables=["dimension", "target", "target_description", "max_new_tokens"],
            template="""You will be given some source text and will be asked to generate a summary according to a specific target criteria.

You should generate a summary that matches the following requirements:
Dimension: {dimension}
Target: {target}
Description: {target_description}

Your task is to generate a summary that STRICTLY follows this requirement, even if it means deliberately creating a summary that might seem suboptimal. This is for evaluation purposes.

Important:
- Focus exclusively on the specified dimension and target
- Make sure your summary clearly demonstrates the described characteristics
- Do not mention the criteria in your summary - simply generate a summary that embodies the characteristics
- Please keep your summary less than {max_new_tokens} tokens"""
)

        self.query_template = PromptTemplate(
            input_variables=["original_text"],
            template="Please summarize the following text:\n\n{original_text}\n\n{format_instructions}",
            partial_variables={"format_instructions": self.format_instructions}
        )

    def generate(self):

        system_prompts, queries, metadata = self._format_prompts()
        if self.task_type == "":
            raise ValueError("please specify a task_type in experiment.generation-config.")

        # generate responses
        kwargs = {
            'min_new_tokens': self.min_new_tokens,
            'max_new_tokens': self.max_new_tokens,
            'temperature': self.temperature,
        }
        responses = self.model.generate_responses(system_prompts, queries, kwargs)

        # collect responses with metadata
        generations = [
            {**metadatum, **response}
            for metadatum, response in zip(metadata, responses)
            if isinstance(response, dict)
        ]

        # save generations
        save_to_jsonl(generations, os.path.join("out",
                                                self.task_type,
                                                self.generation_type,
                                                self.model.model_id,
                                                "generations.jsonl"))

        return generations

    def _format_prompts(self):

        system_prompts, queries, metadata = [], [], []

        if self.task_type == "text":

            system_prompts, queries, metadata = [], [], []

            for dimension, criteria_dict in self.rubric.items():

                # # add "other" category, todo: use language model to phrase this
                # __
                # criteria_dict["other"] = "Borderline among the other categories."

                for target, target_description in criteria_dict.items():
                    for gen_idx in range(self.num_generations_per_criteria):
                        system_prompt = self.system_prompt_template.format(
                            dimension=dimension,
                            target=target,
                            target_description=target_description,
                            max_new_tokens=self.max_new_tokens
                        )

                        query = self.query_template.format()

                        system_prompts.append(system_prompt)
                        queries.append(query)
                        metadata.append({
                            "dimension": dimension,
                            "target": target,
                            "target_description": target_description,
                            "generation_idx": gen_idx,
                        })

            return system_prompts, queries, metadata

        elif self.task_type == "qa":

            system_prompts, queries, metadata = [], [], []

            for source in self.source_data:
                for dimension, criteria_dict in self.rubric.items():
                    for target, target_description in criteria_dict.items():
                        for gen_idx in range(self.num_generations_per_criteria):
                            system_prompt = self.system_prompt_template.format(
                                dimension=dimension,
                                target=target,
                                target_description=target_description,
                                max_new_tokens=self.max_new_tokens
                            )

                            query = self.query_template.format(
                                question=source['question']
                            )

                            system_prompts.append(system_prompt)
                            queries.append(query)
                            metadata.append({
                                "dimension": dimension,
                                "target": target,
                                "target_description": target_description,
                                "source_id": source['id'],
                                "question": source['question'],
                                "generation_idx": gen_idx,
                            })

            return system_prompts, queries, metadata

        elif self.task_type == "summarization":

            for source in self.source_data:
                for dimension, criteria_dict in self.rubric.items():
                    for target, target_description in criteria_dict.items():
                        for gen_idx in range(self.num_generations_per_criteria):
                            system_prompt = self.system_prompt_template.format(
                                dimension=dimension,
                                target=target,
                                target_description=target_description,
                                max_new_tokens=self.max_new_tokens
                            )

                            query = self.query_template.format(
                                original_text=source['text']
                            )

                            system_prompts.append(system_prompt)
                            queries.append(query)
                            metadata.append({
                                "dimension": dimension,
                                "target": target,
                                "target_description": target_description,
                                "source_id": source['id'],
                                "source_text": source['text'],
                                "generation_idx": gen_idx,
                            })

            return system_prompts, queries, metadata
