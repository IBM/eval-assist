from evalassist.benchmark import run_benchmarks
from evalassist.judges import DirectJudge, SimpleDirectJudge

if __name__ == "__main__":
    MAX_WORKERS = 15
    BATCH_SIZE = 50
    RITS_API_KEYS = None
    INSTANCES_PER_DATASET = None

    # List of models to benchmark
    MODELS = [
        "gpt-oss-120b",
        "llama-3-3-70b-instruct",
        "llama-4-scout",
        "llama-4-maverick",
        "granite-3-3-8b-instruct",
        "deepseek-v3",
        "phi-4",
        "mistral-small-instruct",
    ]

    # List of judges to benchmark
    JUDGES: list[type[DirectJudge]] = [
        # UnitxtDirectJudge,
        SimpleDirectJudge,
        # ThesisAntithesisDirectJudge,
    ]
    run_benchmarks(
        models=MODELS,
        judges=JUDGES,
        max_workers=MAX_WORKERS,
        batch_size=BATCH_SIZE,
        rits_api_keys=RITS_API_KEYS,
        instances_per_dataset=INSTANCES_PER_DATASET,
        dataset_keyword_filters=["biggen"],
    )
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
