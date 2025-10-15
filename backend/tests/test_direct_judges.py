from typing import cast
from unittest.mock import patch

import pytest
from evalassist.judges import (
    Criteria,
    CriteriaOption,
    DirectInstance,
    DirectInstanceResult,
    DirectJudge,
    UnitxtDirectJudge,
)
from evalassist.judges.types import InstanceWithGroundTruth
from unitxt.artifact import fetch_artifact
from unitxt.inference import CrossProviderInferenceEngine
from unitxt.llm_as_judge import CriteriaWithOptions


def test_main_judge():
    inference_engine = CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        use_cache=False,
    )
    judge = DirectJudge(inference_engine=inference_engine, generate_feedback=True)
    criteria = [
        Criteria.from_unitxt_criteria(
            cast(
                CriteriaWithOptions,
                fetch_artifact("metrics.llm_as_judge.direct.criteria.answer_relevance")[
                    0
                ],
            )
        ),
        Criteria.from_unitxt_criteria("metrics.llm_as_judge.direct.criteria.coherence"),
        Criteria.from_unitxt_criteria("metrics.llm_as_judge.direct.criteria.coherence"),
    ]
    instances = [
        DirectInstance(
            context={"question": "What is the capital of Argentina?"},
            response="Buenos Aires is the capital and largest city of Argentina, located on the western shore of the Río de la Plata.",
        ),
        DirectInstance(
            context={
                "original text": "Machine learning is a subset of artificial intelligence that involves the use of algorithms and statistical models to enable computers to perform tasks without explicit instructions."
            },
            response="Machine learning uses algorithms to let computers learn tasks without explicit programming.",
        ),
        DirectInstance(
            context={
                "original text": "Machine learning is a subset of artificial intelligence that involves the use of algorithms and statistical models to enable computers to perform tasks without explicit instructions."
            },
            response="Machine learning uses algorithms to mimic wild animals",
        ),
    ]

    results: list[DirectInstanceResult] = judge.evaluate(
        instances=instances, criteria=criteria
    )

    assert results[0].selected_option == "Excellent"
    assert cast(float, results[1].score) >= 0.5
    assert cast(float, results[2].score) == 0.0
    assert (
        results[2].feedback is not None and len(results[2].feedback) > 0
    )  # provided feedback


def test_judges_str_params():
    inference_engine = CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
    )
    judge = UnitxtDirectJudge(inference_engine=inference_engine)
    results = judge.evaluate(
        instances=["Refer to the DTO or visit the BO please"],
        criteria="Is the text self explainable?",
    )
    assert results[0].selected_option == "No"


@patch(
    "unitxt.inference.CrossProviderInferenceEngine.infer",
    return_value=[
        '``\n{\n  "explanation": "explanation",\n  "selected_option": "No",\n  "feedback": "feedback"\n}\n```',
    ],
)
def test_direct_judge_mocked_inference_success(mock_infer):
    inference_engine = CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        use_cache=False,
    )
    judge = DirectJudge(inference_engine=inference_engine, generate_feedback=True)

    instances = [
        DirectInstance(
            context={"question": "What is the capital of Argentina?"},
            response="Buenos Aires",
        )
    ]

    judge.evaluate(instances=instances, criteria="Is the response faithful?")
    mock_infer.assert_called_once()


@patch(
    "unitxt.inference.CrossProviderInferenceEngine.infer",
    return_value=[
        '``\n{\n  "explanation": "explanation",\n  "selected_option": "Excellent",\n  "feedback": "feedback"\n}\n```',
    ],
)
def test_direct_judge_mocked_inference_failure(mock_infer):
    # selected_option is invalid
    inference_engine = CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        use_cache=False,
    )
    judge = DirectJudge(
        inference_engine=inference_engine,
        generate_feedback=True,
        on_generation_failure="raise",
    )

    instances: list[DirectInstance] = [
        DirectInstance(
            context={"question": "What is the capital of Argentina?"},
            response="Buenos Aires",
        )
    ]

    with pytest.raises(ValueError):
        judge.evaluate(instances=instances, criteria="Is the response faithful?")

    assert mock_infer.call_count == 4


@patch(
    "unitxt.inference.CrossProviderInferenceEngine.infer",
    side_effect=[
        ['``\n{\n  "explanation": "explanation",\n  "feedback": "feedback"\n}\n```'],
        [
            '``\n{\n  "explanation": "explanation",\n  "selected_option": "Excellent",\n  "feedback": "feedback"\n}\n```'
        ],
        [
            '``\n{\n  "explanation": "explanation",\n  "selected_option": "No",\n  "feedback": "feedback"\n}\n```'
        ],
    ],
)
def test_direct_judge_mocked_inference_almost_failure(mock_infer):
    inference_engine = CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        use_cache=False,
    )
    judge = DirectJudge(
        inference_engine=inference_engine,
        generate_feedback=True,
        on_generation_failure="raise",
    )

    instances = [
        DirectInstance(
            context={"question": "What is the capital of Argentina?"},
            response="Buenos Aires",
        )
    ]

    judge.evaluate(instances=instances, criteria="Is the response faithful?")

    assert mock_infer.call_count == 3


def test_direct_judge_mocked_inference_almost_failure_2():
    """In this test, the first call to inference engine is mocked and set to an invalid output generator, so the parser fails first time.

    The second time the inference engine is called is when the output fixing parser invokes it to fix the invalid judge generation.

    We add this test to make sure there are no thread/async related issues.
    """
    # ✅ Store the real method before patching
    real_infer = CrossProviderInferenceEngine.infer

    with patch.object(CrossProviderInferenceEngine, "infer") as mock_infer:

        def side_effect(*args, **kwargs):
            if mock_infer.call_count < 3:
                r = [
                    [
                        '``\n{\n  "explanation": "explanation",\n  "feedback": "feedback"\n}\n```'
                    ],
                    [
                        '``\n{\n  "explanation": "explanation",\n "selected_option": "N"\n}\n```'
                    ],
                ][mock_infer.call_count - 1]
            else:
                r = real_infer(inference_engine, *args, **kwargs)
            return r

        mock_infer.side_effect = side_effect

        inference_engine = CrossProviderInferenceEngine(
            model="llama-3-3-70b-instruct",
            provider="watsonx",
            use_cache=False,
        )
        judge = DirectJudge(
            inference_engine=inference_engine,
            generate_feedback=True,
            on_generation_failure="raise",
        )

        instances = [
            DirectInstance(
                context={"question": "What is the capital of Argentina?"},
                response="Buenos Aires",
            ),
            DirectInstance(
                context={"question": "Who was the president of France in 2008?"},
                response="Pitagoras",
            ),
        ]

        judge.evaluate(instances=instances, criteria="Is the response faithful?")


@patch(
    "unitxt.inference.CrossProviderInferenceEngine.infer",
    side_effect=[
        [
            '``\n{\n  "persona_name": "persona_name",\n  "persona_description": "persona_description"\n}\n```'
        ],
        [
            '``\n{\n  "explanation": "explanation",\n  "selected_option": "No",\n  "feedback": "feedback"\n}\n```'
        ],
    ],
)
def test_direct_judge_with_synthetic_persona_mocked_inference_success(mock_infer):
    inference_engine = CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        use_cache=False,
    )
    judge = DirectJudge(
        inference_engine=inference_engine,
        generate_feedback=True,
        generate_synthetic_persona=True,
    )

    instances = [
        DirectInstance(
            context={"question": "What is the capital of Argentina?"},
            response="Buenos Aires",
        )
    ]

    response = judge.evaluate(instances=instances, criteria="Is the response faithful?")
    assert mock_infer.call_count == 2
    assert "persona_name" in response[0].metadata["prompt"]


@patch(
    "unitxt.inference.CrossProviderInferenceEngine.infer",
    side_effect=[
        [
            '``\n{\n  "explanation": "explanation",\n  "selected_option": "No",\n  "feedback": "feedback"\n}\n```'
        ],
    ],
)
def test_direct_judge_with_ice_mocked_inference_success(mock_infer):
    inference_engine = CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        use_cache=False,
    )
    judge = DirectJudge(inference_engine=inference_engine, generate_feedback=True)

    instances = [
        DirectInstance(
            context={"question": "What is the capital of Argentina?"},
            response="Buenos Aires",
        )
    ]

    criteria: Criteria = Criteria(
        name="faithfulness",
        description="Is the response faithful?",
        options=[
            CriteriaOption(
                name="Yes",
            ),
            CriteriaOption(
                name="No",
            ),
        ],
        examples=[
            InstanceWithGroundTruth(
                instance=DirectInstance(
                    context={"question": "What is the capital of France?"},
                    response="Paris",
                ),
                ground_truth="Yes",
            )
        ],
    )

    response = judge.evaluate(instances=instances, criteria=criteria)
    assert mock_infer.call_count == 1
    assert (
        "## Examples" in response[0].metadata["prompt"]
        and "Paris" in response[0].metadata["prompt"]
    )


@patch(
    "unitxt.inference.CrossProviderInferenceEngine.infer",
    side_effect=[
        [
            '{"explanation": "The answer directly states that Albert Einstein developed the theory of relativity in the early 20th century, which is fully supported by the context provided. The context explicitly mentions that Albert Einstein, a German-born physicist, developed the theory of relativity in the early 20th century, making the answer fully grounded in the given information.", "selected_score": 5}'
        ],
        [
            '{"explanation": "explanation", "selected_option": "Yes"}',
        ],
    ],
)
def test_direct_judge_custom_prompt_mocked_inference_success(mock_infer):
    inference_engine = CrossProviderInferenceEngine(
        model="llama-3-3-70b-instruct",
        provider="watsonx",
        use_cache=False,
    )
    judge = DirectJudge(inference_engine=inference_engine)

    judge_prompt = """You are an expert grader. Your job is to evaluate how factually grounded an AI-generated answer is, based on a given context. From provider combination of Question, Context and Answer, you must judge whether the answer contains any hallucinations — i.e., information not found or contradicted by the context.

## Grading Scale:
Rate the answer from 1 to 5 using this rubric:

- 5: Fully grounded — All parts of the answer are directly supported by the context.
- 4: Mostly grounded — Minor details may be unverifiable, but the answer is mostly faithful.
- 3: Partially grounded — Some parts are correct, some are not verifiable or possibly incorrect.
- 2: Minimally grounded — Most of the content is unsupported or speculative.
- 1: Not grounded — The answer contradicts or fabricates facts entirely.

Question: Who developed the theory of relativity?
Context:
Albert Einstein, a German-born physicist, developed the theory of relativity in the early 20th century. It revolutionized theoretical physics and introduced concepts such as time dilation and the equivalence of mass and energy.",
Answer: The theory of relativity was developed by Albert Einstein in the early 20th century."""

    results = judge.evaluate_with_custom_prompt(
        judge_prompts=[judge_prompt],
        valid_outputs=(1, 5),  # or [1, 2, 3, 4, 5]
    )

    mock_infer.assert_called_once()

    assert results[0].score == 5

    judge_prompt = """You are an expert judge. Your job is to evaluate how factually grounded an AI-generated answer is, based on a given context. From provider combination of Question, Context and Answer, you must judge whether the answer contains any hallucinations — i.e., information not found or contradicted by the context.

## Criteria:
Evaluate the answer using the following rubric:

- Yes: Fully grounded — All parts of the answer are directly supported by the context.
- No: Mostly grounded — Minor details may be unverifiable, but the answer is mostly faithful.

Question: Who developed the theory of relativity?
Context:
Albert Einstein, a German-born physicist, developed the theory of relativity in the early 20th century. It revolutionized theoretical physics and introduced concepts such as time dilation and the equivalence of mass and energy.",
Answer: The theory of relativity was developed by Albert Einstein in the early 20th century."""

    results = judge.evaluate_with_custom_prompt(
        judge_prompts=[judge_prompt],
        valid_outputs=["Yes", "No"],
    )

    # mock_infer.assert_called_once()

    assert results[0].selected_option == "Yes"
