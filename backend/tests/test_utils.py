from enum import Enum
from unittest.mock import mock_open, patch

import pytest
from evalassist.extended_unitxt import (
    EXTENDED_EVALUATORS_METADATA,
    ExtendedEvaluatorNameEnum,
)
from evalassist.utils import (
    clean_object,
    convert_model_name_wx_to_hf,
    fill_unknown_template,
    get_custom_models,
    get_default_torch_device,
    get_enum_by_value,
    get_inference_engine,
    handle_exception,
)
from unitxt.inference import CrossProviderInferenceEngine, WMLInferenceEngineGeneration
from unitxt.llm_as_judge import EvaluatorNameEnum, ModelProviderEnum


def test_fill_unknown_template():
    # Test case 1: Unnamed placeholder
    assert fill_unknown_template("hello {}", "world") == "hello world"

    # Test case 2: Named placeholder
    assert fill_unknown_template("hello {world}", "world") == "hello world"

    # Test case 3: No placeholder
    assert fill_unknown_template("hello", "world") == "hello"


def test_get_custom_models():
    # Mock the file existence and content
    with patch("os.path.exists") as mock_exists:
        with patch(
            "builtins.open", new_callable=mock_open, read_data='{"model1": "path1"}'
        ):
            mock_exists.return_value = True
            assert get_custom_models() == {"model1": "path1"}

    # Test when file does not exist
    with patch("os.path.exists") as mock_exists:
        mock_exists.return_value = False
        assert get_custom_models() == []


def test_convert_model_name_wx_to_hf():
    assert (
        convert_model_name_wx_to_hf("ibm/granite-guardian-3-2b")
        == "ibm-granite/granite-guardian-3.1-2b"
    )
    assert convert_model_name_wx_to_hf("other-model") == "other-model"


def test_get_enum_by_value():
    class TestEnum(Enum):
        VALUE1 = "value1"
        VALUE2 = "value2"

    assert get_enum_by_value("value1", TestEnum) == TestEnum.VALUE1
    assert get_enum_by_value("nonexistent", TestEnum) is None


def test_handle_exception():
    # Test handling of various exceptions
    with pytest.raises(Exception):
        handle_exception(Exception("Test exception"))


def test_clean_object():
    # Test cleaning a dictionary
    assert clean_object({"a": 1, "b": None, "c": {}}) == {"a": 1}

    # Test cleaning a list
    assert clean_object([1, None, {}]) == [1]

    # Test nested cleaning
    assert clean_object({"a": 1, "b": {"c": None, "d": 2}}) == {"a": 1, "b": {"d": 2}}


def test_get_inference_engine():
    # Test with different providers
    credentials = {
        "api_key": "test_key",  # pragma: allowlist secret
        "project_id": "test_project",
        "api_base": "https://",
    }
    assert isinstance(
        get_inference_engine(credentials, ModelProviderEnum.WATSONX, "test_model"),
        CrossProviderInferenceEngine,
    )
    assert isinstance(
        get_inference_engine(
            credentials,
            ModelProviderEnum.WATSONX,
            "granite-guardian-3-8b",
        ),
        WMLInferenceEngineGeneration,
    )
    # assert isinstance(
    #     get_inference_engine(
    #         credentials,
    #         ExtendedModelProviderEnum.LOCAL_HF,
    #         "ibm-granite/granite-guardian-3.2-5b",
    #     ),
    #     HFAutoModelInferenceEngine,
    # )
    # assert isinstance(
    #     get_inference_engine(
    #         credentials,
    #         ExtendedModelProviderEnum.LOCAL_HF,
    #         "ibm-granite/granite-guardian-3.2-5b",
    #     ),
    #     HFAutoModelInferenceEngine,
    # )


def test_get_default_torch_device():
    with patch("unitxt.inference.TorchDeviceMixin.get_device_id") as mock_get_device_id:
        mock_get_device_id.return_value = "cuda"
        assert get_default_torch_device() == "cuda"


pytest.mark.parametrize(
    "evaluator_name, custom_model_name, expect_error, error_msg_part",
    [
        # 1. Valid evaluator in EXTENDED_EVALUATORS_METADATA
        (EXTENDED_EVALUATORS_METADATA[0].name, None, False, None),
        # 2. Nonexistent evaluator (simple Enum mismatch)
        (
            EvaluatorNameEnum.__members__.get(
                "NON_EXISTENT", EXTENDED_EVALUATORS_METADATA[0].name
            ),
            None,
            True,
            "does not exist",
        ),
        # 3. CUSTOM evaluator but missing custom_model_name
        (
            ExtendedEvaluatorNameEnum.CUSTOM,
            None,
            True,
            "specified custom model was not found",
        ),
    ],
)


# def test_evaluator_metadata_wrapper_errors_and_valid(
#     evaluator_name, custom_model_name, expect_error, error_msg_part
# ):
#     if not expect_error:
#         meta = get_evaluator_metadata_wrapper(evaluator_name, custom_model_name)
#         assert meta.name == evaluator_name
#     else:
#         with pytest.raises(ValueError) as exc:
#             get_evaluator_metadata_wrapper(evaluator_name, custom_model_name)
#         assert error_msg_part in str(exc.value)


# def test_evaluator_metadata_wrapper_custom_success(monkeypatch):
#     # Setup dummy custom models
#     dummy_models = [
#         {"name": "model1", "path": "/p1", "providers": ["LOCAL_HF", "WATSONX"]}
#     ]
#     monkeypatch.setattr("evalassist.utils.get_custom_models", lambda: dummy_models)

#     res = get_evaluator_metadata_wrapper(
#         ExtendedEvaluatorNameEnum.CUSTOM, custom_model_name="model1"
#     )

#     assert res.name == ExtendedEvaluatorNameEnum.CUSTOM
#     assert res.custom_model_name == "model1"
#     assert res.custom_model_path == "/p1"
#     # Providers list should contain correct enums
#     assert all(
#         isinstance(p, (ExtendedModelProviderEnum, ModelProviderEnum))
#         for p in res.providers
#     )
#     assert set(p.name for p in res.providers) == {"LOCAL_HF", "WATSONX"}
