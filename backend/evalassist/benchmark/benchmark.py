import json
import os


def get_all_benchmarks():
    # merged_benchmarks is a dict of keys [tuple(benchmarkName, benchmarkType)]
    # the evaluatorBenchmarks field may contain evaluator reports from several laaj versions
    # the frontend will filter this to only show last version per evaluator id
    # this allows to easily compare the performance of several versions in the future
    merged_benchmarks_dict = {}
    walk_results = list(
        os.walk(os.path.join(os.path.dirname(__file__), "data", "results"))
    ) + list(
        os.walk(os.path.join(os.path.dirname(__file__), "data", "judgebench-results"))
    )

    for root, dirs, files in walk_results:
        for file in files:
            if file.endswith(".json"):
                file_path = os.path.join(root, file)
                with open(file_path, "r") as f:
                    try:
                        to_merge_benchmark = json.load(f)
                        # check if benchmark was already added
                        if (
                            to_merge_benchmark["name"],
                            to_merge_benchmark["type"],
                        ) in merged_benchmarks_dict:
                            # it exists, add the evaluator benchmarks to the appropriate
                            # criteriaBenchmarks.evaluatorBenchmarks list
                            merged_benchmark = merged_benchmarks_dict[
                                (to_merge_benchmark["name"], to_merge_benchmark["type"])
                            ]
                            for criteriaBenchmark in merged_benchmark[
                                "criteriaBenchmarks"
                            ]:
                                criteriaName = criteriaBenchmark["name"]
                                to_merge_criteria_benchmark = [
                                    criteriaBenchmark
                                    for criteriaBenchmark in to_merge_benchmark[
                                        "criteriaBenchmarks"
                                    ]
                                    if criteriaBenchmark["name"] == criteriaName
                                ][0]
                                criteriaBenchmark["evaluatorBenchmarks"].extend(
                                    to_merge_criteria_benchmark["evaluatorBenchmarks"]
                                )
                        else:
                            merged_benchmarks_dict[
                                (to_merge_benchmark["name"], to_merge_benchmark["type"])
                            ] = to_merge_benchmark
                    except json.JSONDecodeError as e:
                        print(f"Error reading {file_path}: {e}")

    # response = list(merged_benchmarks_dict.values())
    # return response
    return []
