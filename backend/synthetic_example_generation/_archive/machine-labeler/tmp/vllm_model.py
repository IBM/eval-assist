import json
import os
from dotenv import load_dotenv
from genai import Credentials, Client
from langchain_core.prompts import PromptTemplate
from langchain.output_parsers.structured import ResponseSchema, StructuredOutputParser
from tqdm import tqdm

from src.machine_labeler import BaseModel
from src.machine_labeler.utils.data_utils import (get_unlabeled_ids,
                                                  get_examples_pool,
                                                  save_results,
                                                  save_ids)
from src.machine_labeler.utils.labeling_utils import (extract_examples,
                                                      get_criteria_block,
                                                      format_query,
                                                      format_prompt)


class IBMBAMModel(BaseModel):
    def __init__(self,
                 model_id,
                 output_format,
                 config):
        super().__init__(model_id, output_format, config)
        self.model_id = model_id
        self.output_format = output_format
        self.config = config

        # client params
        load_dotenv(dotenv_path=os.path.abspath(f"../api_keys/{config['dotenv']}"))
        credentials = Credentials.from_env()
        self.client = Client(credentials=credentials)
        self.execution_options = self.config['execution-options']
        self.parameters = self.config['parameters']

        # labeling options
        self.shuffle_criteria = self.config['shuffle-criteria']

        # output format
        response_schema = [ResponseSchema(name=field['name'], description=field['description'])
                           for field in self.output_format]
        self.output_parser = StructuredOutputParser.from_response_schemas(response_schema)

    def call(self,
             data_unlabeled,
             instruction,
             rubrics,
             templates,
             data_examples,
             num_example_samples,
             num_prompt_samples,
             save_dir=None):

        system_prompt_template_object = PromptTemplate(
            template=templates['system_prompt_template'],
            input_variables=["requirement",
                             "criteria",
                             "examples"]
        )
        query_template_object = PromptTemplate(
            template=templates['query_template'],
            input_variables=["input_to_label"],
            partial_variables={"format_instructions": self.output_parser.get_format_instructions()}
        )

        # define input_names_list and input_types_list from columns
        input_names_list = [col.removeprefix('input_') for col in data_unlabeled.columns if col.startswith('input_')]
        input_types_list = [col.removeprefix('type_') for col in data_unlabeled.columns if col.startswith('type_')]

        # form examples_pool from examples dataframe
        if len(data_examples) > 0:
            examples_pool = get_examples_pool(examples=data_examples,
                                              rubrics=rubrics)
            if num_example_samples and not examples_pool:
                raise Exception("num_example_samples is positive but no examples have been provided.")

        # set unlabeled_ids (retrieve from save_dir if specified)
        if save_dir:
            unlabeled_ids = get_unlabeled_ids(data_unlabeled, save_dir)
        else:
            unlabeled_ids = set(data_unlabeled['id'])

        # check if all data labeled
        if not unlabeled_ids:
            raise ValueError("All data labeled.")

        # label inputs
        results_list = []
        while unlabeled_ids:

            # form batches
            num_inputs_per_batch = 10  # setting > 1 may overload model API
            data_unlabeled_valid = data_unlabeled[data_unlabeled['id'].isin(unlabeled_ids)]
            inputs_to_label = data_unlabeled_valid.sample(min(num_inputs_per_batch, len(data_unlabeled_valid)))

            # label batches
            criteria_keys = []
            prompts = []
            examples_list = []
            request_ids = []
            for _, input_to_label in inputs_to_label.iterrows():
                type_assignment = {k: v for k, v in input_to_label.items() if k.startswith('type_')}
                for rubric_name, rubric_dict in rubrics.items():
                    for n in range(num_prompt_samples):

                        if num_example_samples:
                            examples_formatted, example_ids = extract_examples(examples_pool[rubric_name],
                                                                               input_names_list,
                                                                               type_assignment,
                                                                               num_example_samples)
                            examples_list.append({'example_ids': example_ids})
                            # todo: check for empty examples
                        else:
                            examples_formatted = ""
                            examples_list.append({'example_ids': []})

                        criteria_block, criteria_order = get_criteria_block(rubric=rubric_dict,
                                                                            shuffle_criteria=self.shuffle_criteria)
                        system_prompt = system_prompt_template_object.format(requirement=rubric_dict['requirement'],
                                                                             criteria=criteria_block,
                                                                             examples=examples_formatted)

                        query = format_query(template=query_template_object,
                                             instruction=instruction,
                                             input_to_label=input_to_label,
                                             input_names_list=input_names_list,
                                             input_types_list=input_types_list)

                        request_ids.append({
                            "input_id": input_to_label['id'],
                            "rubric": rubric_name,
                            "criteria_order": criteria_order,
                            "sample": n
                        })
                        criteria_keys.append(rubric_dict['criteria'].keys())
                        prompts.append(format_prompt(system_prompt=system_prompt,
                                                     query=query,
                                                     template_category=self.config['prompt-template-category']))

            # todo: prompts will be identical across num_eval_samples if no examples provided and shuffle_criteria=False
            #  - don't call model multiple times in this case, only decode from probability output multiple times

            # call model
            responses, _, success_rate = self._retry_call(prompts=prompts,
                                                          rubrics=rubrics,
                                                          output_format=self.output_format)
            results = [{**response, **example, **request_id}
                       for response, example, request_id in zip(responses, examples_list, request_ids)]

            # update unlabeled_ids and results_list
            unlabeled_ids = unlabeled_ids - set(inputs_to_label['id'])
            results_list.append(results)

            if save_dir:
                output_columns = [output['name'] for output in self.output_format]
                save_results(inputs_to_label, results, output_columns, save_dir)
                save_ids(inputs_to_label, save_dir)

        return results_list

    def _retry_call(self, prompts, rubrics, output_format):
        try:
            return self._call_model(prompts, rubrics, output_format)
        except Exception as e:
            print(f"attempt failed with error: {e}")

    def _call_model(self, prompts, rubrics, output_format, max_attempts=10):
        prompt_ids = list(range(len(prompts)))
        outputs = dict.fromkeys(prompt_ids)
        num_batch_attempts = 0
        num_calls = 0
        num_failures = 0
        while prompt_ids and num_batch_attempts < max_attempts:
            num_calls += len(prompt_ids)
            for idx, output in tqdm(
                    enumerate(
                        self.client.text.generation.create(
                            model_id=self.model_id,
                            inputs=[prompts[i] for i in prompt_ids],
                            execution_options={**self.execution_options},
                            parameters={**self.parameters}
                        )
                    ),
                    total=len(prompt_ids),
                    desc="labeling batch"
            ):
                outputs[prompt_ids[idx]] = output.results[0].generated_text

            prompt_ids, data_dicts = self._parse_outputs(outputs, rubrics, output_format)
            num_batch_attempts += 1

            if prompt_ids:
                num_failures += len(prompt_ids)
                print(f"\nfailed to parse {len(prompt_ids)} output(s). Relabeling...")

        success_rate = 1 - num_failures / num_calls
        responses = [data_dict[i] for i, data_dict in enumerate(data_dicts)]

        return responses, prompt_ids, success_rate

    def _parse_outputs(self, outputs, rubrics, output_format):
        data_dicts = []
        retry_ids = []
        for idx, output in outputs.items():
            try:
                data = output.split('```json')[1].split('```')[0]  # note: `json works better than ```json
                data_dict = json.loads(data)
                # if not data_dict.keys() == {field['name'] for field in output_format}:
                #     __
                #     raise ValueError("invalid keys in parsed json")
                if not data_dict.keys() == {field['name'] for field in output_format}:
                    raise ValueError("invalid keys in parsed json")
                data_dicts.append({idx: data_dict})
            except:
                retry_ids.append(idx)
                data_dicts.append({idx: {}})

        return retry_ids, data_dicts

    # @staticmethod
    # def _parse_outputs(outputs):
    #     data_dicts = []
    #     retry_ids = []
    #     for idx, output in outputs.items():
    #         try:
    #             data = output.split('```json')[1].split('```')[0]  # note: `json works better than ```json
    #             data_dict = json.loads(data)
    #             data_dicts.append({idx: data_dict})
    #             # todo: check that value in 'score' key matches one of the criteria keys
    #         except:
    #             retry_ids.append(idx)
    #             data_dicts.append({idx: {}})
    #
    #     return retry_ids, data_dicts
    #     # parsed_output = self.output_parser.parse(json_data)
    #     # todo: implement parsing via LLMChain
