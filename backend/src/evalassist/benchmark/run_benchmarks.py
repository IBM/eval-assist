from itertools import cycle

from evalassist.benchmark import run_benchmarks
from evalassist.judges import DirectJudge, SimpleDirectJudge, UnitxtDirectJudge

if __name__ == "__main__":
    MAX_WORKERS = 7
    BATCH_SIZE = 25
    RITS_API_KEYS = None
    INSTANCES_PER_DATASET = 200
    # List of models to benchmark
    MODELS = [
        # "gpt-oss-120b",
        "llama-3-3-70b-instruct",
        "llama-4-scout",
        "llama-4-maverick",
        "granite-3-3-8b-instruct",
        "deepseek-v3",
        "phi-4",
        "mistral-small-instruct",
    ]
    api_key_cycle = cycle(RITS_API_KEYS if RITS_API_KEYS is not None else [None])

    inference_engines = {}
    JUDGE_CONFIGS: list[tuple[type[DirectJudge], dict, dict]] = [
        # (
        #     SimpleDirectJudge,
        #     {
        #         "generate_synthetic_persona": True,
        #         "use_self_consistency": True,
        #     },
        #     {
        #         'temperature': 0.3,
        #     },
        # ),
        # (
        #     SimpleDirectJudge,
        #     {
        #         "generate_synthetic_persona": False,
        #         "use_self_consistency": True,
        #     },
        #     {
        #         'temperature': 0.3,
        #     },
        # ),
        # (
        #     SimpleDirectJudge,
        #     {
        #         "generate_synthetic_persona": True,
        #         "use_self_consistency": False,
        #     },
        #     {
        #         'temperature': 0.0,
        #     },
        # ),
        (
            SimpleDirectJudge,
            {
                "generate_synthetic_persona": False,
                "use_self_consistency": False,
            },
            {
                "temperature": 0.0,
            },
        ),
        (UnitxtDirectJudge, {}, {}),
        # (ThesisAntithesisDirectJudge, {}, {}),
    ]
    JUDGE_CONFIGS_WITH_MODEL: list[tuple[type[DirectJudge], dict, dict, str]] = []
    for judge_config in JUDGE_CONFIGS:
        for model in MODELS:
            new_tuple = judge_config + (model,)
            JUDGE_CONFIGS_WITH_MODEL.append(new_tuple)

    run_benchmarks(
        judge_configs=JUDGE_CONFIGS_WITH_MODEL,
        max_workers=MAX_WORKERS,
        instances_per_dataset=INSTANCES_PER_DATASET,
        dataset_keyword_filters=["drop", "esnli", "biggen"],
        # dataset_keyword_selectors=["cola"],
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
