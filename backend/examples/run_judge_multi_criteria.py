from evalassist.judges import SimpleDirectJudge
from evalassist.judges.const import DEFAULT_JUDGE_INFERENCE_PARAMS
from evalassist.judges.types import MultiCriteriaDirectInstanceResult
from unitxt.inference import CrossProviderInferenceEngine

judge = SimpleDirectJudge(
    inference_engine=CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        **DEFAULT_JUDGE_INFERENCE_PARAMS,
    ),
    generate_feedback=True,
)

results: list[MultiCriteriaDirectInstanceResult] = judge.evaluate_multi_criteria(
    instances=[
        "Use the API client to fetch data from the server and the cache to store frequently accessed results for faster performance.",
    ],
    multi_criteria=[  # Creates a multi criteria with equal weights
        "Is the text self-explanatory and self-contained?",  # Creates yes/no direct assessment criteria
        "Is the text consistent?",  # Creates yes/no direct assessment criteria
    ],
)

# providing the criteria as a list of description strings is equivalent to the following multi criteria defintion"
# criteria_a = Criteria(
#     name="self-explanatory",
#     description="Is the text self-explanatory and self-contained?",
#     options=[
#         CriteriaOption(name="Yes", description="", score=1.0),
#         CriteriaOption(name="No", description="", score=0.0),
#     ],
#     prediction_field="response",
# )

# criteria_b = Criteria(
#     name="Consistent",
#     description="Is the text consistent?",
#     options=[
#         CriteriaOption(name="Yes", description="", score=1.0),
#         CriteriaOption(name="No", description="", score=0.0),
#     ],
#     prediction_field="response",
# )

# multi_criteria  = MultiCriteria(
#     items = [
#         MultiCriteriaItem(
#             criterion=criteria_a,
#             weight=0.5,
#         ),
#         MultiCriteriaItem(
#             criterion=criteria_b,
#             weight=0.5
#         ),
#     ]
# )

print(
    results[0].model_dump_json(
        exclude={"multi_criteria", "per_criterion_results"}, indent=4
    )
)
"""
{
    "per_criterion_score": {
        "criteria_1": 0.5,
        "criteria_2": 0.5
    },
    "aggregated_score": 1.0
}
"""
