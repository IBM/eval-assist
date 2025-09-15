from typing import cast
from unittest.mock import patch

import pytest
from evalassist.judges import (
    Criteria,
    DirectInstance,
    DirectInstanceResult,
    DirectJudge,
    UnitxtDirectJudge,
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

    assert results[0].option == "Excellent"
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
    assert results[0].option == "No"


@patch(
    "unitxt.inference.CrossProviderInferenceEngine.infer",
    return_value=[
        '``\n{\n  "assessment": "assessment",\n  "selected_option": "No",\n  "feedback": "feedback"\n}\n```',
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
        '``\n{\n  "assessment": "assessment",\n  "selected_option": "Excellent",\n  "feedback": "feedback"\n}\n```',
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

    instances = [
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
        ['``\n{\n  "assessment": "assessment",\n  "feedback": "feedback"\n}\n```'],
        [
            '``\n{\n  "assessment": "assessment",\n  "selected_option": "Excellent",\n  "feedback": "feedback"\n}\n```'
        ],
        [
            '``\n{\n  "assessment": "assessment",\n  "selected_option": "No",\n  "feedback": "feedback"\n}\n```'
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
