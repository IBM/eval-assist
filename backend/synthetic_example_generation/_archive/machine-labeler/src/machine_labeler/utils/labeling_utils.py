import pandas as pd
import random
from textwrap import dedent


def load_templates():
    system_prompt_template = dedent("""
    You will be asked to evaluate some text according to the requirement: {requirement}
    
    When assigning your score, please use the following criteria:
    {criteria}
    
    {examples_block}""")

    query_template = dedent("""
    {instruction}
    
    {input_to_label}
    
    {format_instructions}""")

    return {
        "system_prompt_template": system_prompt_template,
        "query_template": query_template
    }


def format_query(template, instruction, input_to_label, input_names_list, input_types_list):
    type_mapping = {type_name: input_to_label[f"type_{type_name}"] for type_name in input_types_list}
    return template.format(instruction=instruction.format_map(type_mapping),
                           input_to_label=format_input(input_to_label,
                                                       input_names_list))


def filter_rubrics(rubrics, input_types):
    # todo: implement filtering
    return rubrics


def apply_model_template(system_prompt, query, template_category):
    if template_category == "llama-2":
        return f"""<s>[INST] <<SYS>>\n\u007b\u007b{system_prompt}\u007d\u007d<</SYS>>\n\n\u007b\u007b{query}\u007d\u007d[/INST]"""
    elif template_category == "llama-3":
        return f"""<|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|>\n<|start_header_id|>user<|end_header_id|>\n\n{query}<|eot_id|>\n<|start_header_id|>assistant<|end_header_id|>"""
    elif template_category == "mistral":
        return f"<s> [INST] {system_prompt} [/INST] {query} </s>"
    elif template_category == "gpt":
        return f"""[SYSTEM]\n{system_prompt}\n\n[USER]\n{query}\n\n[END]"""
    else:
        raise ValueError(f"Unsupported prompt template category: {template_category}")

    # if template_category == "llama-3":
    #     return f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|>\n<|start_header_id|>user<|end_header_id|>\n\n{query}<|eot_id|>\n<|start_header_id|>assistant<|end_header_id|>\n\n"""
    # elif template_category == "mistral":
    #     return f"<s>[INST] {system_prompt}[/INST] </s>[INST] {query} [/INST] "
    # else:
    #     raise ValueError(f"unsupported prompt template category: {template_category}")


def get_criteria_block(rubric, shuffle_criteria):

    criteria_dict = rubric['criteria']
    if shuffle_criteria:
        items = list(criteria_dict.items())
        random.shuffle(items)
        shuffled_criteria = dict(items)
    else:
        shuffled_criteria = criteria_dict
    criteria_string = _string_from_dict(shuffled_criteria)

    if "labeling_notes" in rubric:
        criteria_string += "\n\n" + "\n".join(rubric['labeling_notes'])

    return criteria_string  # , list(shuffled_criteria.keys()) todo: incorporate this functionality


def _string_from_dict(input_dict, valid_keys=None):
    # todo: do we need to explicitly define the key order?
    if valid_keys is None:
        valid_keys = input_dict.keys()
    formatted_string = [f"{key}: {input_dict[key]}" for key in input_dict if key in valid_keys]
    return '\n'.join(formatted_string)


def process_input_name(name):
    if "_" in name:
        parts = name.split("_")
        return " ".join([part.capitalize() for part in parts])
    else:
        return name.capitalize()


def extract_examples(examples_pool, input_names_list, type_assignment, num_example_samples):

    def _filter_by_type(examples_pool, input_types):
        pool_filtered = {}
        for key, examples in examples_pool.items():
            filtered_examples = [example for example in examples if all(example.get(k) == v for k, v in input_types.items() if k.startswith('type_'))]
            if filtered_examples:
                pool_filtered[key] = filtered_examples
        return pool_filtered

    examples_pool = _filter_by_type(examples_pool, type_assignment)

    # todo: add "type" header to example text?

    examples_formatted = "To assist in the scoring exercise, some examples are provided below:\n\n"
    example_ids = {}
    for criterion, examples_list in examples_pool.items():
        examples_formatted += f"EXAMPLES FOR CRITERION: {criterion}\n\n"
        examples_sampled_dict = random.sample(examples_list, num_example_samples)
        example_ids[criterion] = []
        for i, example in enumerate(examples_sampled_dict):
            score_text = ""
            example_ids[criterion].append(example['id'])
            for input_name in input_names_list:
                example_col = f"input_{input_name}"
                score_text += f"{process_input_name(input_name)}: {example[example_col]}\n"
            examples_formatted += f"Example #{i} for score: {criterion}\n{score_text}\n"

    return examples_formatted, example_ids


def format_input(data):
    if isinstance(data, pd.DataFrame):
        input_names = [col.strip('input_') for col in data.columns if col.startswith('input_')]
        return '\n'.join(
            f'<{input_name}>{data[f"input_{input_name}"].iloc[0]}</{input_name}>'
            for input_name in input_names
        )
    elif isinstance(data, pd.Series):
        input_names = [col.strip('input_') for col in data.index if col.startswith('input_')]
        return '\n'.join(
            f'<{input_name}>{data[f"input_{input_name}"]}</{input_name}>'
            for input_name in input_names
        )

# def format_input(input_to_label, input_names):
#     input_strings = []
#     for input_name in input_names:
#         input_strings.append(process_input_name(input_name) + ": \n" + input_to_label[f"input_{input_name}"])
#     return "\n\n".join(input_strings)


# def _check_add_period(string):
#     if string:
#         if not string.endswith('.'):
#             return string + '.'
#         else:
#             return string


# def extract_judgements(judgements, criteria_keys):
#     judgements_formatted = ""
#     for i, judgement in enumerate(judgements):
#         judgements_formatted += f"Judgement #{i}:\n{_string_from_dict(judgement, criteria_keys)}\n\n"
#     return judgements_formatted + "\n\n"


# def self_review(inputs_to_label,
#                 model_id,
#                 labels,
#                 rubrics,
#                 input_format,
#                 output_parser,
#                 client,
#                 parameters):
#
#     # todo: check that explanation is present in output_format
#
#     labels_set = []
#     for i, datapoint_labels in enumerate(labels):
#         labels = {}
#         for rubric_name, rubric_labels in tqdm(datapoint_labels.items(), total=len(datapoint_labels.items()), desc="self_review"):
#             num_samples = len(rubric_labels)
#             system_prompt_review_template_object = PromptTemplate(
#                 template=system_prompt_review_template,
#                 input_variables=["num_samples",
#                                  "requirement",
#                                  "input_to_label",
#                                  "judgements"]
#             )
#             query_review_template_object = PromptTemplate(
#                 template=query_review_template,
#                 input_variables=["criteria"],
#                 partial_variables={"format_instructions": output_parser.get_format_instructions()}
#             )
#
#             requirement = rubrics[rubric_name]['requirement']
#             criteria = _string_from_dict(rubrics[rubric_name]['criteria'])
#             input_to_label = inputs_to_label[i]
#             system_prompt_review = system_prompt_review_template_object.format(num_samples=num_samples,
#                                                                                requirement=requirement,
#                                                                                input_to_label=input_format.format(**input_to_label),
#                                                                                judgements=_extract_judgements(rubric_labels, [schema.name for schema in output_parser.response_schemas]))
#             query_review = query_review_template_object.format(criteria=criteria)
#             prompt = _format_instruction(system_prompt_review, query_review)
#             result, _, _ = _retry_call(model_id, prompt, output_parser, client, parameters)
#             labels[rubric_name] = result
#
#         # todo: compute scores on examples
#
#         labels_set.append(labels)
#
#     return labels_set
