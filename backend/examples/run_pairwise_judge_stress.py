from evalassist.judges import Criteria, Instance, PairwiseJudge
from evalassist.judges.const import DEFAULT_JUDGE_INFERENCE_PARAMS
from unitxt.inference import CrossProviderInferenceEngine

judge = PairwiseJudge(
    inference_engine=CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        **DEFAULT_JUDGE_INFERENCE_PARAMS,
    ),
)

weird_string = "|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||"

instances = [
    Instance(
        fields={
            weird_string: [
                f"{i}_respo1Use the API client to fetch data from the server and the cache to store frequently accessed results for faster performance.",
                f"{i}_respon2Do it.",
            ]
        },
    )
    for i in range(50)
]

results = judge(
    instances=instances,
    criteria=Criteria(
        name="criteria",
        description="Is the text self-explanatory and self-contained?",
        to_evaluate_field=weird_string,
    ),
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
