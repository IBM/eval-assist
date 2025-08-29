import json
import logging
import traceback
from collections.abc import Sequence
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, cast

import pandas as pd
from datasets import IterableDataset
from evalassist.judges import Criteria
from scipy.stats import pearsonr, spearmanr
from unitxt.api import evaluate, load_dataset
from unitxt.artifact import fetch_artifact
from unitxt.llm_as_judge import CriteriaWithOptions

from ..const import EVAL_ASSIST_DIR
from ..judges import DirectJudge
from ..judges.types import DirectInstance, DirectInstanceResult
from ..utils import convert_nan_to_none, unitxt_dataset_to_evalassist_instances

# from .utils import *
from .utils import (
    add_judgebench_readme_urls,
    add_tag_to_result,
    add_url_to_result,
    get_judge_from_config,
    get_judgebench_cards,
    save_results_to_sqlite,
)

RESULTS_FILE_PATH = EVAL_ASSIST_DIR / "benchmark" / "benchmark_results.csv"
CACHE_FILE_PATH = EVAL_ASSIST_DIR / "benchmark" / "benchmark_results_cache.csv"

logger = logging.getLogger(__name__)


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
                "type": "direct",
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


metric_map = {
    "pearson": "pearsonr",
    "spearman": "spearmanr",
}


def parse_card_results(
    card: str,
    dataset: IterableDataset,
    instances: list[DirectInstance],
    results: Sequence[DirectInstanceResult],
    judge: DirectJudge,
) -> tuple[list[dict[str, str]], dict[Any, Any]]:
    criteria_names = [result.criteria.name for result in results]

    if any(result.score is None for result in results):
        raise ValueError("Score is None!")

    prediction_scores: list[float] = [cast(float, result.score) for result in results]

    str_prediction_scores = [str(p) for p in prediction_scores]

    # biggen benchmark's criteria's name is composed by the capability and the task, we only keep the capability
    if "biggen" in card:
        criteria_names = [
            criteria_name.split("-")[0] for criteria_name in criteria_names
        ]

    unique_criteria_names = list(set(criteria_names))
    # the condition of the following line not always holds because although an llm judge evaluation with multiple criteria the score is llm_judge, if it happens that a specific batch happens to have just a single criterion is wont be called llm_as_judge even if the dataset has multiple criterias
    # scores_criteria_name = unique_criteria_names[0] if all(c == criteria_names[0] for c in unique_criteria_names) else "llm_as_judge"

    # Calculate positional bias rate
    positional_bias_rate = sum(
        [
            r.positional_bias.detected if r.positional_bias is not None else False
            for r in results
        ]
    ) / len(results)

    evaluation_results = evaluate(predictions=str_prediction_scores, data=dataset)

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
    benchmark_criteria_name = (
        card.split(".")[-1]
        if benchmark_name.startswith("judge_bench")
        else criteria_names[0]
    )
    benchmark_result: dict[str, str] = {
        "card": card,  # if there are several criteria, we have to add the overall result
        "benchmark_name": benchmark_name,
        "dataset_name": dataset_name,
        "judge": judge.get_name(),
        "benchmark_criteria_name": "overall"
        if len(unique_criteria_names) > 1
        else benchmark_criteria_name,
        "evalassist_criteria_name": "several_criteria"
        if len(unique_criteria_names) > 1
        else criteria_names[0],
        "model": judge.get_inference_engine_id(),
        "provider": "rits",
        "results": json.dumps(convert_nan_to_none(parsed_results)),
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
                        results[i].positional_bias.detected  # type: ignore
                        if results[i].positional_bias is not None
                        else False
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
                "model": judge.get_inference_engine_id(),
                "benchmark_name": benchmark_name,
                "dataset_name": dataset_name,
                "judge": judge.get_name(),
                "benchmark_criteria_name": criteria_name,
                "evalassist_criteria_name": criteria_name,
                "provider": "rits",
                "results": json.dumps(convert_nan_to_none(per_criteria_results)),
                "dataset_len": str(len(criteria_name_ground_truth)),
            }
            benchmark_results.append(criteria_name_benchmark_result)

    result_backup: list[dict] = [
        {
            "card": card,
            "judge": judge.get_descriptor().name,
            "model": judge.get_descriptor().inference_engine_id,
            "sample_index": i,
            "instance": instance.model_dump_json(indent=4),
            "result": result.model_dump_json(indent=4),
            "prediction": prediction,
            "ground_truth": target,
            "failed": prediction != target,
        }
        for i, (prediction, target, instance, result) in enumerate(
            zip(prediction_scores, ground_truth, instances, results)
        )
    ]

    save_results_to_sqlite(result_backup)
    return benchmark_results, {}


def run_single_model_card(
    card: str,
    judge: DirectJudge,
    instances_per_dataset: int | None = None,
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
        "with judge:",
        judge.get_descriptor(),
    )
    dataset: IterableDataset = cast(
        IterableDataset,
        load_dataset(
            card=card,
            split="test",
            loader_limit=instances_per_dataset,
            use_cache=True,
        ),
    )
    try:
        criteria: list[Criteria] = [
            Criteria.from_unitxt_criteria(
                cast(
                    CriteriaWithOptions,
                    fetch_artifact(json.loads(d["task_data"])["criteria"])[0],
                )
            )
            for d in dataset
        ]

        parsed_dataset: list[DirectInstance] = unitxt_dataset_to_evalassist_instances(
            dataset, criteria
        )

        results: Sequence[DirectInstanceResult] = judge.evaluate(
            parsed_dataset, criteria, check_positional_bias=True
        )

        benchmark_results, cache = parse_card_results(
            card=card,
            dataset=dataset,
            instances=parsed_dataset,
            results=results,
            judge=judge,
        )
        print("Finished running card:", card, "with judge:", judge.get_descriptor())

        return benchmark_results
    except Exception:
        print(f"FAILED! judege: {str(judge.get_descriptor())}")
        print(traceback.format_exc())


def run_benchmarks(
    judge_configs: list[tuple[type[DirectJudge], dict, dict, str]],
    max_workers: int,
    instances_per_dataset: int | None,
    dataset_keyword_filters: list[str] | None = None,
    dataset_keyword_selectors: list[str] | None = None,
):
    """

    Runs multiple benchmarks in parallel using a process pool executor.

    This function retrieves a list of JudgeBench cards, loads the corresponding datasets,
    and then submits tasks to the executor to run each benchmark with different models.

    The results are saved to CSV files specified by RESULTS_FILE_PATH and INSPECT_FILE_PATH.
    """

    # Create a cycle of API keys to use for benchmarking
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

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = []
        for card in all_benchmarks:
            # Load the dataset for the current card
            if dataset_keyword_filters is not None and any(
                x in card for x in dataset_keyword_filters
            ):
                continue
            if dataset_keyword_selectors is not None and not any(
                x in card for x in dataset_keyword_selectors
            ):
                continue
            for judge_config in judge_configs:
                judge = get_judge_from_config(judge_config)

                # Skip if the benchmark has already been run
                if (
                    card,
                    judge.get_inference_engine_id(),
                    judge.get_name(),
                ) not in ran_cards_models:
                    # Submit the task to the executor
                    futures.append(
                        executor.submit(
                            run_single_model_card,
                            card,
                            judge,
                            instances_per_dataset,
                        )
                    )
                else:
                    print(
                        f"Benchmark {card}/{judge.get_descriptor()}/{judge.get_name()} already ran"
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
