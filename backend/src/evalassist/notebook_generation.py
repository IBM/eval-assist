import json
import re
from abc import ABC, abstractmethod
from typing import Literal, cast

import nbformat as nbf
from evalassist.judges import Criteria, Instance

from .api_types import (
    EvaluatorNameEnum,
    EvaluatorTypeEnum,
    ExtendedEvaluatorNameEnum,
    ModelProviderEnum,
)
from .judges.const import DEFAULT_JUDGE_INFERENCE_PARAMS
from .utils import get_cross_inference_engine_params


class Cell:
    type: Literal["code", "md"]
    content: str

    def __init__(self, type: Literal["code", "md"], content: str):
        self.type = type
        self.content = content


class EvaluationNotebookGenerator(ABC):
    def __init__(
        self,
        instances: list[Instance],
        criteria: Criteria,
        test_case_name: str,
        evaluator_name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum,
        provider: ModelProviderEnum,
        credentials: dict[str, str],
        evaluator_type: EvaluatorTypeEnum,
        model_name: str,
        plain_python_script: bool,
    ):
        self.instances = instances
        self.criteria = criteria
        self.test_case_name = test_case_name
        self.evaluator_name = evaluator_name
        self.evaluator_type = evaluator_type
        self.plain_python_script = plain_python_script
        self.inference_engine_params = get_cross_inference_engine_params(
            credentials=credentials,
            provider=provider,
            model_name=model_name,
            custom_params=DEFAULT_JUDGE_INFERENCE_PARAMS,
        )
        self.cells: list[Cell] = []

    def generate_notebook(self):
        nb = nbf.v4.new_notebook()
        self._add_title()
        self._add_imports()
        self._add_load_dataset()
        self._add_setup_and_run_eval()
        for cell in self.cells:
            if cell.type == "md":
                nb.cells.append(nbf.v4.new_markdown_cell(cell.content))
            else:
                nb.cells.append(nbf.v4.new_code_cell(cell.content))
        return nb

    def _add_title(self):
        title = f"# EvalAssist {self.get_evaluation_type()} evaluation: {self.test_case_name}\n\n"
        title += (
            f'This notebook was generated automatically from your EvalAssist test case "{self.test_case_name}". '
            "It contains code to evaluate a set of responses using the specified criteria and evaluator. "
            "You can find the documentation [here](https://www.github.com/IBM/eval-assist).\n\n"
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

    def _add_setup_and_run_eval(self):
        self.cells.append(Cell(type="md", content=self.get_eval_md()))
        self.cells.append(Cell(type="code", content=self.get_eval_code()))

    @abstractmethod
    def get_evaluation_type(self) -> str:
        pass

    @abstractmethod
    def get_import_code(self) -> str:
        pass

    def get_load_dataset_md(self):
        return "### Loading the dataset"

    def get_load_dataset_code(self) -> str:
        return (
            "instances: list[Instance] = [\n"
            + "".join([self._format_instance(instance) for instance in self.instances])
            + "]"
        )

    def _format_instance(self, instance) -> str:
        field_lines = ",\n".join(
            [
                f"\t\t\t'{k}': {self.get_field_value(k, v)}"
                for k, v in instance.fields.items()
            ]
        )
        return f"\tInstance(\n\t\tfields={{\n{field_lines}\n\t\t}},\n\t),\n"

    def get_eval_md(self) -> str:
        return "### Setup the judge and run the evaluation"

    def get_eval_code(self) -> str:
        return self.get_load_criteria_code() + "\n" + self.get_setup_and_run_eval_code()

    @abstractmethod
    def get_setup_and_run_eval_code(self) -> str:
        pass

    def get_load_criteria_code(self):
        return f"""
criteria: Criteria = Criteria.model_validate({self.criteria.model_dump_json(indent=4, exclude={"examples": {"__all__": {"criteria": True, "positional_bias": True, "metadata": True, "explanation": True}}, "options": {"__all__": {"score": True}}})})
"""

    @abstractmethod
    def get_field_value(self, key: str, value: str | list[str]) -> str:
        pass


class DirectEvaluationNotebook(EvaluationNotebookGenerator):
    def get_evaluation_type(self):
        return "direct"

    def get_import_code(self):
        return """\
from unitxt.inference import CrossProviderInferenceEngine
from evalassist.judges import DirectJudge, Instance,  Criteria, DirectInstanceResult, DirectInstanceResult
import nest_asyncio
nest_asyncio.apply()\
"""

    def get_setup_and_run_eval_code(self):
        params = re.sub(
            r"\btrue\b", "True", json.dumps(self.inference_engine_params, indent=4)
        )
        return f"""\
inference_engine = CrossProviderInferenceEngine(**{params})

judge = DirectJudge(
    inference_engine=inference_engine,
)

results: list[DirectInstanceResult] = judge(instances, criteria)

for i, result in enumerate(results):
    print(f'instance {{i}}: selected option {{result.selected_option}}')\
"""

    def get_field_value(self, key: str, value: str | list[str]) -> str:
        return json.dumps(str(value))


class PairwiseEvaluationNotebook(EvaluationNotebookGenerator):
    def get_evaluation_type(self):
        return "pairwise"

    def get_import_code(self):
        return """\
from unitxt.inference import CrossProviderInferenceEngine
from evalassist.judges import PairwiseJudge, Instance, Criteria, PairwiseInstanceResult
import nest_asyncio
nest_asyncio.apply()\
"""

    def get_setup_and_run_eval_code(self):
        params = re.sub(
            r"\btrue\b", "True", json.dumps(self.inference_engine_params, indent=4)
        )
        return f"""\
inference_engine = CrossProviderInferenceEngine(**{params})

judge = PairwiseJudge(
    inference_engine=inference_engine,
)

results: list[PairwiseInstanceResult] = judge(instances, criteria)

for i, result in enumerate(results):
    print(f'instance {{i}}: selected option {{result.selected_option}}')\
"""

    def get_field_value(self, key: str, value: str | list[str]) -> str:
        if key == self.criteria.to_evaluate_field:
            res = "[\n"
            res += "".join(
                [f"\t\t\t\t{json.dumps(v)},\n" for v in cast(list[str], value)]
            )
            res += "\t\t\t]"
            return res
        else:
            return json.dumps(str(value))
