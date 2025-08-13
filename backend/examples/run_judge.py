from evalassist.benchmark.benchmark import UnitxtDirectJudge
from unitxt.inference import CrossProviderInferenceEngine

judge = UnitxtDirectJudge(
    inference_engine=CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="rits",
    ),
)

results = judge.evaluate(
    instances=["Refer to the DTO or visit the BO please"],
    criteria="Is the text self explainable?",
)

print(results[0].option)
print(results[0].explanation)
