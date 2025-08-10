import json
import logging
import math
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from itertools import cycle
from typing import cast

import pandas as pd
from evalassist.api.common import DirectInstance
from evalassist.const import EVAL_ASSIST_DIR
from evalassist.judges.synthetic_persona_direct_judge import (
    ExperimentalSimpleDirectJudge,
)
from evalassist.utils import (
    folder_exists_in_github_repo,
    unitxt_dataset_to_evalassist_instances,
)
from scipy.stats import pearsonr, spearmanr
from unitxt.api import evaluate, load_dataset
from unitxt.artifact import fetch_artifact
from unitxt.inference import CrossProviderInferenceEngine, MetricInferenceEngine
from unitxt.llm_as_judge import CriteriaWithOptions, EvaluatorTypeEnum, LLMJudgeDirect
from unitxt.settings_utils import get_constants

RESULTS_FILE_PATH = EVAL_ASSIST_DIR / "benchmark" / "benchmark_results.csv"
CACHE_FILE_PATH = EVAL_ASSIST_DIR / "benchmark" / "benchmark_results_cache.csv"
MAX_WORKERS = 10
BATCH_SIZE = 50
RITS_API_KEYS = [None]
INSTANCES_PER_DATASET = 200
# List of models to benchmark
MODELS = [
    "llama-3-3-70b-instruct",
    "llama-4-scout",
    "llama-4-maverick",
    "granite-3-3-8b-instruct",
    "deepseek-v3",
    "phi-4",
    # "mistral-small-instruct",
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
    dataset_name = benchmark_name.split(".")[0]
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
            }
            benchmark_results["criteria_benchmarks"][benchmark_criteria_name] = (
                criteria_benchmark
            )

        criteria_benchmark = benchmark_results["criteria_benchmarks"][
            benchmark_criteria_name
        ]
        model = row["model"]
        annotation = row["annotation"]
        model_annotation = f"{model}_{annotation}"
        if model_annotation not in criteria_benchmark["evaluator_benchmarks"]:
            model_results = {
                "name": model,
                "annotation": annotation,
                "results": json.loads(row["results"]),
            }
            criteria_benchmark["evaluator_benchmarks"][model_annotation] = model_results

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


inference_engines = {}


def run_single_model_card_experimental(
    card: str,
    dataset,
    model: str,
    generate_synthetic_persona: bool,
    inference_engine: CrossProviderInferenceEngine,
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
        "generate_synthetic_persona: ",
        generate_synthetic_persona,
    )

    criteria: CriteriaWithOptions = cast(
        CriteriaWithOptions,
        fetch_artifact(json.loads(dataset[0]["task_data"])["criteria"])[0],
    )

    judge = ExperimentalSimpleDirectJudge(
        inference_engine=inference_engine,
        criteria=criteria,
        generate_synthetic_persona=generate_synthetic_persona,
    )

    parsed_dataset: list[DirectInstance] = unitxt_dataset_to_evalassist_instances(
        dataset, criteria
    )

    predictions = judge.evaluate(parsed_dataset)
    prediction_scores = [criteria.option_map[p] for p in predictions]
    # Extract the criteria name from the first prediction

    judge.criteria.options.reverse()
    positional_bias_predictions = judge.evaluate(parsed_dataset)

    positional_bias_rate = 1 - (
        sum(x == y for x, y in zip(predictions, positional_bias_predictions))
        / len(predictions)
    )

    results = evaluate(predictions=prediction_scores, data=dataset)

    # Extract metric names from the evaluation results
    metric_names = [m.split(".")[1] for m in results[0]["metrics"]]

    # Parse the evaluation results into a dictionary
    parsed_results: dict[str, float | None] = {
        metric_name: float(
            results.global_scores[
                metric_name if metric_name != "spearman" else "spearmanr"
            ]
        )
        for metric_name in metric_names
    }
    parsed_results["positional_bias_rate"] = positional_bias_rate
    parsed_results["corr_reponse_length/accuracy"] = None
    parsed_results["corr_context_length/accuracy"] = None
    parsed_results["corr_response_length/pos_bias"] = None
    parsed_results["corr_context_length/pos_bias"] = None

    benchmark_result = {
        "card": card,
        "model": model,
        "provider": "rits",
        "annotation": "experimental"
        + ("_with_persona" if generate_synthetic_persona else ""),
        "criteria": criteria.name,
        "results": json.dumps(clean_nan(parsed_results)),
    }

    print(
        "Finished unning card:",
        card,
        "with model:",
        model,
        "generate_synthetic_persona: ",
        generate_synthetic_persona,
    )

    return benchmark_result, None


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


def parse_card_results(card, dataset, model, judge_predictions):
    try:
        task_data_list = [json.loads(d["task_data"]) for d in dataset]
        criteria_names = [
            cast(CriteriaWithOptions, fetch_artifact(td["criteria"])[0]).name
            for td in task_data_list
        ]
        unique_criteria_names = list(set(criteria_names))
        # the following condition not always holds because although an llm judge evaluation with multiple criteria the score is llm_judge, if it happens that a specific batch happens to have just a criteria is wont be called llm_as_judge even if the dataset has multiple criterias
        # scores_criteria_name = unique_criteria_names[0] if all(c == criteria_names[0] for c in unique_criteria_names) else "llm_as_judge"
        score_criteria_names: list[str] = [
            "_".join(
                next(
                    iter([k for k in list(p.keys()) if k.endswith("_criteria")])
                ).split("_")[:-1]
            )
            for p in judge_predictions
        ]
        unique_score_criteria_names = list(set(score_criteria_names))

        # Calculate positional bias rate
        positional_bias_detected_list = [
            p[f"{score_criteria_name}_positional_bias"]
            for p, score_criteria_name in zip(judge_predictions, score_criteria_names)
        ]
        positional_bias_rate = sum(positional_bias_detected_list) / len(
            positional_bias_detected_list
        )

        selected_options = [
            p[f"{score_criteria_name}_selected_option"]
            for p, score_criteria_name in zip(judge_predictions, score_criteria_names)
        ]

        parsed_predictions = [
            p[score_criteria_name]
            for p, score_criteria_name in zip(judge_predictions, score_criteria_names)
        ]
        results = evaluate(predictions=parsed_predictions, data=dataset)

        # Extract metric names from the evaluation results
        metric_names = [m.split(".")[1] for m in results[0]["metrics"]]

        # Parse the evaluation results into a dictionary
        parsed_results = {
            metric_name: float(
                results.global_scores[metric_map.get(metric_name, metric_name)]
            )
            for metric_name in metric_names
        }
        # Store the positional bias rate in the parsed results
        parsed_results["positional_bias_rate"] = positional_bias_rate

        # parsed_results["corr_reponse_length/accuracy"] = None
        # parsed_results["corr_context_length/accuracy"] = None
        # parsed_results["corr_response_length/pos_bias"] = None
        # parsed_results["corr_context_length/pos_bias"] = None

        benchmark_name = card.split(".")[1]
        dataset_name = ".".join(
            card.split(".")[2:-1]
            if benchmark_name.startswith("judge_bench")
            else card.split(".")[2:]
        )
        benchmark_result = {
            "card": card,  # if there are several criteria, we have to add the overall result
            "benchmark_name": benchmark_name,
            "dataset_name": dataset_name,
            "benchmark_criteria_name": "overall"
            if len(unique_criteria_names) > 1
            else card.split(".")[-1],
            "evalassist_criteria_name": "several_criteria"
            if len(unique_score_criteria_names) > 0
            else unique_score_criteria_names[0],
            "model": model,
            "provider": "rits",
            "annotation": "1.26.4",
            "results": json.dumps(clean_nan(parsed_results)),
        }

        benchmark_results = []
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
                        criteria_name_predictions.append(parsed_predictions[i])
                        criteria_name_positional_bias_detected_list.append(
                            positional_bias_detected_list[i]
                        )
                results = {}
                for metric in metric_names:
                    metric_result = None
                    if metric == "spearman":
                        metric_result, _ = spearmanr(
                            criteria_name_predictions, criteria_name_ground_truth
                        )
                    elif metric == "pearson":
                        metric_result, _ = pearsonr(
                            criteria_name_predictions, criteria_name_ground_truth
                        )
                    else:
                        raise Exception(f"Metric {metric} not implemented")
                    results[metric] = float(metric_result)
                results["positional_bias_rate"] = sum(
                    criteria_name_positional_bias_detected_list
                ) / len(criteria_name_positional_bias_detected_list)
                criteria_name_benchmark_result = {
                    "card": card,
                    "model": model,
                    "benchmark_name": benchmark_name,
                    "dataset_name": dataset_name,
                    "benchmark_criteria_name": criteria_name,
                    "evalassist_criteria_name": criteria_name,
                    "provider": "rits",
                    "annotation": "1.26.4",
                    "results": json.dumps(clean_nan(results)),
                }
                benchmark_results.append(criteria_name_benchmark_result)

        cache = {
            "card": card,  # if there are several criteria, we have to add the overall result
            "model": model,
            "provider": "rits",
            "annotation": "1.26.4",
            "benchmark_criteria_name": "overall"
            if len(unique_criteria_names) > 1
            else card.split(".")[-1],
            "evalassist_criteria_name": ""
            if len(unique_score_criteria_names) > 0
            else unique_score_criteria_names[0],
            "raw_results": json.dumps(
                {
                    "ground_truth": ground_truth,
                    "predictions": parsed_predictions,
                    "pos_bias": positional_bias_detected_list,
                    "criteria_names": criteria_names,
                    "selected_options": selected_options,
                }
            ),
        }
        return benchmark_results, cache
    except Exception as e:
        print("FAILED")
        print(e)


def run_single_model_card(
    card: str, dataset, model: str, inference_engine: CrossProviderInferenceEngine
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
    print("Running card:", card, "with model:", model)
    judge = LLMJudgeDirect(
        criteria_field="criteria",
        context_fields=None,
        include_prompts_in_result=True,
        inference_engine=inference_engine,
    )
    metric_inference_engine = MetricInferenceEngine(
        metric=judge,
        cache_batch_size=BATCH_SIZE,
    )
    predictions = metric_inference_engine.infer(dataset)
    benchmark_results, cache = parse_card_results(card, dataset, model, predictions)
    print("Finished unning card:", card, "with model:", model)

    return benchmark_results, cache


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
                "annotation",
            ]
        )

    try:
        # Load previously run results from CSV
        cache_df: pd.DataFrame = pd.read_csv(CACHE_FILE_PATH)
    except Exception:
        # Initialize an empty DataFrame if the CSV doesn't exist
        cache_df = pd.DataFrame(
            columns=[
                "card",
                "model",
                "dataset_name",
                "benchmark_criteria_name",
                "evalassist_criteria_name",
                "raw_results",
                "provider",
                "annotation",
            ]
        )

    # Get a list of previously run card-model pairs
    ran_cards_models = [
        (card, model, annotation)
        for card, model, annotation in zip(
            ran_results_df["card"].to_list(),
            ran_results_df["model"].to_list(),
            ran_results_df["annotation"].to_list(),
        )
    ]

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = []
        for card in all_benchmarks:
            # Load the dataset for the current card
            dataset = load_dataset(
                card=card,
                split="test",
                loader_limit=INSTANCES_PER_DATASET,
                use_cache=True,
            )
            for model in MODELS:
                if model in inference_engines:
                    inference_engine = inference_engines[model]
                else:
                    api_key = next(api_key_cycle)
                    inference_engine = CrossProviderInferenceEngine(
                        model=model,
                        provider="rits",
                        temperature=0,
                        max_tokens=2048,
                        cache_batch_size=BATCH_SIZE * 2,
                        credentials={"api_key": api_key}
                        if api_key is not None
                        else None,
                        data_classification_policy=["public"],
                    )
                    inference_engines[model] = inference_engine

                # Skip if the benchmark has already been run
                if (card, model, "1.26.4") not in ran_cards_models:
                    # Submit the task to the executor
                    futures.append(
                        executor.submit(
                            run_single_model_card,
                            card,
                            dataset,
                            model,
                            inference_engine,
                        )
                    )
                else:
                    print(f"Benchmark {card}/{model}/1.26.4 already run")

                # if (card, model, "experimental") not in ran_cards_models:
                #     # Submit the task to the executor
                #     futures.append(
                #         executor.submit(
                #             run_single_model_card_experimental,
                #             card,
                #             dataset,
                #             model,
                #             False,
                #             inference_engine,
                #         )
                #     )
                # else:
                #     print(f"Benchmark {card}/{model}/experimental already run")

                # if (card, model, "experimental_with_persona") not in ran_cards_models:
                #     # Submit the task to the executor
                #     futures.append(
                #         executor.submit(
                #             run_single_model_card_experimental,
                #             card,
                #             dataset,
                #             model,
                #             True,
                #             inference_engine,
                #         )
                #     )
                # else:
                #     print(f"Benchmark {card}/{model}/experimental already run")
        # Process the results as they become available
        for future in as_completed(futures):
            print("Adding results")
            benchmark_results, cache = future.result()
            if benchmark_results is not None:
                # Append the benchmark result to the DataFrame and save to CSV
                ran_results_df = pd.concat(
                    [ran_results_df, pd.DataFrame(benchmark_results)]
                )
                ran_results_df.to_csv(RESULTS_FILE_PATH, index=False, na_rep="null")
            if cache is not None:
                # Append the benchmark cache to the DataFrame and save to CSV
                cache_df = pd.concat([cache_df, pd.DataFrame([cache])])
                cache_df.to_csv(CACHE_FILE_PATH, index=False)
    print("Done running benchmarks")


if __name__ == "__main__":
    run_benchmarks()
    # results = pd.read_csv(RESULTS_FILE_PATH)
    # results = results.loc[results.annotation != "1.26.4"]
    # results.results = (
    #     results.results.apply(lambda x: json.loads(x))
    #     .apply(lambda x: x["accuracy"] if "accuracy" in x else x["spearman"])
    #     .to_list()
    # )

    # def process(x: pd.DataFrame):
    #     names_to_check = ["experimental", "experimental_with_persona"]
    #     exist = all(name in x["annotation"].values for name in names_to_check)

    #     if exist:
    #         exp = x.loc[x.annotation == "experimental"].results.to_list()[0]
    #         experimental_with_persona = x.loc[
    #             x.annotation == "experimental_with_persona"
    #         ].results.to_list()[0]
    #         return float(exp - experimental_with_persona)
    #     else:
    #         return None

    # results = results.groupby(["card", "model"]).apply(process).to_list()
    # print(results)
    # print(sum([r > 0 for r in results]) / len(results))
    # # exp_with_persona = results.loc[results.annotation == "experimental_with_persona"].results.apply(lambda x: json.loads(x)).apply(lambda x: x["accuracy"] if "accuracy" in x else x['spearman']).to_list()
    # # print(len(exp))
    # # print(len(exp_with_persona))
    # # print(sum([x > y for x, y in zip(exp, exp_with_persona)]) / len(exp))
    # # print(sum([x == y for x, y in zip(exp, exp_with_persona)]) / len(exp))
    # # print(sum([x < y for x, y in zip(exp, exp_with_persona)]) / len(exp))
