from evalassist.judges import UnitxtDirectJudge
from unitxt.inference import CrossProviderInferenceEngine

judge = UnitxtDirectJudge(
    inference_engine=CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="rits",
    ),
)

results = judge(
    instances=["Refer to the DTO or visit the BO please"],
    criteria="Is the text self explainable?",  # Create yes/no direct assessment criteria
)
print(results[0].option)  # No

print(results[0].explanation)
"""
To assess the quality of the response subject to the evaluation criteria, let's break it down:

1. **Understanding the Evaluation Criteria**: The criteria ask if the text is self-explainable. This means the response should be clear and understandable on its own without requiring additional context or information to grasp its meaning.

2. **Analyzing the Response**: The response given is "Refer to the DTO or visit the BO please." This response contains abbreviations (DTO and BO) that are not defined within the response itself.

3. **Applying the Criteria**: For a text to be self-explainable, it should not require the reader to have prior knowledge of specific abbreviations or terms unless they are commonly understood in a general context. In this case, DTO and BO are not universally recognized terms outside of specific contexts (which could be business, technical, etc.), and their meaning is not provided.

4. **Conclusion**: Given that the response includes undefined abbreviations without explanation, it cannot be considered self-explainable. A reader without prior knowledge of what DTO and BO stand for (e.g., Data Transfer Object and Business Office, or any other possible meanings) would not be able to understand the response fully based solely on the information provided.

The final answer is: $\boxed{No}$
"""
