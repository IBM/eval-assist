import os
import sqlite3
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from unitxt.inference import CrossProviderInferenceEngine
from unitxt.settings_utils import get_constants

from ..const import EVAL_ASSIST_DIR
from ..judges import DirectJudge


def folder_exists_in_github_repo(owner, repo, folder_path, branch="main"):
    """
    Check if a folder exists in a GitHub repo.

    Parameters:
        owner (str): GitHub username or organization
        repo (str): Repository name
        folder_path (str): Path to folder in the repo (relative to root)
        branch (str): Branch name (default: 'main')

    Returns:
        bool: True if folder exists, False otherwise
    """
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{folder_path}?ref={branch}"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            # Make sure it's a directory
            items = response.json()
            return isinstance(items, list)
        else:
            return False
    except (
        requests.exceptions.ReadTimeout,
        requests.exceptions.Timeout,
        requests.exceptions.RequestException,
    ):
        return False


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


def get_judgebench_cards():
    constants = get_constants()
    if constants is None:
        raise ValueError("Error getting unitxt cards: constanst is None")
    judgebench_dir = os.path.join(
        constants.catalog_dir,  # ignore type
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


def get_judge_from_config(
    kwargs: tuple[type[DirectJudge], dict, dict, str],
    inference_engines={},
) -> DirectJudge:
    judge_klass, judge_kwargs, inference_engine_kwargs, model = kwargs
    temperature = (
        inference_engine_kwargs["temperature"]
        if "temperature" in inference_engine_kwargs
        else 0.0
    )
    key = f"{model}{str(temperature)}"
    if key in inference_engines:
        inference_engine = inference_engines[key]
    else:
        inference_engine = CrossProviderInferenceEngine(
            model=model,
            provider="rits",
            temperature=temperature,
            max_tokens=2048,
            cache_batch_size=50,
            data_classification_policy=["public"],
        )
        inference_engines[key] = inference_engine

    return judge_klass(
        inference_engine=inference_engine,
        **judge_kwargs,
    )


def save_results_to_sqlite(result_backup: list[dict]):
    db_path = EVAL_ASSIST_DIR / "benchmark" / "results_backup.db"
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Create table if it doesn’t exist
    cur.execute("""
    CREATE TABLE IF NOT EXISTS evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        judge TEXT NOT NULL,
        model TEXT,
        card TEXT NOT NULL,
        sample_index INTEGER NOT NULL,
        instance TEXT,
        result TEXT,
        prediction REAL,
        ground_truth REAL,
        failed BOOLEAN,
        UNIQUE(judge, model, card, sample_index) ON CONFLICT REPLACE
    )
    """)

    cur.executemany(
        """
    INSERT INTO evaluations (
        judge, model, card, sample_index,
        instance, result, prediction, ground_truth, failed
    ) VALUES (
        :judge, :model, :card, :sample_index,
        :instance, :result, :prediction, :ground_truth, :failed
    )
    """,
        result_backup,
    )

    conn.commit()
    conn.close()
