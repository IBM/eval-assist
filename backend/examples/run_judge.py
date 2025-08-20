from evalassist.judges import SimpleDirectJudge
from evalassist.judges.const import DEFAULT_JUDGE_INFERENCE_PARAMS
from unitxt.inference import CrossProviderInferenceEngine

judge = SimpleDirectJudge(
    inference_engine=CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        **DEFAULT_JUDGE_INFERENCE_PARAMS,
    ),
)

results = judge(
    instances=["Refer to the DTO or visit the BO please"],
    criteria="Is the text self-explanatory?",  # Create yes/no direct assessment criteria",
)

# providing criteria="Is the response self-explanatory?" is equal to the following criteria defintion
# criteria = CriteriaWithOptions(
#     name="self-explanatory",
#     description="Is the text self-explanatory?",
#     options=[
#         CriteriaOption(name="Yes", description=""),
#         CriteriaOption(name="No", description=""),
#     ],
#     option_map={
#         "Yes": 1.0,
#         "No": 0.0,
#     },
#     prediction_field="response",
# )


print("### Selected option / Score")
print(f"{results[0].option} / {results[0].score}")
"""
No / 0.0
"""

print("\n### Explanation")
print(results[0].explanation)
"""
To determine if the text is self-explanatory, let's break it down:
## Step 1: Understanding the Text
The given text is 'Refer to the DTO or visit the BO please'.
## Step 2: Analyzing for Self-Explanatory Criteria
A self-explanatory text should be clear and understandable without needing additional information.
## Step 3: Evaluating the Text
The text mentions 'DTO' and 'BO' without explaining what these abbreviations stand for. For someone unfamiliar with these terms, the text would not be clear.
## Step 4: Conclusion
Given that the text uses undefined abbreviations, it requires external knowledge to understand, making it not self-explanatory.
"""

print("\n### Feedback")
print(results[0].feedback)
"""
To improve, consider defining abbreviations or providing context so the text can stand alone without requiring external information for clarity."""
