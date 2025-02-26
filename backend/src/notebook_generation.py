import json

import nbformat as nbf

from .api.common import NotebookParams
from .utils import get_enum_by_value, get_inference_engine_params


def generate_direct_notebook(params: NotebookParams):
    inference_engine_params = get_inference_engine_params(
        provider=params.provider,
        evaluator_name=params.evaluator_name,
        credentials=params.credentials,
    )
    inference_engine_params_string = ",".join(
        [
            f"{k}={repr(v) if isinstance(v, str) else v}"
            for k, v in inference_engine_params.items()
        ]
    )

    input_fields = {k: "str" for k in params.context_variables[0].keys()}
    context_fields = list(params.context_variables[0].keys())

    nb = nbf.v4.new_notebook()

    title = f"# Unitxt direct evaluation notebook: {params.test_case_name}\n\nThis notebook was generated automatically from your EvalAssist test case '{params.test_case_name}'. It contains code to evaluate a set of responses using the specified criteria and evaluator. EvalAssist uses [unitxt](https://www.unitxt.ai/en/latest/index.html) to create and run the evaluations. You can find the documentation [here](https://www.unitxt.ai/en/latest/docs/llm_as_judge.html).\n\n"
    import_md = "### Import the necessary libraries"
    import_code = """
from unitxt.api import evaluate, create_dataset
from unitxt.inference import LiteLLMInferenceEngine
from unitxt.llm_as_judge import LLMJudgeDirect, EvaluatorNameEnum, CriteriaWithOptions
from unitxt.task import Task
import pandas as pd
import nest_asyncio
nest_asyncio.apply()
"""

    load_dataset_md = """### Loading the dataset
This code block creates a dataset from the context variables and the prediction. It simulates the sceario where the dataset is loaded from a csv file.
"""
    load_dataset_code = f"""context_variables = {json.dumps(params.context_variables, indent=4)}
predictions = {json.dumps(params.predictions, indent=4)}
dataset_rows = [instance_context_variable | {{"prediction": prediction}} for instance_context_variable, prediction in zip(context_variables, predictions)]
df = pd.DataFrame(dataset_rows)
# load a csv if data is stored in a csv file
# df = pd.read_csv(file_path)
"""

    load_criteria_md = """### Load the criteria
The criteria in a direct evaluation needs an option map that matches a string to a numerical value. Replace the NaN value of each option with your desire numerical value.
"""
    option_map_string = {
        option_name: float("nan")
        for option_name in [option["name"] for option in params.criteria["options"]]
    }

    load_criteria_code = f"""
criteria = {json.dumps(params.criteria, indent=4)}
option_map = {json.dumps(option_map_string, indent=4)}
criteria["option_map"] = option_map
criteria = CriteriaWithOptions.from_obj(criteria)
"""
    setup_md = """### Setup the evaluation
This code block creates the evaluator object of class _LLMJudgeDirect_. It then creates a dataset object from the context variables.
"""
    setup_code = f"""metric = LLMJudgeDirect(
    evaluator_name={f"EvaluatorNameEnum.{get_enum_by_value(params.evaluator_name).name}.name"},
    inference_engine=LiteLLMInferenceEngine({inference_engine_params_string}),
    criteria=criteria,
    context_fields={context_fields},
    criteria_field="criteria",
)
dataset_content = df.drop(columns=["prediction"]).to_dict(orient="records")
dataset = create_dataset(
    task=Task(
        input_fields={input_fields},
        reference_fields={{}},
        prediction_type=str,
        default_template="templates.empty",
        metrics=[metric],
    ),
    test_set=dataset_content,
    split="test")
"""
    evaluation_md = "### Evaluate the responses and print the results"
    evaluation_code = """predictions = df["prediction"].tolist()
results = evaluate(predictions=predictions, data=dataset)
print("Global Scores:")
print(results.global_scores)

print("Instance Scores:")
print(results.instance_scores)
"""

    nb.cells.append(nbf.v4.new_markdown_cell(title))
    nb.cells.append(nbf.v4.new_markdown_cell(import_md))
    nb.cells.append(nbf.v4.new_code_cell(import_code))
    nb.cells.append(nbf.v4.new_markdown_cell(load_dataset_md))
    nb.cells.append(nbf.v4.new_code_cell(load_dataset_code))
    nb.cells.append(nbf.v4.new_markdown_cell(load_criteria_md))
    nb.cells.append(nbf.v4.new_code_cell(load_criteria_code))
    nb.cells.append(nbf.v4.new_markdown_cell(setup_md))
    nb.cells.append(nbf.v4.new_code_cell(setup_code))
    nb.cells.append(nbf.v4.new_markdown_cell(evaluation_md))
    nb.cells.append(nbf.v4.new_code_cell(evaluation_code))

    return nb


def generate_pairwise_notebook(params: NotebookParams):
    inference_engine_params = get_inference_engine_params(
        provider=params.provider,
        evaluator_name=params.evaluator_name,
        credentials=params.credentials,
    )
    inference_engine_params_string = ",".join(
        [
            f"{k}={repr(v) if isinstance(v, str) else v}"
            for k, v in inference_engine_params.items()
        ]
    )

    input_fields = {k: "str" for k in params.context_variables[0].keys()}
    context_fields = list(params.context_variables[0].keys())

    nb = nbf.v4.new_notebook()

    title = f'# Unitxt pairwise evaluation notebook: {params.test_case_name}\n\nThis notebook was generated automatically from your EvalAssist test case "{params.test_case_name}". It contains code to evaluate a set of responses using the specified criteria and evaluator. EvalAssist uses [unitxt](https://www.unitxt.ai/en/latest/index.html) to create and run the evaluations. You can find the documentation [here](https://www.unitxt.ai/en/latest/docs/llm_as_judge.html).\n\n'
    import_md = "### Import the necessary libraries"
    import_code = """
from typing import List
from unitxt.api import evaluate, create_dataset
from unitxt.inference import LiteLLMInferenceEngine
from unitxt.llm_as_judge import LLMJudgePairwise, EvaluatorNameEnum, Criteria
from unitxt.task import Task
import pandas as pd
import nest_asyncio
nest_asyncio.apply()
"""

    load_dataset_md = """### Loading the dataset
This code block creates a dataset from the context variables and the prediction. It simulates the sceario where the dataset is loaded from a csv file.

_Note: in a pairwise dataset, each instance is composed by a context, a criteria and a list of responses. Therefore, this dataset is composed by just one instance._
"""

    system_predictions = [
        {
            f"system_{i + 1}": instance_predictions
            for i, instance_predictions in enumerate(instance_predictions)
        }
        for instance_predictions in params.predictions
    ]
    load_dataset_code = f"""context_variables = {json.dumps(params.context_variables, indent=4)}
system_predictions = {json.dumps(system_predictions, indent=4)}
dataset_rows = [instance_context_variable | instance_predictions for instance_context_variable, instance_predictions in zip(context_variables, system_predictions)]
df = pd.DataFrame(dataset_rows)
# load a csv if data is stored in a csv file
# df = pd.read_csv(file_path)
"""

    load_criteria_md = """### Load the criteria
The criteria in direct evaluation need an option map that matches a string to a numerical value. This code block creates an option map, but it may not be accurate as it assume equal distribution between 0 and 1 and ascending order.
"""
    load_criteria_code = (
        f"""criteria = Criteria.from_obj({json.dumps(params.criteria, indent=4)})"""
    )
    setup_md = """### Setup the evaluation
This code block creates the evaluator object of class _LLMJudgeDirect_. It then creates a dataset object from the context variables.
"""
    setup_code = f"""metric = LLMJudgePairwise(
    evaluator_name={f"EvaluatorNameEnum.{get_enum_by_value(params.evaluator_name).name}.name"},
    inference_engine=LiteLLMInferenceEngine({inference_engine_params_string}),
    criteria=criteria,
    context_fields={context_fields},
    criteria_field="criteria",
)
dataset_content = df.filter(regex=r"^(?!system_)").to_dict(orient="records")
dataset = create_dataset(
    task=Task(
        input_fields={input_fields},
        reference_fields={{}},
        prediction_type=List[str],
        default_template="templates.empty",
        metrics=[metric],
    ),
    test_set=dataset_content,
    split="test")
"""
    evaluation_md = "### Evaluate the responses and print the results"
    evaluation_code = """predictions = df.filter(regex=r"^system_\d+$").values.tolist()
results = evaluate(predictions=predictions, data=dataset)
print("Global Scores:")
print(results.global_scores)

print("Instance Scores:")
print(results.instance_scores)
"""

    nb.cells.append(nbf.v4.new_markdown_cell(title))
    nb.cells.append(nbf.v4.new_markdown_cell(import_md))
    nb.cells.append(nbf.v4.new_code_cell(import_code))
    nb.cells.append(nbf.v4.new_markdown_cell(load_dataset_md))
    nb.cells.append(nbf.v4.new_code_cell(load_dataset_code))
    nb.cells.append(nbf.v4.new_markdown_cell(load_criteria_md))
    nb.cells.append(nbf.v4.new_code_cell(load_criteria_code))
    nb.cells.append(nbf.v4.new_markdown_cell(setup_md))
    nb.cells.append(nbf.v4.new_code_cell(setup_code))
    nb.cells.append(nbf.v4.new_markdown_cell(evaluation_md))
    nb.cells.append(nbf.v4.new_code_cell(evaluation_code))

    return nb
