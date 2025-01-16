import os
import pandas as pd
import json
import numpy as np
import statistics
import yaml
from collections import Counter
from scipy.stats import entropy


def example_test_split(labeled_data_path,
                       rubrics,
                       examples_size=0):

    def get_majority_label(labels):
        count = Counter(labels)
        majority_label, _ = count.most_common(1)[0]
        return majority_label

    def get_label_agreement(labels):
        count = Counter(labels)
        majority_count = count.most_common(1)[0][1]
        agreement = majority_count / len(labels)
        return agreement

    # load labeled data
    labeled_data = pd.read_csv(labeled_data_path)

    # form example split
    type_cols = [col for col in labeled_data.columns if col.startswith('type_')]
    num_type_combs = 2 ** len(type_cols)
    num_criteria = sum([len(rubric_dict['criteria']) for _, rubric_dict in rubrics.items()])
    num_examples_per_criterion_per_type = round(len(labeled_data) * examples_size / (num_criteria * num_type_combs))
    examples_pool = {}
    for rubric_name, rubric_dict in rubrics.items():

        rubric_df = labeled_data.filter(like=rubric_name)
        criteria = rubric_dict['criteria'].keys()
        examples_pool[rubric_name] = {}

        if rubric_df.shape[1] > 1:
            # multiple ground-truth annotations for given rubric_name
            rubric_df['majority_label'] = rubric_df.apply(lambda row: get_majority_label(row.tolist()), axis=1)
            rubric_df['agreement'] = rubric_df.apply(lambda row: get_label_agreement(row.tolist()), axis=1)

            # todo: look for type columns

            for criterion in criteria:
                label_df = rubric_df[rubric_df['majority_label'] == criterion].copy()
                agree_df = label_df[label_df['agreement'] == 1.0]
                if len(agree_df) >= num_examples_per_criterion_per_type:
                    sampled_indices = agree_df.sample(num_examples_per_criterion_per_type).index
                else:
                    print(f"Warning: insufficient number of unanimous labels for criterion '{criterion}' in rubric '{rubric_name}'. Example pool will contain some lower certainty examples.")
                    sorted_df = label_df.sort_values(by='agreement', ascending=False)
                    sampled_indices = sorted_df.head(num_examples_per_criterion_per_type).index
                examples_pool[rubric_name][criterion] = labeled_data.loc[sampled_indices][['id', 'input_sentence']].to_dict(orient="records")

        else:
            # rubric_name has a single ground-truth annotation for each criterion
            # todo: check this case
            for criterion in criteria:
                label_df = rubric_df[rubric_df == criterion].copy()
                sampled_indices = label_df.sample(num_examples_per_criterion_per_type).index
                examples_pool[rubric_name][criterion] = labeled_data.loc[sampled_indices][['id', 'input_sentence']].to_dict(orient="records")

    input_cols = [col for col in labeled_data.columns if col.startswith('input_')]
    rows = []
    for rubric_name, criteria in examples_pool.items():
        for criterion, examples in criteria.items():
            for example in examples:
                row = {
                    "id": example["id"],
                    "input_sentence": example["input_sentence"],
                    f"label_{rubric_name}": criterion
                }
                rows.append(row)
    data_examples = pd.DataFrame(rows)

    # todo: need to split evenly by majority labels and type columns

    # populate test data with labeled data not used as examples
    example_ids = [
        example['id']
        for examples_dict in examples_pool.values()
        for examples in examples_dict.values()
        for example in examples
    ]
    data_test = labeled_data[~labeled_data['id'].isin(example_ids)][['id'
                                                                     '']]

    return (
        data_examples,
        data_test,
    )


def get_examples_pool(examples, rubrics):
    input_cols = [col for col in examples.columns if col.startswith('input_')]
    type_cols = [col for col in examples.columns if col.startswith('type_')]
    examples_pool = {}
    for rubric_name, rubric_dict in rubrics.items():
        criteria = list(rubric_dict['criteria'].keys())
        examples_pool[rubric_name] = {}
        for criterion in criteria:
            examples_pool[rubric_name][criterion] = examples[['id', *input_cols, *type_cols, f"label_{rubric_name}"]].loc[examples[f"label_{rubric_name}"] == criterion].to_dict(orient="records")
    return examples_pool


def get_evaluation(rubrics, data_test, labels_test):

    data_df = data_test  # already a df
    labels_df = pd.concat([pd.DataFrame(sublist) for sublist in labels_test], ignore_index=True)

    # compute accuracy
    accuracy = {}
    for rubric_name, rubric_dict in rubrics.items():
        rubric_df = data_df.filter(like=f"label_{rubric_name}")
        criteria = list(rubric_dict['criteria'])
        input_ids_list = list(set(labels_df['input_id']))
        if rubric_df.shape[1] > 1:
            # rubric_name has multiple ground-truth annotations for each criterion
            accuracy_scores = []
            for input_id in input_ids_list:
                data_labels = data_df.loc[data_df['id'] == input_id, rubric_df.columns].values[0]
                label_samples = labels_df.loc[labels_df['input_id'] == input_id, 'score'].tolist()
                accuracy_scores.append(1 - _jsd(data_labels, label_samples, criteria))
        else:
            # rubric_name has a single ground-truth annotation for each criterion
            accuracy_scores = []
            for input_id in input_ids_list:
                data_label = data_df.loc[data_df['id'] == input_id, rubric_df.columns].values[0]
                label_samples = labels_df.loc[labels_df['input_id'] == input_id, 'score'].tolist()
                accuracy_scores.append(label_samples.count(data_label[0]) / len(label_samples))

        # todo: if multiple types, compute overall accuracy and accuracy across types

        accuracy[rubric_name] = {
            'mean': statistics.mean(accuracy_scores),
            'std': statistics.stdev(accuracy_scores),
        }

    return {
        "accuracy": accuracy
    }


def _jsd(list1, list2, criteria):

    def _get_probabilities(list, criteria):
        probabilities = {criterion: 0 for criterion in criteria}
        N = len(list)
        for l in list:
            if l in probabilities:
                probabilities[l] += 1
        return np.array([probabilities[criterion] / N for criterion in criteria])

    p1 = _get_probabilities(list1, criteria)
    p2 = _get_probabilities(list2, criteria)
    m = p1 + p2
    return 0.5 * (entropy(p1, m) + entropy(p2, m))


def _print_label_balance(df):
    print('Balance computation to be implemented')
    # todo: implement


def get_unlabeled_ids(data_unlabeled, search_dir):
    file_path = os.path.join(search_dir, "labeled_ids.csv")
    if os.path.exists(file_path):
        df = pd.read_csv(file_path)
        labeled_ids = set(df['id'])
    else:
        labeled_ids = set()
    return set(data_unlabeled['id']) - labeled_ids


def get_unlabeled_inputs(data, num_rows, search_dir):
    if search_dir:
        try:
            labeled_ids = pd.read_csv(f"{search_dir}/labeled_ids.csv")
            data_unlabeled = data[~data['id'].isin(labeled_ids['id'])]
            inputs_to_label = data_unlabeled.sample(n=min(num_rows, len(data_unlabeled)))
        except FileNotFoundError:
            inputs_to_label = data
    else:
        inputs_to_label = data
    return inputs_to_label


def save_results(inputs_to_label, results, output_columns, save_dir):
    inputs_to_label_df = pd.DataFrame(inputs_to_label)
    results_df = pd.DataFrame(results)
    results_df = results_df.merge(inputs_to_label_df,
                                  how='left',
                                  left_on='input_id',
                                  right_on='id')
    results_df['example_ids'] = results_df['example_ids']  # .apply(lambda x: ', '.join(x))
    input_cols = [col for col in results_df.columns if col.startswith('input_')]
    label_cols = ['sample', 'example_ids', 'rubric', 'criteria_order', *output_columns]
    all_cols = input_cols + label_cols
    results_df = results_df[all_cols]
    results_df.drop(columns=['id'], inplace=True, errors='ignore')

    file_path = os.path.join(save_dir, "labels.csv")
    if os.path.exists(file_path):
        results_df_current = pd.read_csv(file_path)
        results_df = pd.concat([results_df_current, results_df])
    else:
        os.makedirs(save_dir, exist_ok=True)
    results_df.to_csv(file_path, index=False)


def save_ids(inputs_to_label, save_dir):
    file_path = os.path.join(save_dir, "labeled_ids.csv")
    if os.path.exists(file_path):
        df_ids = pd.read_csv(file_path)
        df_ids_new = pd.concat([df_ids, inputs_to_label[['id']]])
        df_ids_new = df_ids_new.drop_duplicates(subset=['id'])
    else:
        df_ids_new = inputs_to_label[['id']]
    df_ids_new.to_csv(file_path, index=False)


def load_config(filepath):
    with open(filepath, 'r') as file:
        data = yaml.safe_load(file)
    return data


def load_from_json(filename):
    with open(filename, 'r') as f:
        data = json.load(f)
    return data


def load_from_jsonl(filename, n=np.inf):
    data = []
    with open(filename, 'r') as f:
        for i, line in enumerate(f):
            if i >= n:
                break
            data.append(json.loads(line))
    return data
