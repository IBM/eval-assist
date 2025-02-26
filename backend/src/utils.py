import functools
import time

from unitxt.inference import LiteLLMInferenceEngine, RITSInferenceEngine
from unitxt.llm_as_judge import (
    EvaluatorNameEnum,
    EvaluatorTypeEnum,
    ModelProviderEnum,
    rename_model_if_required,
)

from .const import EXTENDED_EVALUATOR_TO_MODEL_ID


def get_inference_engine_params(
    credentials: dict,
    provider: ModelProviderEnum,
    evaluator_name: EvaluatorNameEnum,
):
    inference_engine_params = {
        "max_tokens": 1024,
        "seed": 42,
        "credentials": credentials,
        "max_requests_per_second": 10,
    }

    model_name = rename_model_if_required(
        EXTENDED_EVALUATOR_TO_MODEL_ID[evaluator_name], provider
    )

    if provider == ModelProviderEnum.WATSONX:
        model_name = "watsonx/" + model_name

    if provider == ModelProviderEnum.AZURE_OPENAI:
        inference_engine_params["credentials"]["api_base"] = (
            f"https://eteopenai.azure-api.net/openai/deployments/{model_name}/chat/completions?api-version=2024-08-01-preview"
        )
        model_name = "azure/" + model_name
    if provider == ModelProviderEnum.RITS:
        inference_engine_params["credentials"]["api_base"] = (
            RITSInferenceEngine.get_base_url_from_model_name(model_name) + "/v1"
        )
        inference_engine_params["extra_headers"] = {
            "RITS_API_KEY": credentials["api_key"]
        }

    if provider == ModelProviderEnum.OPENAI or provider == ModelProviderEnum.RITS:
        model_name = f"openai/{model_name}"

    inference_engine_params["model"] = model_name

    return inference_engine_params


def get_litellm_inference_engine(
    credentials: dict[str, str],
    provider: ModelProviderEnum,
    evaluator_name: EvaluatorTypeEnum,
):
    inference_engine_params = get_inference_engine_params(
        credentials, provider, evaluator_name
    )
    return LiteLLMInferenceEngine(**inference_engine_params)


def get_enum_by_value(value: str) -> EvaluatorNameEnum:
    for enum_member in EvaluatorNameEnum:
        if enum_member.value == value:
            return enum_member
    raise ValueError(f"No matching enum found for value: {value}")


"""
    Usage: wrap a function call with the log_runtime function to log its runtime
"""


def log_runtime(function):
    @functools.wraps(function)
    def wrapper(*args, **kwargs):
        start_time = time.time()

        res = function(*args, **kwargs)

        end_time = time.time()
        total_time = round(end_time - start_time, 2)

        print(
            f"{function.__name__} took {total_time} seconds, {round(total_time / 60, 2)} minutes"
        )

        return res

    return wrapper
