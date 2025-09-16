import json
import logging
import traceback
from concurrent.futures import ThreadPoolExecutor
from typing import cast

from datasets import IterableDataset
from evalassist.judges import Criteria
from evalassist.judges.types import InstanceWithGroundTruth
from unitxt.api import evaluate, load_dataset
from unitxt.artifact import fetch_artifact
from unitxt.llm_as_judge import CriteriaWithOptions

from ..const import EVAL_ASSIST_DIR
from ..judges import BaseDirectJudge
from ..judges.types import DirectInstance, DirectInstanceResult
from ..utils import convert_nan_to_none, unitxt_dataset_to_evalassist_instances
from .utils import (
    add_judgebench_readme_urls,
    add_tag_to_result,
    add_url_to_result,
    get_benchmark_results_as_df,
    get_judge_from_config,
    get_judgebench_cards,
    save_evaluation_backup_to_sqlite,
    save_results_to_sqlite,
)

RESULTS_FILE_PATH = EVAL_ASSIST_DIR / "benchmark" / "benchmark_results.csv"
CACHE_FILE_PATH = EVAL_ASSIST_DIR / "benchmark" / "benchmark_results_cache.csv"

logger = logging.getLogger(__name__)


def get_all_benchmarks():
    df = get_benchmark_results_as_df()
    benchmarks = {}
    for row in df.to_dict(orient="records"):
        card: str = row["card"]
        benchmark_name: str = row["benchmark_name"]
        dataset_name: str = row["dataset_name"]
        judge: str = row["judge"]
        model: str = row["model"]
        results: str = row["results"]
        dataset_len: str = row["dataset_len"]
        group_by_field: str = (
            row["group_by_field"] if row["group_by_value"] is not None else "overall"
        )
        group_by_value: str = (
            row["group_by_value"] if row["group_by_field"] is not None else "overall"
        )
        benchmark_id = benchmark_name + "/" + dataset_name

        if benchmark_id not in benchmarks:
            benchmark_results = {
                "benchmark_name": benchmark_name,
                "dataset_name": dataset_name,
                "display_name": (
                    benchmark_name + "." if benchmark_name != "judge_bench" else ""
                )
                + dataset_name,  # don't include the benchmark name in the display name if it is judge_bench
                "description": "",
                "catalog_url": f"https://www.unitxt.ai/en/latest/catalog/catalog.{card}.html",
                "type": "direct",
                "tags": [benchmark_name],
                "group_by_fields": {},
            }

            benchmarks[benchmark_id] = benchmark_results

        benchmark_results = benchmarks[benchmark_id]

        if group_by_field not in benchmark_results["group_by_fields"]:
            benchmark_results["group_by_fields"][group_by_field] = {}

        group_by_field_results = benchmark_results["group_by_fields"][group_by_field]

        if group_by_value not in group_by_field_results:
            group_by_value_results = {
                "judge_results": {},
                "dataset_len": dataset_len,
                "group_by_value": group_by_value,
            }
            group_by_field_results[group_by_value] = group_by_value_results

        group_by_value_results = group_by_field_results[group_by_value]
        judge_model_key = f"{judge}/{model}"
        group_by_value_results["judge_results"][judge_model_key] = {
            "model": model,
            "judge": judge,
            "results": json.loads(results),
        }

    # add benchmark to the name if it only has one dataset
    datasets_per_benchmarks = {}
    for r in benchmarks.values():
        if r["benchmark_name"] not in datasets_per_benchmarks:
            datasets_per_benchmarks[r["benchmark_name"]] = []
        if r["dataset_name"] not in datasets_per_benchmarks[r["benchmark_name"]]:
            datasets_per_benchmarks[r["benchmark_name"]].append(r["dataset_name"])

    add_judgebench_readme_urls(benchmarks)
    add_tag_to_result(benchmarks, "roscoe", "reasoning")
    add_tag_to_result(benchmarks, "wmt", "translation")
    add_tag_to_result(benchmarks, "cola", "grammar")

    add_url_to_result(
        benchmarks,
        "biggen",
        "https://huggingface.co/datasets/prometheus-eval/BiGGen-Bench-Results/viewer/default/human_eval",
    )

    return benchmarks


metric_map = {
    "pearson": "pearsonr",
    "spearman": "spearmanr",
}


def parse_and_store_results(
    card: str,
    dataset: IterableDataset,
    instances: list[DirectInstance],
    results: list[DirectInstanceResult],
    judge: BaseDirectJudge,
    add_in_context_examples: bool,
):
    criteria_names = []
    for result in results:
        if result.criteria is not None and result.criteria.name is None:
            raise ValueError(
                "Criteria doesn't have a name. When benchmarking, it is required."
            )
        criteria_names.append(cast(str, cast(Criteria, result.criteria).name))

    if any(result.score is None for result in results):
        raise ValueError("Score is None!")

    prediction_scores: list[float] = [cast(float, result.score) for result in results]

    str_prediction_scores = [str(p) for p in prediction_scores]

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
    parsed_metric_results = {
        metric_name: float(
            evaluation_results.global_scores[metric_map.get(metric_name, metric_name)]
        )
        for metric_name in metric_names
    }

    # Store the positional bias rate in the parsed results
    parsed_metric_results["positional_bias_rate"] = positional_bias_rate

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
    judge_descriptor = judge.get_descriptor()
    benchmark_result: dict[str, str | None] = {
        "card": card,  # if there are several criteria, we have to add the overall result
        "benchmark_name": benchmark_name,
        "dataset_name": dataset_name,
        "judge": f"{judge_descriptor.name}" + "_with_examples"
        if add_in_context_examples
        else "",
        "model": judge.get_descriptor().inference_engine_id,
        "results": json.dumps(convert_nan_to_none(parsed_metric_results)),
        "dataset_len": str(evaluation_results.global_scores["num_of_instances"]),
        "group_by_field": None,
        "group_by_value": None,
    }

    benchmark_results: list = []
    benchmark_results.append(benchmark_result)
    for (
        group_by_field,
        group_by_field_scores,
    ) in evaluation_results.groups_scores.items():
        for group_by_value, group_by_value_scores in group_by_field_scores.items():
            parsed_metric_results: dict[str, float | None] = {
                metric_name: float(
                    group_by_value_scores[metric_map.get(metric_name, metric_name)]
                )
                for metric_name in metric_names
            }
            parsed_metric_results["positional_bias_rate"] = None
            group_by_field_corrected = (
                group_by_field if group_by_field != "criteria/name" else "criteria"
            )
            per_criteria_benchmark_result: dict[str, str | None] = {
                "card": card,  # if there are several criteria, we have to add the overall result
                "benchmark_name": benchmark_name,
                "dataset_name": dataset_name,
                "judge": f"{judge_descriptor.name}_with_examples",
                "model": judge_descriptor.inference_engine_id,
                "results": json.dumps(convert_nan_to_none(parsed_metric_results)),
                "dataset_len": str(group_by_value_scores["num_of_instances"]),
                "group_by_field": group_by_field_corrected,
                "group_by_value": group_by_value,
            }
            if (
                group_by_field_corrected == "criteria"
                and benchmark_name == " biggen_bench"
            ):
                per_criteria_benchmark_result["group_by_value"] = cast(
                    str, per_criteria_benchmark_result["group_by_value"]
                ).split("-")[0]  # we leave the task and discard the capability
            benchmark_results.append(per_criteria_benchmark_result)

    ground_truth = [float(d["target"]) for d in dataset]
    result_backup: list[dict] = [
        {
            "card": card,
            "judge": f"{judge_descriptor.name}_with_examples",
            "model": judge_descriptor.inference_engine_id,
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

    # there is only one grouped by result: so the list contains the overall result and a single criteria result, we keep the later
    # and set the benchmark criteria name from the card name
    if len(benchmark_results) == 2:
        benchmark_results = [benchmark_results[1]]
        benchmark_criteria_name = (
            card.split(".")[-1]
            if benchmark_name.startswith("judge_bench")
            else criteria_names[0]
        )
        benchmark_results[0]["group_by_value"] = benchmark_criteria_name

    save_evaluation_backup_to_sqlite(result_backup)
    save_results_to_sqlite(benchmark_results)


def add_examples(
    instances: list[DirectInstance], criteria: list[Criteria], ground_truth: list[float]
):
    d = {}
    for instance, criterion, label in zip(instances, criteria, ground_truth):
        if criterion.name not in d:
            d[criterion.name] = {
                "criteria": criterion,
                "instances": [],
                "ground_truth": [],
            }
        if label not in d[criterion.name]["ground_truth"]:
            d[criterion.name]["instances"].append(instance)
            d[criterion.name]["ground_truth"].append(label)
    for k, v in d.items():
        v["examples"] = [
            InstanceWithGroundTruth(
                instance=instance,
                ground_truth=next(
                    iter(
                        option.name
                        for option in v["criteria"].options
                        if option.score == ground_truth
                    )
                ),
            )
            for instance, ground_truth in zip(v["instances"], v["ground_truth"])
        ]
    for criterion in criteria:
        criterion.examples = d[criterion.name]["examples"]


def run_single_model_card(
    card: str,
    judge: BaseDirectJudge,
    add_in_context_examples: bool,
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

    try:
        group_by_fields = ["criteria/name"]
        if "biggen" in card:
            group_by_fields = group_by_fields + ["language", "capability"]
        try:
            dataset: IterableDataset = cast(
                IterableDataset,
                load_dataset(
                    card=card,
                    split="test",
                    loader_limit=instances_per_dataset,
                    use_cache=True,
                    group_by=group_by_fields,
                ),
            )
        except ValueError:
            group_by_fields[0] = "criteria"
            dataset: IterableDataset = cast(
                IterableDataset,
                load_dataset(
                    card=card,
                    split="test",
                    loader_limit=instances_per_dataset,
                    use_cache=True,
                    group_by=group_by_fields,
                ),
            )
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

        ground_truth = [float(d["target"]) for d in dataset]

        add_examples(parsed_dataset, criteria, ground_truth)

        results: list[DirectInstanceResult] = judge(
            parsed_dataset, criteria, check_positional_bias=False
        )

        parse_and_store_results(
            card=card,
            dataset=dataset,
            instances=parsed_dataset,
            results=results,
            judge=judge,
            add_in_context_examples=add_in_context_examples,
        )
        print("Finished running card:", card, "with judge:", judge.get_descriptor())
    except Exception:
        print(f"FAILED! judege: {str(judge.get_descriptor())}")
        print(traceback.format_exc())


def run_benchmarks(
    judge_configs: list[tuple[type[BaseDirectJudge], dict, dict, str]],
    max_workers: int,
    instances_per_dataset: int | None,
    add_in_context_examples: bool = False,
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
                # if not is_result_available(
                #     judge.get_name(),
                #     judge.get_descriptor().inference_engine_id,
                #     card,
                # ):
                if True:
                    # Submit the task to the executor
                    futures.append(
                        executor.submit(
                            run_single_model_card,
                            card,
                            judge,
                            add_in_context_examples,
                            instances_per_dataset,
                        )
                    )
                else:
                    print(
                        f"Benchmark {card}/{judge.get_descriptor()}/{judge.get_name()} already ran"
                    )
    print("Done running benchmarks")
