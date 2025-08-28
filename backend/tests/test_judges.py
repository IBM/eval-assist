# from typing import Sequence, cast
# from evalassist.api.common import DirectInstance, DirectInstanceResult
# from evalassist.judges.synthetic_persona_direct_judge import SimpleDirectJudge
# from evalassist.judges.unitxt_judges import UnitxtDirectJudge
# from unitxt.inference import InferenceEngine, CrossProviderInferenceEngine
# from evalassist.judges import Criteria
# from unitxt.artifact import fetch_artifact
# from unitxt.llm_as_judge_constants import CriteriaOption

# def test_judges_multiple_criteria():
#     inference_engine = CrossProviderInferenceEngine(
#         model="llama-3-3-70b-instruct",
#         provider="rits",
#         use_cache=False
#     )
#     criteria = [
#         cast(CriteriaWithOptions, fetch_artifact("metrics.llm_as_judge.direct.criteria.answer_relevance")[0]),
#         cast(CriteriaWithOptions, fetch_artifact("metrics.llm_as_judge.direct.criteria.coherence")[0]),
#     ]
#     judge = SimpleDirectJudge(inference_engine=inference_engine)
#     instances = [
#         DirectInstance(
#             context_variables={"question": "What is the capital of Argentina?"},
#             response="Buenos Aires is the capital and largest city of Argentina, located on the western shore of the Río de la Plata.",
#         ),
#         DirectInstance(
#             context_variables={"original text": "Machine learning is a subset of artificial intelligence that involves the use of algorithms and statistical models to enable computers to perform tasks without explicit instructions."},
#             response="Machine learning uses algorithms to let computers learn tasks without explicit programming.",
#         )
#     ]

#     results: Sequence[DirectInstanceResult] = judge.evaluate(instances=instances, criteria=criteria)

#     print(results)
#     assert results[0].option == "Excellent"
#     assert results[1].option == "4"

# def test_judges_str_params():
#     inference_engine = CrossProviderInferenceEngine(
#         model="llama-3-3-70b-instruct",
#         provider="rits",
#     )
#     judge = UnitxtDirectJudge(inference_engine=inference_engine)
#     results = judge.evaluate(
#         instances=["Refer to the DTO or visit the BO please"],
#         criteria="Is the text self explainable?"
#     )
#     assert results[0].option == "No"
