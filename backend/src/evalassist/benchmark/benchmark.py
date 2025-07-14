import ast
import json
import os

import pandas as pd
from evalassist.const import EVAL_ASSIST_DIR
from evalassist.utils import folder_exists_in_github_repo
from unitxt.api import evaluate, load_dataset
from unitxt.inference import MetricInferenceEngine
from unitxt.llm_as_judge import EvaluatorTypeEnum
from unitxt.settings_utils import get_constants

RESULTS_FILE_PATH = EVAL_ASSIST_DIR / "benchmark" / "benchmark_results.csv"
TO_INSPECT_FILE_PATH = EVAL_ASSIST_DIR / "benchmark" / "to_inspect.csv"


def get_all_benchmarks():
    df = pd.read_csv(RESULTS_FILE_PATH)
    results = {}
    for row in df.to_dict(orient="records"):
        card = row["card"]
        benchmark_name = "/".join(card.split(".")[2:-1])
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
            model_results = {"name": model, "results": ast.literal_eval(row["results"])}
            criteria_benchmark["evaluator_benchmarks"][model] = model_results
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


def run_benchmarks():
    while True:
        models = [
            "watsonx.llama3_3_70b",
            "rits.llama4_maverick",
            "rits.granite3_3_8b",
            "rits.deepseek_v3",
            "rits.llama4_scout",
        ]

        params = "[criteria_field=criteria,context_fields=None,include_prompts_in_result=true]"
        try:
            ran_results_df = pd.read_csv(RESULTS_FILE_PATH)
        except Exception:
            ran_results_df = pd.DataFrame(
                columns=["card", "model", "criteria", "results", "provider"]
            )

        try:
            to_inspect_df = pd.read_csv(TO_INSPECT_FILE_PATH)
        except Exception:
            to_inspect_df = pd.DataFrame(
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
        ran_cards = ran_results_df["card"].to_list()
        inspect_df_rows = []
        benchmark_results = []

        for card in get_judgebench_cards()[::-1]:
            if card in ran_cards:
                print("already ran")
                continue
            dataset = load_dataset(
                card=card, split="test", loader_limit=50, use_cache=True
            )
            for model in models:
                print("Running card:", card, "with model:", model)
                metric_inference_engine = MetricInferenceEngine(
                    metric=f"metrics.llm_as_judge.direct.{model}{params}",
                    cache_batch_size=25,
                )
                predictions = metric_inference_engine.infer(dataset)
                criteria_name = json.loads(
                    predictions[0][
                        next(
                            iter(
                                [
                                    key
                                    for key in predictions[0]
                                    if key.endswith("_criteria")
                                ]
                            )
                        )
                    ]
                )["name"]

                parsed_predictions = [p[criteria_name] for p in predictions]
                results = evaluate(predictions=parsed_predictions, data=dataset)

                metric_names = [m.split(".")[1] for m in results[0]["metrics"]]
                if "spearman" in metric_names:
                    pass
                parsed_results = {
                    metric_name: float(
                        results.global_scores[
                            metric_name if metric_name != "spearman" else "spearmanr"
                        ]
                    )
                    for metric_name in metric_names
                }
                benchmark_result = {
                    "card": card,
                    "model": model.split(".")[1],
                    "provider": model.split(".")[0],
                    "criteria": criteria_name,
                    "results": parsed_results,
                }
                benchmark_results.append(benchmark_result)

                for i, (d, p) in enumerate(zip(dataset, predictions)):
                    task_data = json.loads(d["task_data"])
                    if "label_value" in task_data:
                        is_ground_truth_categorical = True
                        ground_truth_score = task_data["label_value"]
                    else:
                        is_ground_truth_categorical = False
                        ground_truth_score = task_data["mean_score"]
                    pred_score = parsed_predictions[i]
                    # if (is_ground_truth_categorical and ground_truth != pred) or (
                    #     not is_ground_truth_categorical and abs(ground_truth - pred) > 0.2
                    # ):
                    if True:
                        context = {
                            k[len(criteria_name) + 1 :]
                            if k != criteria_name
                            else "score": v
                            for k, v in p.items()
                        }
                        criteria = json.loads(context["criteria"])
                        del criteria["__type__"]
                        for option in criteria["options"]:
                            del option["__type__"]
                        answer_selection_messages = [
                            message["content"]
                            for message in context["prompts"]["option_selection"]
                        ]
                        answer_selection_messages.append(
                            context["option_selection_completion"]
                        )
                        whole_conversation = "\n\n\n".join(answer_selection_messages)

                        inverse_option_map = {
                            v: k for k, v in criteria["option_map"].items()
                        }
                        ground_truth = None
                        if is_ground_truth_categorical:
                            ground_truth = inverse_option_map[ground_truth_score]
                        pred = inverse_option_map[pred_score]

                        row = {
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
                            "raw_context": json.dumps(context),
                        }
                        inspect_df_rows.append(row)

                df = pd.concat(
                    [to_inspect_df, pd.DataFrame(inspect_df_rows)], ignore_index=True
                )
                df.to_csv(TO_INSPECT_FILE_PATH, index=False)

                df = pd.concat(
                    [ran_results_df, pd.DataFrame(benchmark_results)], ignore_index=True
                )
                df.to_csv(RESULTS_FILE_PATH, index=False)


if __name__ == "__main__":
    run_benchmarks()
