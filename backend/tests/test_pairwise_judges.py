from typing import cast

from evalassist.judges import (
    Criteria,
    Instance,
    PairwiseInstanceResult,
    PairwiseJudge,
    UnitxtPairwiseJudge,
)
from unitxt.artifact import fetch_artifact
from unitxt.inference import CrossProviderInferenceEngine
from unitxt.llm_as_judge import CriteriaWithOptions


def test_main_judge():
    inference_engine = CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        use_cache=False,
    )
    judge = PairwiseJudge(inference_engine=inference_engine)
    criteria = Criteria.from_unitxt_criteria(
        cast(
            CriteriaWithOptions,
            fetch_artifact("metrics.llm_as_judge.pairwise.criteria.inclusivity")[0],
        )
    )

    instances = [
        Instance(
            fields={
                "question": "when is christmas",
                "response": [
                    "Christmas is on December 25th",
                    "For those who celebrate it, Christmas falls on December 25th.",
                ],
            },
        ),
        Instance(
            fields={
                "question": "when is christmas",
                "response": [
                    "Christmas is celebrated on December 25th by those who observe it.",
                    "For those who celebrate it, Christmas falls on December 25th.",
                ],
            },
        ),
    ]

    results: list[PairwiseInstanceResult] = judge.evaluate(
        instances=instances, criteria=criteria
    )

    assert results[0].selected_option == 1
    assert results[1].selected_option == "tie"


def test_judges_str_params():
    inference_engine = CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
    )
    judge = UnitxtPairwiseJudge(inference_engine=inference_engine)
    results = judge.evaluate(
        instances=[
            [
                "Refer to the DTO or visit the BO please",
                "Refer to the Data Transfer Object or visit the Business Object please",
            ]
        ],
        criteria="Is the text self explainable?",
    )
    assert results[0].selected_option == 1


# @patch(
#     "unitxt.inference.CrossProviderInferenceEngine.infer",
#     return_value=[
#         '``\n{\n  "explanation": "explanation",\n  "selected_option": "No",\n  "feedback": "feedback"\n}\n```',
#     ],
# )
# def test_direct_judge_mocked_inference_success(mock_infer):
#     inference_engine = CrossProviderInferenceEngine(
#         model="llama-3-3-70b-instruct",
#         provider="watsonx",
#         use_cache=False,
#     )
#     judge = DirectJudge(inference_engine=inference_engine, generate_feedback=True)

#     instances = [
#         DirectInstance(
#             context={"question": "What is the capital of Argentina?"},
#             response="Buenos Aires",
#         )
#     ]

#     judge.evaluate(instances=instances, criteria="Is the response faithful?")
#     mock_infer.assert_called_once()


# @patch(
#     "unitxt.inference.CrossProviderInferenceEngine.infer",
#     return_value=[
#         '``\n{\n  "explanation": "explanation",\n  "selected_option": "Excellent",\n  "feedback": "feedback"\n}\n```',
#     ],
# )
# def test_direct_judge_mocked_inference_failure(mock_infer):
#     # selected_option is invalid
#     inference_engine = CrossProviderInferenceEngine(
#         model="llama-3-3-70b-instruct",
#         provider="watsonx",
#         use_cache=False,
#     )
#     judge = DirectJudge(
#         inference_engine=inference_engine,
#         generate_feedback=True,
#         on_generation_failure="raise",
#     )

#     instances: list[DirectInstance] = [
#         DirectInstance(
#             context={"question": "What is the capital of Argentina?"},
#             response="Buenos Aires",
#         )
#     ]

#     with pytest.raises(ValueError):
#         judge.evaluate(instances=instances, criteria="Is the response faithful?")

#     assert mock_infer.call_count == 4


# @patch(
#     "unitxt.inference.CrossProviderInferenceEngine.infer",
#     side_effect=[
#         ['``\n{\n  "explanation": "explanation",\n  "feedback": "feedback"\n}\n```'],
#         [
#             '``\n{\n  "explanation": "explanation",\n  "selected_option": "Excellent",\n  "feedback": "feedback"\n}\n```'
#         ],
#         [
#             '``\n{\n  "explanation": "explanation",\n  "selected_option": "No",\n  "feedback": "feedback"\n}\n```'
#         ],
#     ],
# )
# def test_direct_judge_mocked_inference_almost_failure(mock_infer):
#     inference_engine = CrossProviderInferenceEngine(
#         model="llama-3-3-70b-instruct",
#         provider="watsonx",
#         use_cache=False,
#     )
#     judge = DirectJudge(
#         inference_engine=inference_engine,
#         generate_feedback=True,
#         on_generation_failure="raise",
#     )

#     instances = [
#         DirectInstance(
#             context={"question": "What is the capital of Argentina?"},
#             response="Buenos Aires",
#         )
#     ]

#     judge.evaluate(instances=instances, criteria="Is the response faithful?")

#     assert mock_infer.call_count == 3


# def test_direct_judge_mocked_inference_almost_failure_2():
#     """In this test, the first call to inference engine is mocked and set to an invalid output generator, so the parser fails first time.

#     The second time the inference engine is called is when the output fixing parser invokes it to fix the invalid judge generation.

#     We add this test to make sure there are no thread/async related issues.
#     """
#     # ✅ Store the real method before patching
#     real_infer = CrossProviderInferenceEngine.infer

#     with patch.object(CrossProviderInferenceEngine, "infer") as mock_infer:

#         def side_effect(*args, **kwargs):
#             if mock_infer.call_count == 1:
#                 return [
#                     '``\n{\n  "explanation": "explanation",\n  "feedback": "feedback"\n}\n```',
#                     '``\n{\n  "explanation": "explanation",\n  "feedback": "feedback", "selected_option": "No"\n}\n```',
#                 ]
#             return real_infer(inference_engine, *args, **kwargs)

#         mock_infer.side_effect = side_effect

#         inference_engine = CrossProviderInferenceEngine(
#             model="llama-3-3-70b-instruct",
#             provider="watsonx",
#             use_cache=False,
#         )
#         judge = DirectJudge(
#             inference_engine=inference_engine,
#             generate_feedback=True,
#             on_generation_failure="raise",
#         )

#         instances = [
#             DirectInstance(
#                 context={"question": "What is the capital of Argentina?"},
#                 response="Buenos Aires",
#             ),
#             DirectInstance(
#                 context={"question": "Who was the president of France in 2008?"},
#                 response="Pitagoras",
#             ),
#         ]

#         result = judge.evaluate(
#             instances=instances, criteria="Is the response faithful?"
#         )

# @patch(
#     "unitxt.inference.CrossProviderInferenceEngine.infer",
#     side_effect=[
#         [
#             '``\n{\n  "persona_name": "persona_name",\n  "persona_description": "persona_description"\n}\n```'
#         ],
#         [
#             '``\n{\n  "explanation": "explanation",\n  "selected_option": "No",\n  "feedback": "feedback"\n}\n```'
#         ],
#     ],
# )
# def test_direct_judge_with_synthetic_persona_mocked_inference_success(mock_infer):
#     inference_engine = CrossProviderInferenceEngine(
#         model="llama-3-3-70b-instruct",
#         provider="watsonx",
#         use_cache=False,
#     )
#     judge = DirectJudge(
#         inference_engine=inference_engine,
#         generate_feedback=True,
#         generate_synthetic_persona=True,
#     )

#     instances = [
#         DirectInstance(
#             context={"question": "What is the capital of Argentina?"},
#             response="Buenos Aires",
#         )
#     ]

#     response = judge.evaluate(instances=instances, criteria="Is the response faithful?")
#     assert mock_infer.call_count == 2
#     assert "persona_name" in response[0].metadata["prompt"]


# @patch(
#     "unitxt.inference.CrossProviderInferenceEngine.infer",
#     side_effect=[
#         [
#             '``\n{\n  "explanation": "explanation",\n  "selected_option": "No",\n  "feedback": "feedback"\n}\n```'
#         ],
#     ],
# )
# def test_direct_judge_with_ice_mocked_inference_success(mock_infer):
#     inference_engine = CrossProviderInferenceEngine(
#         model="llama-3-3-70b-instruct",
#         provider="watsonx",
#         use_cache=False,
#     )
#     judge = DirectJudge(inference_engine=inference_engine, generate_feedback=True)

#     instances = [
#         DirectInstance(
#             context={"question": "What is the capital of Argentina?"},
#             response="Buenos Aires",
#         )
#     ]

#     criteria: Criteria = Criteria(
#         name="faithfulness",
#         description="Is the response faithful?",
#         options=[
#             CriteriaOption(
#                 name="Yes",
#             ),
#             CriteriaOption(
#                 name="No",
#             ),
#         ],
#         examples=[
#             InstanceWithGroundTruth(
#                 instance=DirectInstance(
#                     context={"question": "What is the capital of France?"},
#                     response="Paris",
#                 ),
#                 ground_truth="Yes",
#             )
#         ],
#     )

#     response = judge.evaluate(instances=instances, criteria=criteria)
#     assert mock_infer.call_count == 1
#     assert (
#         "## Examples" in response[0].metadata["prompt"]
#         and "Paris" in response[0].metadata["prompt"]
#     )


# @patch(
#     "unitxt.inference.CrossProviderInferenceEngine.infer",
#     side_effect=[
#         ['{"explanation": "The answer directly states that Albert Einstein developed the theory of relativity in the early 20th century, which is fully supported by the context provided. The context explicitly mentions that Albert Einstein, a German-born physicist, developed the theory of relativity in the early 20th century, making the answer fully grounded in the given information.", "selected_score": 5}'],
#         [
#             '{"explanation": "explanation", "selected_option": "Yes"}',
#         ],
#     ],
# )
# def test_direct_judge_custom_prompt_mocked_inference_success(mock_infer):
#     inference_engine = CrossProviderInferenceEngine(
#         model="llama-3-3-70b-instruct",
#         provider="watsonx",
#         use_cache=False,
#     )
#     judge = DirectJudge(inference_engine=inference_engine)


#     judge_prompt = """You are an expert grader. Your job is to evaluate how factually grounded an AI-generated answer is, based on a given context. From provider combination of Question, Context and Answer, you must judge whether the answer contains any hallucinations — i.e., information not found or contradicted by the context.

# ## Grading Scale:
# Rate the answer from 1 to 5 using this rubric:

# - 5: Fully grounded — All parts of the answer are directly supported by the context.
# - 4: Mostly grounded — Minor details may be unverifiable, but the answer is mostly faithful.
# - 3: Partially grounded — Some parts are correct, some are not verifiable or possibly incorrect.
# - 2: Minimally grounded — Most of the content is unsupported or speculative.
# - 1: Not grounded — The answer contradicts or fabricates facts entirely.

# Question: Who developed the theory of relativity?
# Context:
# Albert Einstein, a German-born physicist, developed the theory of relativity in the early 20th century. It revolutionized theoretical physics and introduced concepts such as time dilation and the equivalence of mass and energy.",
# Answer: The theory of relativity was developed by Albert Einstein in the early 20th century."""

#     results = judge.evaluate_with_custom_prompt(
#         judge_prompts=[judge_prompt],
#         valid_outputs=(1, 5),  # or [1, 2, 3, 4, 5]
#     )

#     mock_infer.assert_called_once()

#     assert results[0].score == 5

#     judge_prompt = """You are an expert judge. Your job is to evaluate how factually grounded an AI-generated answer is, based on a given context. From provider combination of Question, Context and Answer, you must judge whether the answer contains any hallucinations — i.e., information not found or contradicted by the context.

# ## Criteria:
# Evaluate the answer using the following rubric:

# - Yes: Fully grounded — All parts of the answer are directly supported by the context.
# - No: Mostly grounded — Minor details may be unverifiable, but the answer is mostly faithful.

# Question: Who developed the theory of relativity?
# Context:
# Albert Einstein, a German-born physicist, developed the theory of relativity in the early 20th century. It revolutionized theoretical physics and introduced concepts such as time dilation and the equivalence of mass and energy.",
# Answer: The theory of relativity was developed by Albert Einstein in the early 20th century."""

#     results = judge.evaluate_with_custom_prompt(
#         judge_prompts=[judge_prompt],
#         valid_outputs=["Yes", "No"],
#     )

#     # mock_infer.assert_called_once()

#     assert results[0].selected_option == "Yes"
