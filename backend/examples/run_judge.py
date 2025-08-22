from evalassist.judges import SimpleDirectJudge
from evalassist.judges.const import DEFAULT_JUDGE_INFERENCE_PARAMS
from unitxt.inference import CrossProviderInferenceEngine

judge = SimpleDirectJudge(
    inference_engine=CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        **DEFAULT_JUDGE_INFERENCE_PARAMS,
    ),
    generate_feedback=True,
)

results = judge(
    instances=[
        "Use the API client to fetch data from the server and the cache to store frequently accessed results for faster performance."
    ],
    criteria="Is the text self-explanatory and self-contained?",  # Create yes/no direct assessment criteria",
)

# providing criteria="Is the response self-explanatory?" is equal to the following criteria defintion
# criteria = CriteriaWithOptions(
#     name="self-explanatory",
#     description="Is the text self-explanatory and self-contained?",
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
To evaluate if the text is self-explanatory and self-contained, let's break down the key components of the given response and the context provided by the criterion.
### Understanding the Criterion
The criterion asks if the text can be understood on its own without needing additional information. This means the text should clearly convey its message, include all necessary details, and not require the reader to refer to external sources to comprehend it.

### Analyzing the Response
The response provided is: 'Use the API client to fetch data from the server and the cache to store frequently accessed results for faster performance.'
- **Clarity**: The response clearly states the use of an API client for fetching data and a cache for storing frequently accessed results. This implies an understanding of how to potentially improve performance by reducing the need for repeated requests to the server.
- **Self-containment**: The response does not explicitly define what an API client or a cache is, nor does it detail how these components interact within a system. It assumes the reader has a basic understanding of these terms and their functions in software development.
- **Explanatory Nature**: While the response gives a directive, it lacks explanatory depth. For someone unfamiliar with API clients or caching mechanisms, the response might not provide enough information to implement the suggested approach effectively.

### Conclusion
Given the analysis, the response is not fully self-explanatory for all potential readers, especially those without a background in software development or familiarity with the terms used. It does provide a clear directive but lacks the depth needed for a comprehensive understanding without additional context or knowledge.
"""

print("\n### Feedback")
print(results[0].feedback)
"""
To improve, consider adding a brief explanation of key terms like 'API client' and 'cache,' and perhaps provide a simple example or context in which this approach is beneficial. This would enhance the response's clarity and usefulness for a broader audience.
"""
