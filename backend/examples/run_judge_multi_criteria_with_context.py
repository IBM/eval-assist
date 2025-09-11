from evalassist.judges import DirectInstance, DirectJudge
from evalassist.judges.const import DEFAULT_JUDGE_INFERENCE_PARAMS
from evalassist.judges.types import (
    Criteria,
    CriteriaOption,
    MultiCriteria,
    MultiCriteriaDirectInstanceResult,
    MultiCriteriaItem,
)
from unitxt.inference import CrossProviderInferenceEngine

judge = DirectJudge(
    inference_engine=CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        **DEFAULT_JUDGE_INFERENCE_PARAMS,
        provider_specific_args={
            "watsonx": {
                "max_requests_per_second": 8,
            }
        },
    ),
    generate_feedback=True,
)

criteria_a = Criteria(
    name="Self-explanatory",
    description="Is the text self-explanatory and self-contained?",
    options=[
        CriteriaOption(name="Yes", description="", score=1.0),
        CriteriaOption(name="No", description="", score=0.0),
    ],
    prediction_field="response",
    context_fields=["reference_text"],
)

criteria_b = Criteria(
    name="Consistent",
    description="Does the text maintain internal consistency?",
    options=[
        CriteriaOption(name="Yes", description="", score=1.0),
        CriteriaOption(name="No", description="", score=0.0),
    ],
    prediction_field="response",
    context_fields=["summary"],
)

criteria_c = Criteria(
    name="Technical Accuracy",
    description="Is the response technically accurate based on the reference?",
    options=[
        CriteriaOption(name="Correct", description=""),
        CriteriaOption(name="Incorrect", description=""),
    ],
    prediction_field="response",
    context_fields=["reference_text"],
)


# 🔹 Multi-criteria configuration
multi_criteria = MultiCriteria(
    items=[
        # Weighted criterion: contributes 50% of final score
        MultiCriteriaItem(
            criterion=criteria_a,
            weight=0.5,
        ),
        # Weighted criterion: contributes 30% of final score
        MultiCriteriaItem(
            criterion=criteria_b,
            weight=0.3,
        ),
        # Required criterion: if failed, final score is 0.0 regardless of others
        MultiCriteriaItem(
            criterion=criteria_c,
            weight=0.2,
            required=True,
            target_option="Correct",
        ),
    ]
)


instances = [
    # Failing case: self-explanatory + consistent, but technically wrong
    DirectInstance(
        context={
            "reference_text": "Use the API client to fetch data, and cache results for efficiency.",
            "summary": "API client usage and caching",
        },
        response=(
            "You should always query the database directly. Caching is optional."
        ),
    ),
    # Passing case: clear, consistent, and technically correct
    DirectInstance(
        context={
            "reference_text": "Use the API client to fetch data, and cache results for efficiency.",
            "summary": "API client usage and caching",
        },
        response=(
            "Use the API client to retrieve data. "
            "For frequently accessed results, store them in a cache to improve performance."
        ),
    ),
]


results: list[MultiCriteriaDirectInstanceResult] = judge.evaluate_multi_criteria(
    instances=instances,
    multi_criteria=multi_criteria,
)


for idx, res in enumerate(results, start=1):
    print(f"\n=== Instance {idx} ===")
    print(f"Aggregated score: {res.aggregated_score:.2f}")
    for item_result in res.item_results:
        print(
            f"{item_result.criteria_name} -> {item_result.score} (weighted: {item_result.weighted_score})"
        )
