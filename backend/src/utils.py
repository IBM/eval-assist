import functools
import logging
import time

from unitxt.inference import (
    HFAutoModelInferenceEngine,
    LiteLLMInferenceEngine,
    RITSInferenceEngine,
)
from unitxt.llm_as_judge import (
    EvaluatorNameEnum,
    ModelProviderEnum,
    rename_model_if_required,
)

from .const import (
    EXTENDED_EVALUATOR_TO_MODEL_ID,
    ExtendedEvaluatorNameEnum,
    ExtendedModelProviderEnum,
)


def get_local_hf_inference_engine_params(evaluator_name: EvaluatorNameEnum):
    return {
        "model_name": convert_model_name_wx_to_hf(evaluator_name),
        "max_new_tokens": 20,
        "device": "cpu",
    }


def get_inference_engine_params(
    credentials: dict,
    provider: ModelProviderEnum,
    evaluator_name: EvaluatorNameEnum,
):
    inference_engine_params = {
        "max_tokens": 1024,
        "seed": 42,
        "credentials": credentials,
        "max_requests_per_second": 8,
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
    evaluator_name: EvaluatorNameEnum,
    custom_params: dict = None,
):
    inference_engine_params = get_inference_engine_params(
        credentials, provider, evaluator_name
    )
    if custom_params:
        inference_engine_params.update(custom_params)
    return LiteLLMInferenceEngine(**inference_engine_params)


def convert_model_name_wx_to_hf(wx_model_name):
    model_map = {
        ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_1_2B: "ibm-granite/granite-guardian-3.1-2b",
        ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_1_8B: "ibm-granite/granite-guardian-3.1-8b",
        ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_2_3B: "ibm-granite/granite-guardian-3.2-3b-a800m",
        ExtendedEvaluatorNameEnum.GRANITE_GUARDIAN3_2_5B: "ibm-granite/granite-guardian-3.2-5b",
    }
    try:
        return model_map[wx_model_name]
    except KeyError:
        raise ValueError(f"Model name {wx_model_name} not found in the conversion map.")


def get_hf_inference_engine(
    evaluator_name: ExtendedEvaluatorNameEnum,
    custom_params: dict = None,
):
    params = get_local_hf_inference_engine_params(evaluator_name)
    if custom_params:
        params.update(custom_params)
    return HFAutoModelInferenceEngine(**params)


def get_enum_by_value(value: str) -> EvaluatorNameEnum:
    for enum_member in EvaluatorNameEnum:
        if enum_member.value == value:
            return enum_member
    raise ValueError(f"No matching enum found for value: {value}")


def get_inference_engine(
    credentials: dict[str, str],
    provider: ModelProviderEnum,
    evaluator_name: EvaluatorNameEnum,
    custom_params: dict = None,
):
    if provider == ExtendedModelProviderEnum.LOCAL_HF:
        return get_hf_inference_engine(evaluator_name, custom_params)
    return get_litellm_inference_engine(
        credentials, provider, evaluator_name, custom_params
    )


def log_runtime(function):
    """
    Usage: wrap a function call with the log_runtime function to log its runtime
    """

    @functools.wraps(function)
    def wrapper(*args, **kwargs):
        start_time = time.time()

        res = function(*args, **kwargs)

        end_time = time.time()
        total_time = round(end_time - start_time, 2)

        logging.debug(
            f"{function.__name__} took {total_time} seconds, {round(total_time / 60, 2)} minutes"
        )

        return res

    return wrapper
