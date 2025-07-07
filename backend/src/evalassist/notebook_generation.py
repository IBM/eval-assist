import json
from abc import ABC, abstractmethod
from typing import Literal

import nbformat as nbf

from .api.common import NotebookParams
from .utils import get_cross_inference_engine_params


class Cell:
    type: Literal["code", "md"]
    content: str

    def __init__(self, type: Literal["code", "md"], content: str):
        self.type = type
        self.content = content


class EvaluationNotebookGenerator(ABC):
    def __init__(self, params: NotebookParams):
        self.params = params
        self.inference_engine_params = get_cross_inference_engine_params(
            credentials=params.credentials,
            provider=params.provider,
            model_name=params.model_name,
        )
        self.input_fields = {k: "str" for k in params.context_variables[0].keys()}
        self.context_fields = list(params.context_variables[0].keys())
        self.cells: list[Cell] = []

    def generate_notebook(self):
        nb = nbf.v4.new_notebook()
        self._add_title()
        self._add_imports()
        self._add_load_dataset()
        self._add_load_criteria()
        self._add_setup()
        self._add_evaluation()
        for cell in self.cells:
            if cell.type == "md":
                nb.cells.append(nbf.v4.new_markdown_cell(cell.content))
            else:
                nb.cells.append(nbf.v4.new_code_cell(cell.content))
        return nb

    def _add_title(self):
        title = f"# Unitxt {self.get_evaluation_type()} evaluation notebook: {self.params.test_case_name}\n\n"
        title += (
            f'This notebook was generated automatically from your EvalAssist test case "{self.params.test_case_name}". '
            "It contains code to evaluate a set of responses using the specified criteria and evaluator. "
            "EvalAssist uses [unitxt](https://www.unitxt.ai/en/latest/index.html) to create and run the evaluations. "
            "You can find the documentation [here](https://www.unitxt.ai/en/latest/docs/llm_as_judge.html).\n\n"
        )
        self.cells.append(Cell(type="md", content=title))

    def _add_imports(self):
        import_md = "### Import the necessary libraries"
        import_code = self.get_import_code()
        self.cells.append(Cell(type="md", content=import_md))
        self.cells.append(Cell(type="code", content=import_code))

    def _add_load_dataset(self):
        self.cells.append(Cell(type="md", content=self.get_load_dataset_md()))
        self.cells.append(Cell(type="code", content=self.get_load_dataset_code()))

    def _add_load_criteria(self):
        self.cells.append(Cell(type="md", content=self.get_load_criteria_md()))
        self.cells.append(Cell(type="code", content=self.get_load_criteria_code()))

    def _add_setup(self):
        self.cells.append(Cell(type="md", content=self.get_setup_md()))
        self.cells.append(Cell(type="code", content=self.get_setup_code()))

    def _add_evaluation(self):
        self.cells.append(
            Cell(type="md", content="### Evaluate the responses and print the results")
        )
        self.cells.append(Cell(type="code", content=self.get_evaluation_code()))

    @abstractmethod
    def get_evaluation_type(self):
        pass

    @abstractmethod
    def get_import_code(self):
        pass

    @abstractmethod
    def get_load_dataset_md(self):
        pass

    @abstractmethod
    def get_load_dataset_code(self):
        pass

    @abstractmethod
    def get_load_criteria_md(self):
        pass

    @abstractmethod
    def get_load_criteria_code(self):
        pass

    @abstractmethod
    def get_setup_code(self):
        pass

    @abstractmethod
    def get_evaluation_code(self):
        pass

    @abstractmethod
    def get_setup_md(self):
        pass


class DirectEvaluationNotebook(EvaluationNotebookGenerator):
    def get_evaluation_type(self):
        return "direct"

    def get_import_code(self):
        return """
import json
from unitxt.api import evaluate, create_dataset
from unitxt.inference import CrossProviderInferenceEngine
from unitxt.llm_as_judge import LLMJudgeDirect, CriteriaWithOptions
from unitxt.task import Task
import pandas as pd
import nest_asyncio
nest_asyncio.apply()
"""

    def get_load_dataset_md(self):
        return "### Loading the dataset\nThis code block creates a dataset from the context variables and the prediction."

    def get_load_dataset_code(self):
        return f"""context_variables = {json.dumps(self.params.context_variables, indent=4)}
predictions = {json.dumps(self.params.predictions, indent=4)}
dataset_rows = [instance_context_variable | {{"prediction": prediction}} for instance_context_variable, prediction in zip(context_variables, predictions)]
df = pd.DataFrame(dataset_rows)
# load a csv if data is stored in a csv file
# df = pd.read_csv(file_path)
"""

    def get_load_criteria_md(self):
        return """### Load the criteria
The criteria in a direct evaluation needs an option map that matches a string to a numerical value. Replace the NaN value of each option with your desire numerical value.
"""

    def get_load_criteria_code(self):
        option_map_string = {
            option["name"]: float("nan") for option in self.params.criteria["options"]
        }
        return f"""
criteria = {json.dumps(self.params.criteria, indent=4)}
criteria["option_map"] = {json.dumps(option_map_string, indent=4)}
criteria = CriteriaWithOptions.from_obj(criteria)
"""

    def get_setup_code(self):
        return f"""metric = LLMJudgeDirect(
    inference_engine=CrossProviderInferenceEngine(**{json.dumps(self.inference_engine_params, indent=4)}),
    criteria=criteria,
    context_fields={self.context_fields},
    criteria_field="criteria",
)
dataset_content = df.drop(columns=["prediction"]).to_dict(orient="records")
dataset = create_dataset(
    task=Task(
        input_fields={self.input_fields},
        reference_fields={{}},
        prediction_type=str,
        default_template="templates.empty",
        metrics=[metric],
    ),
    test_set=dataset_content,
    split="test")
"""

    def get_setup_md(self):
        return """### Setup the evaluation
This code block creates the evaluator object of class _LLMJudgeDirect_. It then creates a dataset object from the context variables.
"""

    def get_evaluation_code(self):
        return """predictions = df["prediction"].tolist()
results = evaluate(predictions=predictions, data=dataset)
rows = []
for i, result in enumerate(results):
    instance_scores = result['score']['instance']
    criteria = json.loads(instance_scores[f\"{instance_scores['score_name']}_criteria\"])
    criteria_str = criteria['name'] if criteria['name'] != "" else criteria['description']
    rows.append({
        'prediction': predictions[i],
        'criteria': criteria_str,
        'score': instance_scores['score'],
        'option': instance_scores[f\"{instance_scores['score_name']}_selected_option\"]})
results_df = pd.DataFrame(rows)
results_df
"""


class PairwiseEvaluationNotebook(EvaluationNotebookGenerator):
    def get_evaluation_type(self):
        return "pairwise"

    def get_import_code(self):
        return """
import json
from typing import List
from unitxt.api import evaluate, load_dataset
from unitxt.inference import CrossProviderInferenceEngine
from unitxt.llm_as_judge import LLMJudgePairwise, Criteria
from unitxt.blocks import Task, TaskCard
from unitxt.loaders import LoadFromDictionary
from unitxt.templates import NullTemplate

import pandas as pd
import nest_asyncio
nest_asyncio.apply()
"""

    def get_load_dataset_md(self):
        return """### Loading the dataset
This code block creates a dataset from the context variables and the prediction. It simulates the sceario where the dataset is loaded from a csv file.

_Note: in a pairwise dataset, each instance is composed by a context, a criteria and a list of responses. Therefore, this dataset is composed by just one instance._
"""

    def get_load_dataset_code(self):
        system_predictions = [
            {f"system_{i + 1}": pred for i, pred in enumerate(instance_preds)}
            for instance_preds in self.params.predictions
        ]
        return f"""context_variables = {json.dumps(self.params.context_variables, indent=4)}
system_predictions = {json.dumps(system_predictions, indent=4)}
dataset_rows = [instance_context_variable | instance_predictions for instance_context_variable, instance_predictions in zip(context_variables, system_predictions)]
df = pd.DataFrame(dataset_rows)
# load a csv if data is stored in a csv file
# df = pd.read_csv(file_path)
"""

    # **Add missing methods here**
    def get_load_criteria_md(self):
        return """### Load the criteria"""

    def get_load_criteria_code(self):
        return f"""
criteria = Criteria.from_obj({json.dumps(self.params.criteria, indent=4)})
"""

    def get_setup_code(self):
        return f"""metric = LLMJudgePairwise(
    inference_engine=CrossProviderInferenceEngine(**{json.dumps(self.inference_engine_params, indent=4)}),
    criteria=criteria,
    context_fields={self.context_fields},
    criteria_field="criteria",
)
dataset_content = df.filter(regex=r"^(?!system_)").to_dict(orient="records")
data = {{"test": dataset_content}}
card = TaskCard(
    loader=LoadFromDictionary(data=data, data_classification_policy=["public"]),
    task=Task(
        input_fields={self.input_fields},
        prediction_type=List[str],
        metrics=[metric],
        reference_fields={{}},
        default_template=NullTemplate(),
    ),
)
dataset = load_dataset(card=card, split="test")
"""

    def get_setup_md(self):
        return """### Setup the evaluation
This code block creates the evaluator object of class _LLMJudgePairwise_. It then creates a dataset object from the context variables.
"""

    def get_evaluation_code(self):
        return """predictions = df.filter(regex=r"^system_\d+$").values.tolist()
results = evaluate(predictions=predictions, data=dataset)
per_instance_scores = []
winners = []
for i, result in enumerate(results):
    instance_scores = result['score']['instance']
    summary = {
        f'system_{i}': {"winrate": instance_scores[f'{i}_winrate'], "ranking": instance_scores[f'{i}_ranking']}
     for i in range(
        1,
        len(predictions[0]) + 1
    )}
    per_instance_scores.append(summary)
    winners.append(next(iter([k for k, v in summary.items() if v['winrate'] == 1])))
df['winner'] = winners
df['result'] = per_instance_scores
df
"""
