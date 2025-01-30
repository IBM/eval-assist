import numpy as np

from langchain.prompts import PromptTemplate
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from machine_labeler.utils.labeling_utils import (filter_rubrics,
                                                  apply_model_template,
                                                  format_input,
                                                  get_criteria_block)


class PromptFormatter:
    def __init__(self,
                 instruction,
                 rubrics,
                 templates,
                 template_category,
                 num_samples,
                 examples,
                 num_examples_per_crit,
                 shuffle_criteria,
                 example_selector,
                 output_format):
        self.instruction = instruction
        self.rubrics = rubrics
        self.templates = templates
        self.template_category = template_category
        self.num_samples = num_samples
        self.examples = examples
        self.num_examples_per_crit = num_examples_per_crit
        self.shuffle_criteria = shuffle_criteria
        self.example_selector = example_selector

        self.format_instructions = StructuredOutputParser.from_response_schemas(output_format).get_format_instructions()

        self.system_prompt_template = PromptTemplate(
            template=templates['system_prompt_template'],
            input_variables=["requirement", "criteria", "examples_block"]
        )

        self.query_template = PromptTemplate(
            template=templates['query_template'],
            input_variables=["instruction", "input_to_label"]
        )

    def get_prompts(self, input_data):

        # enumerate over input data
        prompts = []
        for _, row in input_data.iterrows():

            # extract type(s) of current row
            input_types = {
                k.removeprefix('type_'): v
                for k, v in row.items()
                if k.startswith('type_')
            }

            # extract examples that match types
            if self.examples is not None:
                conditions = [(self.examples[f'type_{k}'] == v) for k, v in input_types.items()]
                example_pool = self.examples[np.logical_and.reduce(conditions)]

            # todo: filter rubrics by input types if specified, default to all unless specified
            rubrics_filtered = filter_rubrics(self.rubrics, input_types)

            for rubric_name, rubric_dict in rubrics_filtered.items():

                # construct examples_block
                # todo: ensure num_samples still works even in case where no examples are provided
                if self.examples is not None:
                    examples = self.example_selector.select_examples(example_pool=example_pool,
                                                                     rubric_name=rubric_name,
                                                                     rubric_dict=rubric_dict,
                                                                     num_examples_per_crit=self.num_examples_per_crit,
                                                                     num_samples=self.num_samples)
                    examples_blocks = self._format_examples(examples)
                else:
                    examples_blocks = [""]

                for examples_block in examples_blocks:

                    system_prompt = self.system_prompt_template.format(
                        requirement=rubric_dict['requirement'],
                        criteria=get_criteria_block(rubric_dict, self.shuffle_criteria),
                        examples_block=examples_block
                    )

                    query = self.query_template.format(
                        instruction=self.instruction,
                        input_to_label=format_input(row),
                        format_instructions=self.format_instructions
                    )

                    prompt = apply_model_template(system_prompt, query, self.template_category)
                    prompts.append(prompt)

        return prompts

    def _format_examples(self, examples):

        nl = '\n'
        examples_blocks = []
        for example in examples:
            example_block = "To assist in the scoring exercise, some labeled examples are provided below:\n\n"
            for rubric_name, example_dict in example.items():
                for criterion, example_ids in example_dict.items():
                    # example_block += f"Examples for {criterion}:\n"
                    for example_id in example_ids:
                        example_data = self._get_example(example_id)

                        label = example_data[f"label_{rubric_name}"].iloc[0]

                        example_block += f"<example>"
                        example_block += f"""{nl}{format_input(example_data)}"""
                        example_block += f"{nl}<label>{label}</label>"
                        example_block += f"{nl}</example>{nl}{nl}"

            examples_blocks.append(example_block)

        return examples_blocks

    def _get_example(self, example_id):
        return self.examples[self.examples['id'] == example_id]

    # def _prepare_prompts(self, system_prompts, queries, indices):
    #     return [
    #         self._apply_model_template(
    #             system_prompts[i],
    #             queries[i],
    #             self.model_config['template-type']
    #         ) for i in indices
    #     ]

    # for examples_df, example_ids in examples_sets:
    #     examples_block = self._format_examples(examples_df) if not examples_df.empty else ""
    #
    #     prompt = {
    #         'system_prompt': self._format_system_prompt(rubric,
    #                                                     examples_block),
    #         'query': self._format_query(input_row),
    #         'metadata': {
    #             'input_id': input_row['id'],
    #             'rubric_name': rubric_name,
    #             'example_ids': example_ids
    #         }
    #     }
    #     prompts.append(prompt)
