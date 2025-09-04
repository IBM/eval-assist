from evalassist.judges import DirectInstance, SimpleDirectJudge
from evalassist.judges.const import DEFAULT_JUDGE_INFERENCE_PARAMS
from evalassist.judges.types import (
    Criteria,
    CriteriaOption,
    MultiCriteria,
    MultiCriteriaDirectInstanceResult,
    MultiCriteriaItem,
)
from unitxt.inference import CrossProviderInferenceEngine

judge = SimpleDirectJudge(
    inference_engine=CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        **DEFAULT_JUDGE_INFERENCE_PARAMS,
    ),
    generate_feedback=True,
)

criteria_a = Criteria(
    name="self-explanatory",
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
    description="Is the text consistent?",
    options=[
        CriteriaOption(name="Yes", description="", score=1.0),
        CriteriaOption(name="No", description="", score=0.0),
    ],
    prediction_field="response",
    context_fields=["summary"],
)

multi_criteria = MultiCriteria(
    items=[
        MultiCriteriaItem(
            criterion=criteria_a,
        ),
        MultiCriteriaItem(
            criterion=criteria_b,
        ),
    ]
)

instances = [
    DirectInstance(
        context={"reference_text": "reference text", "summary": "summary"},
        response="Use the API client to fetch data from the server and the cache to store frequently accessed results for faster performance.",
    ),
]

results: list[MultiCriteriaDirectInstanceResult] = judge.evaluate_multi_criteria(
    instances=instances,
    multi_criteria=multi_criteria,
)


print(results[0].model_dump_json(exclude={"per_criterion_results"}, indent=4))

# print("### Aggregated score")
# print(f"{results[0].aggregated_score}")

# print("### Per criteria score")
# for criterion_result in results[0].per_criterion_results:
#     print(f"{criterion_result.criteria.name}: {criterion_result.score}")
