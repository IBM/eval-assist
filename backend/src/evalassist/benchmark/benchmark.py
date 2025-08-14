import json
import logging
import math
import os
import traceback
from collections.abc import Sequence
from concurrent.futures import ThreadPoolExecutor, as_completed
from itertools import cycle
from typing import Any, cast

import pandas as pd
from datasets import IterableDataset
from evalassist.api.common import DirectInstance, DirectInstanceResult
from evalassist.const import EVAL_ASSIST_DIR
from evalassist.judges.base import DirectJudge
from evalassist.judges.synthetic_persona_direct_judge import SimpleDirectJudge
from evalassist.judges.thesis_atithesis_direct_judge import ThesisAntithesisDirectJudge
from evalassist.judges.unitxt_judges import UnitxtDirectJudge
from evalassist.utils import (
    folder_exists_in_github_repo,
    unitxt_dataset_to_evalassist_instances,
)
from scipy.stats import pearsonr, spearmanr
from unitxt.api import evaluate, load_dataset
from unitxt.artifact import fetch_artifact
from unitxt.inference import CrossProviderInferenceEngine, InferenceEngine
from unitxt.llm_as_judge import CriteriaWithOptions, EvaluatorTypeEnum
from unitxt.settings_utils import get_constants

RESULTS_FILE_PATH = EVAL_ASSIST_DIR / "benchmark" / "benchmark_results.csv"
CACHE_FILE_PATH = EVAL_ASSIST_DIR / "benchmark" / "benchmark_results_cache.csv"
MAX_WORKERS = 15
BATCH_SIZE = 50
RITS_API_KEYS = [None]
INSTANCES_PER_DATASET = 200
# List of models to benchmark
MODELS = [
    "gpt-oss-120b",
    "llama-3-3-70b-instruct",
    # "llama-4-scout",
    "llama-4-maverick",
    # "granite-3-3-8b-instruct",
    # "deepseek-v3",
    "phi-4",
    "mistral-small-instruct",
]
JUDGES: list[type[DirectJudge]] = [
    UnitxtDirectJudge,
    SimpleDirectJudge,
    ThesisAntithesisDirectJudge,
]

logger = logging.getLogger(__name__)


def add_tag_to_result(results, keyword, tag_or_tags):
    for k in results.keys():
        if keyword in results[k]["display_name"]:
            if isinstance(tag_or_tags, list):
                results[k]["tags"].extend(tag_or_tags)
            else:
                results[k]["tags"].append(tag_or_tags)


def add_url_to_result(results, keyword, url):
    for k in results.keys():
        if keyword in results[k]["display_name"]:
            results[k]["url"] = url


def get_judgebench_readme_url(dataset_name):
    exists = folder_exists_in_github_repo(
        "dmg-illc", "JUDGE-BENCH", f"data/{dataset_name}", "master"
    )
    readme_url = f"https://github.com/dmg-illc/JUDGE-BENCH/blob/master/data/{dataset_name}/README.md"
    return exists, readme_url


def add_judgebench_readme_url(benchmark_name):
    dataset_name = benchmark_name.split("/")[1]
    futures = []
    with ThreadPoolExecutor(2) as executor:
        for option in [dataset_name, dataset_name.replace("_", "-")]:
            futures.append(executor.submit(get_judgebench_readme_url, option))
    for future in as_completed(futures):
        exists, readme_url = future.result()
        if exists:
            return benchmark_name, readme_url
    return benchmark_name, None


def add_judgebench_readme_urls(results):
    futures = []
    with ThreadPoolExecutor(max_workers=20) as executor:
        for benchmark_name in results.keys():
            futures.append(executor.submit(add_judgebench_readme_url, benchmark_name))
    for future in as_completed(futures):
        benchmark_name, readme_url = future.result()
        results[benchmark_name]["url"] = readme_url


def get_all_benchmarks():
    try:
        df = pd.read_csv(RESULTS_FILE_PATH)
    except FileNotFoundError:
        return {}
    results = {}
    for row in df.to_dict(orient="records"):
        card = row["card"]
        benchmark_name = row["benchmark_name"]
        dataset_name = row["dataset_name"]
        benchmark_criteria_name = row["benchmark_criteria_name"]
        dataset_len = row["dataset_len"]
        row_id = "/".join([benchmark_name, dataset_name])
        if row_id not in results:
            benchmark_results = {
                "benchmark_name": benchmark_name,
                "dataset_name": dataset_name,
                "display_name": (
                    benchmark_name + "." if benchmark_name != "judge_bench" else ""
                )
                + dataset_name,
                "description": "",
                "catalog_url": f"https://www.unitxt.ai/en/latest/catalog/catalog.{card}.html",
                "type": EvaluatorTypeEnum.DIRECT,
                "tags": [benchmark_name],
                "criteria_benchmarks": {},
            }

            results[row_id] = benchmark_results

        benchmark_results = results[row_id]

        if benchmark_criteria_name not in benchmark_results["criteria_benchmarks"]:
            criteria_benchmark = {
                "evaluator_benchmarks": {},
                "name": benchmark_criteria_name,
                "catalog_criteria_name": row["evalassist_criteria_name"],
                "dataset_len": dataset_len,
            }
            benchmark_results["criteria_benchmarks"][benchmark_criteria_name] = (
                criteria_benchmark
            )

        criteria_benchmark = benchmark_results["criteria_benchmarks"][
            benchmark_criteria_name
        ]
        model = row["model"]
        judge = row["judge"]
        model_judge = f"{model}_{judge}"
        if model_judge not in criteria_benchmark["evaluator_benchmarks"]:
            model_results = {
                "model": model,
                "judge": judge,
                "results": json.loads(row["results"]),
            }
            criteria_benchmark["evaluator_benchmarks"][model_judge] = model_results

    # add benchmark to the name if it only has one dataset
    datasets_per_benchmarks = {}
    for r in results.values():
        if r["benchmark_name"] not in datasets_per_benchmarks:
            datasets_per_benchmarks[r["benchmark_name"]] = []
        if r["dataset_name"] not in datasets_per_benchmarks[r["benchmark_name"]]:
            datasets_per_benchmarks[r["benchmark_name"]].append(r["dataset_name"])

    add_judgebench_readme_urls(results)
    add_tag_to_result(results, "roscoe", "reasoning")
    add_tag_to_result(results, "wmt", "translation")
    add_tag_to_result(results, "cola", "grammar")

    add_url_to_result(
        results,
        "biggen",
        "https://huggingface.co/datasets/prometheus-eval/BiGGen-Bench-Results/viewer/default/human_eval",
    )

    return results


def get_judgebench_cards():
    constants = get_constants()
    judgebench_dir = os.path.join(
        constants.catalog_dir,
        "cards",
        "judge_bench",
    )

    judgebench_cards = []

    for dirpath, _, filenames in os.walk(judgebench_dir):
        for file in filenames:
            if file.endswith(".json"):
                # Get the relative path without the .json extension
                relative_path = os.path.relpath(
                    os.path.join(dirpath, file), judgebench_dir
                )
                without_extension = os.path.splitext(relative_path)[0]
                dotted_path = without_extension.replace(os.path.sep, ".")
                judgebench_cards.append(f"cards.judge_bench.{dotted_path}")

    return judgebench_cards


inference_engines: dict[str, InferenceEngine] = {}

metric_map = {
    "pearson": "pearsonr",
    "spearman": "spearmanr",
}


def clean_nan(obj):
    if isinstance(obj, float) and math.isnan(obj):
        return None
    elif isinstance(obj, dict):
        return {k: clean_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan(v) for v in obj]
    return obj


def parse_card_results(
    card: str,
    dataset: IterableDataset,
    model: str,
    results: Sequence[DirectInstanceResult],
    prediction_scores: list[str],
    judge: DirectJudge,
    criteria: list[CriteriaWithOptions],
) -> tuple[list[dict[str, str]], dict[Any, Any]]:
    criteria_names = [criterion.name for criterion in criteria]
    unique_criteria_names = list(set(criteria_names))
    # the condition of the following line not always holds because although an llm judge evaluation with multiple criteria the score is llm_judge, if it happens that a specific batch happens to have just a single criterion is wont be called llm_as_judge even if the dataset has multiple criterias
    # scores_criteria_name = unique_criteria_names[0] if all(c == criteria_names[0] for c in unique_criteria_names) else "llm_as_judge"

    # Calculate positional bias rate
    positional_bias_rate = sum([r.positional_bias.detected for r in results]) / len(
        results
    )

    evaluation_results = evaluate(predictions=prediction_scores, data=dataset)

    # Extract metric names from the evaluation results
    metric_names = [m.split(".")[1] for m in evaluation_results[0]["metrics"]]

    # Parse the evaluation results into a dictionary
    parsed_results = {
        metric_name: float(
            evaluation_results.global_scores[metric_map.get(metric_name, metric_name)]
        )
        for metric_name in metric_names
    }

    # Store the positional bias rate in the parsed results
    parsed_results["positional_bias_rate"] = positional_bias_rate

    benchmark_name = card.split(".")[1]
    dataset_name = ".".join(
        card.split(".")[2:-1]
        if benchmark_name.startswith("judge_bench")
        else card.split(".")[2:]
    )
    benchmark_criteria_name = card.split(".")[-1]
    benchmark_result: dict[str, str] = {
        "card": card,  # if there are several criteria, we have to add the overall result
        "benchmark_name": benchmark_name,
        "dataset_name": dataset_name,
        "judge": judge.get_name(),
        "benchmark_criteria_name": "overall"
        if len(unique_criteria_names) > 1
        else benchmark_criteria_name
        if len(unique_criteria_names) > 1
        else card.split(".")[-1],
        "evalassist_criteria_name": "several_criteria"
        if len(unique_criteria_names) > 1
        else criteria[0].name
        if len(unique_criteria_names) > 0
        else unique_criteria_names[0],
        "model": model,
        "provider": "rits",
        "results": json.dumps(clean_nan(parsed_results)),
        "dataset_len": str(len(dataset)),
    }

    benchmark_results: list[dict[str, str]] = []
    benchmark_results.append(benchmark_result)

    # Add all the results for each criteria
    ground_truth = [float(d["target"]) for d in dataset]
    if len(unique_criteria_names) > 1:
        # the dataset has many criteria
        # add one entry per criteria
        # manually calculate the metrics
        for criteria_name in unique_criteria_names:
            criteria_name_ground_truth = []
            criteria_name_predictions = []
            criteria_name_positional_bias_detected_list = []
            for i, c in enumerate(criteria_names):
                if c == criteria_name:
                    criteria_name_ground_truth.append(ground_truth[i])
                    criteria_name_predictions.append(prediction_scores[i])
                    criteria_name_positional_bias_detected_list.append(
                        results[i].positional_bias.detected
                    )
            per_criteria_results: dict[str, float] = {}
            for metric in metric_names:
                if metric == "spearman":
                    res = spearmanr(
                        criteria_name_predictions, criteria_name_ground_truth
                    )
                    metric_result: float = res.correlation  # type: ignore
                elif metric == "pearson":
                    res = pearsonr(
                        criteria_name_predictions, criteria_name_ground_truth
                    )
                    metric_result = res.correlation
                else:
                    raise Exception(f"Metric {metric} not implemented")
                per_criteria_results[metric] = float(metric_result)
            per_criteria_results["positional_bias_rate"] = sum(
                criteria_name_positional_bias_detected_list
            ) / len(criteria_name_positional_bias_detected_list)
            criteria_name_benchmark_result = {
                "card": card,
                "model": model,
                "benchmark_name": benchmark_name,
                "dataset_name": dataset_name,
                "judge": judge.get_name(),
                "benchmark_criteria_name": criteria_name,
                "evalassist_criteria_name": criteria_name,
                "provider": "rits",
                "results": json.dumps(clean_nan(per_criteria_results)),
                "dataset_len": str(len(criteria_name_ground_truth)),
            }
            benchmark_results.append(criteria_name_benchmark_result)

    # cache = {
    #     "card": card,  # if there are several criteria, we have to add the overall result
    #     "model": model,
    #     "provider": "rits",
    #     "annotation": "1.26.4",
    #     "benchmark_criteria_name": "overall"
    #     if len(unique_criteria_names) > 1
    #     else card.split(".")[-1],
    #     "evalassist_criteria_name": ""
    #     if len(unique_score_criteria_names) > 0
    #     else unique_score_criteria_names[0],
    #     "raw_results": json.dumps(
    #         {
    #             "ground_truth": ground_truth,
    #             "predictions": parsed_predictions,
    #             "pos_bias": positional_bias_detected_list,
    #             "criteria_names": criteria_names,
    #             "selected_options": selected_options,
    #         }
    #     ),
    # }
    return benchmark_results, {}


def run_single_model_card(
    card: str,
    model: str,
    judge: DirectJudge,
):
    """
    Runs a single benchmark card with the specified model and API key.

    Args:
        card (str): The name of the benchmark card to run.
        dataset: The dataset to use for benchmarking.
        model (str): The name of the model to use for benchmarking.
        api_key (str): The API key to use for the model.

    Returns:
        tuple: A tuple containing the benchmark result and inspection rows.
    """
    print(
        "Running card:",
        card,
        "with model:",
        model,
    )
    dataset: IterableDataset = cast(
        IterableDataset,
        load_dataset(
            card=card,
            split="test",
            loader_limit=INSTANCES_PER_DATASET if "biggen" not in card else None,
            use_cache=True,
        ),
    )
    try:
        criteria: list[CriteriaWithOptions] = [
            cast(
                CriteriaWithOptions,
                CriteriaWithOptions.from_dict(
                    cast(
                        CriteriaWithOptions,
                        fetch_artifact(json.loads(d["task_data"])["criteria"])[0],
                    ).to_dict()
                ),
            )
            for d in dataset
        ]

        parsed_dataset: list[DirectInstance] = unitxt_dataset_to_evalassist_instances(
            dataset, criteria
        )

        results: Sequence[DirectInstanceResult] = judge.evaluate(
            parsed_dataset, criteria, check_positional_bias=True
        )

        prediction_scores = [
            cast(dict[str, str], c.option_map)[p.option]
            for p, c in zip(results, criteria)
        ]
        # Extract the criteria name from the first prediction

        benchmark_results, cache = parse_card_results(
            card=card,
            dataset=dataset,
            model=model,
            results=results,
            prediction_scores=prediction_scores,
            judge=judge,
            criteria=criteria,
        )
        print("Finished running card:", card, "with model:", model)

        return benchmark_results
    except Exception:
        print("FAILED!")
        print(traceback.format_exc())


def run_benchmarks():
    """
    Runs multiple benchmarks in parallel using a process pool executor.

    This function retrieves a list of JudgeBench cards, loads the corresponding datasets,
    and then submits tasks to the executor to run each benchmark with different models.

    The results are saved to CSV files specified by RESULTS_FILE_PATH and INSPECT_FILE_PATH.
    """
    # Create a cycle of API keys to use for benchmarking
    api_key_cycle = cycle(RITS_API_KEYS)
    all_benchmarks = [
        "cards.biggen_bench.results.human_eval",
    ] + get_judgebench_cards()

    try:
        # Load previously run results from CSV
        ran_results_df = pd.read_csv(RESULTS_FILE_PATH)
    except Exception:
        # Initialize an empty DataFrame if the CSV doesn't exist
        ran_results_df = pd.DataFrame(
            columns=[
                "card",
                "model",
                "benchmark_name",
                "dataset_name",
                "benchmark_criteria_name",
                "evalassist_criteria_name",
                "results",
                "provider",
                "judge",
                "dataset_len",
            ]
        )

    # Get a list of previously run card-model pairs
    ran_cards_models = [
        (card, model, judge)
        for card, model, judge in zip(
            ran_results_df["card"].to_list(),
            ran_results_df["model"].to_list(),
            ran_results_df["judge"].to_list(),
        )
    ]

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = []
        for card in all_benchmarks:
            # Load the dataset for the current card
            if card in ["esnli", "drop"]:
                continue
            for model in MODELS:
                for judge_class in JUDGES:
                    if model in inference_engines:
                        inference_engine = inference_engines[model]
                    else:
                        api_key = next(api_key_cycle)
                        inference_engine = CrossProviderInferenceEngine(
                            model=model,
                            provider="rits",
                            temperature=0,
                            max_tokens=2048,
                            # use_cache=True,
                            # cache_batch_size=BATCH_SIZE,
                            credentials={"api_key": api_key}
                            if api_key is not None
                            else None,
                            data_classification_policy=["public"],
                        )
                        inference_engines[model] = inference_engine

                    judge = judge_class(inference_engine)

                    # Skip if the benchmark has already been run
                    if (card, model, judge.get_name()) not in ran_cards_models:
                        # Submit the task to the executor
                        futures.append(
                            executor.submit(run_single_model_card, card, model, judge)
                        )
                    else:
                        print(
                            f"Benchmark {card}/{model}/{judge.get_name()} already ran"
                        )
        # Process the results as they become available
        for future in as_completed(futures):
            print("Adding results")
            benchmark_results = future.result()
            if benchmark_results is not None:
                # Append the benchmark result to the DataFrame and save to CSV
                ran_results_df = pd.concat(
                    [ran_results_df, pd.DataFrame(benchmark_results)]
                )
                ran_results_df.to_csv(RESULTS_FILE_PATH, index=False, na_rep="null")
    print("Done running benchmarks")


if __name__ == "__main__":
    run_benchmarks()
    # model = "granite-3-3-8b-instruct"
    # inference_engine = CrossProviderInferenceEngine(
    #     model=model,
    #     provider="rits",
    #     temperature=0,
    #     max_tokens=2048,
    #     data_classification_policy=["public"],
    # )
    # print(run_single_model_card(
    #     "cards.judge_bench.roscoe.overall.drop.overall_quality",
    #     "gpt-oss-120b",
    #     UnitxtDirectJudge(inference_engine)))
