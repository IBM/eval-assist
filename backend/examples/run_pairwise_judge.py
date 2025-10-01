from evalassist.judges import PairwiseInstance
from evalassist.judges.const import DEFAULT_JUDGE_INFERENCE_PARAMS
from evalassist.judges.pairwise_judge import PairwiseJudge
from unitxt.inference import CrossProviderInferenceEngine

judge = PairwiseJudge(
    inference_engine=CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        **DEFAULT_JUDGE_INFERENCE_PARAMS,
    ),
)

results = judge(
    instances=[
        PairwiseInstance(
            responses=[
                "Reminder: Your dentist appointment is scheduled for Tuesday at 3 PM.",
                "Don't forget! You have a dentist appointment at 3 PM on Tuesday.",
            ]
        ),
    ],
    criteria="Clarity and effectiveness in delivering a reminder message.",
)

print("### Selected option")
print(f"{results[0].selected_option}")
"""
tie
"""

print("\n### Explanation")
print(results[0].explanation)
"""
Evaluating the responses based on clarity and effectiveness in delivering a reminder message, both options effectively convey the necessary information. Response A uses a formal introduction, while Response B uses a more casual approach. Both methods can be effective depending on the context and recipient preference. Given that both responses clearly convey the necessary information and are structured to remind the recipient about their dentist appointment, they can be considered equally effective.
"""
