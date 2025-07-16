import json
import logging
import math
import os
from concurrent.futures import ProcessPoolExecutor, as_completed
from itertools import cycle
from typing import cast

import pandas as pd
from evalassist.const import EVAL_ASSIST_DIR
from evalassist.utils import folder_exists_in_github_repo
from scipy.stats import pearsonr
from unitxt.api import evaluate, load_dataset
from unitxt.artifact import fetch_artifact
from unitxt.inference import LiteLLMInferenceEngine, MetricInferenceEngine
from unitxt.llm_as_judge import CriteriaWithOptions, EvaluatorTypeEnum, LLMJudge
from unitxt.settings_utils import get_constants

RESULTS_FILE_PATH = EVAL_ASSIST_DIR / "benchmark" / "benchmark_results.csv"
INSPECT_FILE_PATH = EVAL_ASSIST_DIR / "benchmark" / "to_inspect.csv"
MAX_WORKERS = 20
BATCH_SIZE = 25

logger = logging.getLogger(__name__)


def add_tag_to_result(results, keyword, tag_or_tags):
    for k in results.keys():
        print("results[k]")
        print(results[k])
        if keyword in results[k]["name"]:
            if isinstance(tag_or_tags, list):
                results[k]["tags"].extend(tag_or_tags)
            else:
                results[k]["tags"].append(tag_or_tags)


def get_all_benchmarks():
    try:
        df = pd.read_csv(RESULTS_FILE_PATH)
    except FileNotFoundError:
        return {}
    results = {}
    for row in df.to_dict(orient="records"):
        card = row["card"]
        benchmark_name = ".".join(card.split(".")[2:-1])
        if benchmark_name not in results:
            dataset_name = card.split(".")[2]
            exists = folder_exists_in_github_repo(
                "dmg-illc", "JUDGE-BENCH", f"data/{dataset_name}", "master"
            )
            readme_url = f"https://github.com/dmg-illc/JUDGE-BENCH/blob/master/data/{dataset_name}/README.md"
            if not exists:
                dataset_name = card.split(".")[2].replace("_", "-")
                exists = folder_exists_in_github_repo(
                    "dmg-illc", "JUDGE-BENCH", f"data/{dataset_name}", "master"
                )
                readme_url = f"https://github.com/dmg-illc/JUDGE-BENCH/blob/master/data/{dataset_name}/README.md"
            if not exists:
                readme_url = None

            benchmark_results = {
                "name": benchmark_name,
                "description": "",
                "catalog_url": f"https://www.unitxt.ai/en/latest/catalog/catalog.{card}.html",
                "readme_url": readme_url,
                "type": EvaluatorTypeEnum.DIRECT,
                "tags": [],
                "criteria_benchmarks": {},
            }

            results[benchmark_name] = benchmark_results

        benchmark_results = results[benchmark_name]

        criteria_benchmark_name = card.split(".")[-1]

        if criteria_benchmark_name not in benchmark_results["criteria_benchmarks"]:
            criteria_benchmark = {
                "evaluator_benchmarks": {},
                "name": criteria_benchmark_name,
                "catalog_criteria_name": row["criteria"],
            }
            benchmark_results["criteria_benchmarks"][criteria_benchmark_name] = (
                criteria_benchmark
            )

        criteria_benchmark = benchmark_results["criteria_benchmarks"][
            criteria_benchmark_name
        ]
        model = row["model"]
        if model not in criteria_benchmark["evaluator_benchmarks"]:
            model_results = {"name": model, "results": json.loads(row["results"])}
            criteria_benchmark["evaluator_benchmarks"][model] = model_results

    add_tag_to_result(results, "roscoe", "reasoning")
    add_tag_to_result(results, "wmt", "translation")
    add_tag_to_result(results, "cola", "grammar")
    # add_tag_to_result(results, 'cola', 'grammar')

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


def run_single_model_card(card: str, dataset, model: str, api_key: str):
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
    try:
        evaluator_params = "[criteria_field=criteria,context_fields=None,include_prompts_in_result=true]"
        metric = f"metrics.llm_as_judge.direct.{model}{evaluator_params}"
        metric = fetch_artifact(metric)[0]
        judge = cast(LLMJudge, metric)
        inference_engine = cast(LiteLLMInferenceEngine, judge.inference_engine)
        inference_engine.cache_batch_size = BATCH_SIZE * 2  # because of positional bias
        if api_key:
            inference_engine.credentials = {"api_key": api_key}
        judge.inference_engine = inference_engine
        metric_inference_engine = MetricInferenceEngine(
            metric=judge,
            cache_batch_size=BATCH_SIZE,
        )
        predictions = metric_inference_engine.infer(dataset)
        # Extract the criteria name from the first prediction
        criteria_name = json.loads(
            predictions[0][
                next(iter([key for key in predictions[0] if key.endswith("_criteria")]))
            ]
        )["name"]

        # Calculate positional bias rate
        positional_bias = [p[f"{criteria_name}_positional_bias"] for p in predictions]
        positional_bias_rate = sum(positional_bias) / len(positional_bias)

        # Evaluate the predictions against the dataset
        parsed_predictions = [p[criteria_name] for p in predictions]
        results = evaluate(predictions=parsed_predictions, data=dataset)

        # Extract metric names from the evaluation results
        metric_names = [m.split(".")[1] for m in results[0]["metrics"]]

        # Parse the evaluation results into a dictionary
        parsed_results = {
            metric_name: float(
                results.global_scores[
                    metric_name if metric_name != "spearman" else "spearmanr"
                ]
            )
            for metric_name in metric_names
        }
        # Store the positional bias rate in the parsed results
        parsed_results["positional_bias_rate"] = positional_bias_rate
        criteria = cast(
            CriteriaWithOptions,
            fetch_artifact(predictions[0][f"{criteria_name}_criteria"])[0],
        )
        prediction_field = criteria.prediction_field
        responses_to_evaluate = []
        raw_context_lens = []
        has_context = False
        if len(criteria.context_fields) > 0:
            has_context = True

        agreements = []
        inspect_rows = []
        for i, (d, p) in enumerate(zip(dataset, predictions)):
            task_data = json.loads(d["task_data"])
            responses_to_evaluate.append(task_data[prediction_field])

            if "label_value" in task_data:
                is_ground_truth_categorical = True
                ground_truth_score = task_data["label_value"]
            else:
                is_ground_truth_categorical = False
                ground_truth_score = task_data["mean_score"]

            pred_score = parsed_predictions[i]

            agreements.append(
                (pred_score == ground_truth_score)
                if is_ground_truth_categorical
                else 1 - abs(pred_score - ground_truth_score)
            )

            # if (is_ground_truth_categorical and ground_truth != pred) or (
            #     not is_ground_truth_categorical and abs(ground_truth - pred) > 0.2
            # ):
            if True:
                context = {
                    k[len(criteria_name) + 1 :] if k != criteria_name else "score": v
                    for k, v in p.items()
                }
                criteria_json = criteria.to_dict()
                del criteria_json["__type__"]
                for option in criteria_json["options"]:
                    del option["__type__"]
                answer_selection_messages = [
                    message["content"]
                    for message in context["prompts"]["option_selection"]
                ]
                answer_selection_messages.append(context["option_selection_completion"])
                whole_conversation = "\n\n\n".join(answer_selection_messages)

                inverse_option_map = {v: k for k, v in criteria.option_map.items()}
                ground_truth = None
                if is_ground_truth_categorical:
                    ground_truth = inverse_option_map[ground_truth_score]
                pred = inverse_option_map[pred_score]

                raw_context = json.dumps(context)
                if has_context:
                    raw_context_lens.append(
                        sum([len(task_data[c]) for c in criteria.context_fields])
                    )
                inspect_row = {
                    "card": ".".join(card.split(".")[2:]),
                    "model": model,
                    "ground_truth_score": ground_truth_score,
                    "judge_prediction_score": pred_score,
                    "ground_truth": ground_truth,
                    "judge_prediction": pred,
                    "criteria": criteria,
                    "judge_reasoning": whole_conversation,
                    "positional_bias": "Detected"
                    if context["positional_bias"]
                    else "Not detected",
                    "raw_context": raw_context,
                }
                inspect_rows.append(inspect_row)
    except Exception as e:
        logger.critical("FAILED!!")
        logger.critical(e)

    responses_to_evaluate_lens = [len(r) for r in responses_to_evaluate]
    corr_reponse_length_with_accuracy = float(
        pearsonr(agreements, responses_to_evaluate_lens).correlation
    )
    corr_context_length_with_accuracy = (
        float(pearsonr(agreements, raw_context_lens).correlation)
        if has_context
        else None
    )
    corr_response_length_with_pos_bias = float(
        pearsonr(positional_bias, responses_to_evaluate_lens).correlation
    )
    corr_context_length_with_pos_bias = (
        float(pearsonr(positional_bias, raw_context_lens).correlation)
        if has_context
        else None
    )
    parsed_results["corr_reponse_length/accuracy"] = (
        corr_reponse_length_with_accuracy
        if corr_reponse_length_with_accuracy is None
        or not math.isnan(corr_reponse_length_with_accuracy)
        else None
    )
    parsed_results["corr_context_length/accuracy"] = (
        corr_context_length_with_accuracy
        if corr_context_length_with_accuracy is None
        or not math.isnan(corr_context_length_with_accuracy)
        else None
    )
    parsed_results["corr_response_length/pos_bias"] = (
        corr_response_length_with_pos_bias
        if corr_response_length_with_pos_bias is None
        or not math.isnan(corr_response_length_with_pos_bias)
        else None
    )
    parsed_results["corr_context_length/pos_bias"] = (
        corr_context_length_with_pos_bias
        if corr_context_length_with_pos_bias is None
        or not math.isnan(corr_context_length_with_pos_bias)
        else None
    )

    benchmark_result = {
        "card": card,
        "model": model.split(".")[1],
        "provider": model.split(".")[0],
        "criteria": criteria_name,
        "results": json.dumps(parsed_results),
    }

    return benchmark_result, inspect_rows


def run_benchmarks():
    RITS_API_KEYS = [None]
    """
    Runs multiple benchmarks in parallel using a process pool executor.

    This function retrieves a list of JudgeBench cards, loads the corresponding datasets,
    and then submits tasks to the executor to run each benchmark with different models.

    The results are saved to CSV files specified by RESULTS_FILE_PATH and INSPECT_FILE_PATH.
    """
    api_key_cycle = cycle(RITS_API_KEYS)

    models = [
        "rits.llama3_3_70b",
        "rits.llama4_maverick",
        "rits.granite3_3_8b",
        "rits.deepseek_v3",
        "rits.llama4_scout",
    ]

    try:
        ran_results_df = pd.read_csv(RESULTS_FILE_PATH)
    except Exception:
        ran_results_df = pd.DataFrame(
            columns=["card", "model", "criteria", "results", "provider"]
        )

    try:
        inspect_df = pd.read_csv(INSPECT_FILE_PATH)
    except Exception:
        inspect_df = pd.DataFrame(
            columns=[
                "card",
                "model",
                "ground_truth",
                "judge_prediction",
                "criteria",
                "judge_reasoning",
                "positional_bias",
                "raw_context",
            ]
        )
    ran_cards_models = [
        (card, model)
        for card, model in zip(
            ran_results_df["card"].to_list(), ran_results_df["model"].to_list()
        )
    ]
    with ProcessPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = []
        for card in get_judgebench_cards():
            dataset = load_dataset(
                card=card, split="test", loader_limit=200, use_cache=True
            )
            for model in models:
                if (card, model.split(".")[1]) in ran_cards_models:
                    print(f"Benchmark {card}/{model} already run")
                    continue
                futures.append(
                    executor.submit(
                        run_single_model_card, card, dataset, model, next(api_key_cycle)
                    )
                )

        for future in as_completed(futures):
            benchmark_result, inspect_rows = future.result()
            if benchmark_result is not None:
                ran_results_df = pd.concat(
                    [ran_results_df, pd.DataFrame([benchmark_result])]
                )
                ran_results_df.to_csv(RESULTS_FILE_PATH, index=False)
            if inspect_rows:
                inspect_df = pd.concat([inspect_df, pd.DataFrame(inspect_rows)])
                inspect_df.to_csv(INSPECT_FILE_PATH, index=False)
    print("Done running benchmarks")


if __name__ == "__main__":
    run_benchmarks()
