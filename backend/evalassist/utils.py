import functools
import json
import logging
import os
import time
from enum import Enum
from typing import Optional

from torch import device
from unitxt.inference import (
    HFAutoModelInferenceEngine,
    LiteLLMInferenceEngine,
    RITSInferenceEngine,
    TorchDeviceMixin,
    WMLInferenceEngineGeneration,
)
from unitxt.llm_as_judge import (
    EvaluatorNameEnum,
    ModelProviderEnum,
    rename_model_if_required,
)

from .const import (
    EXTENDED_EVALUATOR_TO_MODEL_ID,
    EXTENDED_EVALUATORS_METADATA,
    ExtendedEvaluatorMetadata,
    ExtendedEvaluatorNameEnum,
    ExtendedModelProviderEnum,
)

logger = logging.getLogger(__name__)


def get_custom_models():
    base_path = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_path, "..", "custom_models.json")
    if not os.path.exists(json_path):
        json_path = os.path.join(base_path, "..", "..", "custom_models.json")
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as file:
            try:
                custom_models = json.load(file)
                return custom_models
            except Exception:
                raise ValueError("The custom_models json format is wrong")
    else:
        return []


def convert_model_name_wx_to_hf(wx_model_name):
    model_map = {
        "ibm/granite-guardian-3-2b": "ibm-granite/granite-guardian-3.1-2b",
        "ibm/granite-guardian-3-8b": "ibm-granite/granite-guardian-3.1-8b",
    }
    try:
        return model_map[wx_model_name]
    except KeyError:
        logger.warning(f"Model name {wx_model_name} not found in the conversion map.")
        return wx_model_name


def get_enum_by_value(value: str, enum: Enum) -> Enum:
    for enum_member in enum:
        if enum_member.value == value:
            return enum_member
    return None


def get_local_hf_inference_engine_params(
    model_name: str,
):
    return {
        "model_name": convert_model_name_wx_to_hf(model_name),
        "max_new_tokens": 1024,
        "device": get_default_torch_devide(),
    }


def get_litellm_inference_engine_params(
    credentials: dict,
    provider: ModelProviderEnum,
    model_name: str,
):
    inference_engine_params = {
        "max_tokens": 1024,
        "seed": 42,
        "credentials": credentials,
        "max_requests_per_second": 8,
    }

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
    model_name: EvaluatorNameEnum,
    custom_params: dict = None,
):
    inference_engine_params = get_litellm_inference_engine_params(
        credentials, provider, model_name
    )

    if custom_params is not None:
        inference_engine_params.update(custom_params)
    return LiteLLMInferenceEngine(**inference_engine_params)


preloaded_hf_models = {}


def get_hf_inference_engine(
    model_name: str,
    custom_params: dict = None,
):
    global preloaded_hf_models
    if model_name in preloaded_hf_models:
        logger.debug(f"Using preloaded HF model {model_name}")
        return preloaded_hf_models[model_name]
    else:
        logger.debug(f"Loading model {model_name}")
        params = get_local_hf_inference_engine_params(model_name)
        if custom_params is not None:
            params.update(custom_params)
        hf_model = HFAutoModelInferenceEngine(**params)
        preloaded_hf_models[model_name] = hf_model
        return hf_model


def get_watsonx_inference_engine(
    credentials: dict[str, str],
    provider: ModelProviderEnum,
    model_name: EvaluatorNameEnum,
    custom_params: dict = None,
):
    inference_engine_params = {
        "max_new_tokens": 1024,
        "credentials": {
            "api_key": credentials["api_key"],
            "project_id": credentials["project_id"],
            "url": credentials["api_base"],
        },
        "model_name": model_name,
    }
    if custom_params is not None:
        inference_engine_params.update(custom_params)
    return WMLInferenceEngineGeneration(**inference_engine_params)


def get_inference_engine(
    credentials: dict[str, str],
    provider: ModelProviderEnum | ExtendedModelProviderEnum,
    model_name: str,
    custom_params: dict = None,
):
    if provider == ExtendedModelProviderEnum.LOCAL_HF:
        return get_hf_inference_engine(model_name, custom_params)
    if (
        provider == ModelProviderEnum.WATSONX
        and 'granite-guardian' in model_name
    ):
        return get_watsonx_inference_engine(
            credentials, provider, model_name, custom_params
        )
    return get_litellm_inference_engine(
        credentials, provider, model_name, custom_params
    )



def get_model_name_from_evaluator(
    evaluator_metadata: ExtendedEvaluatorMetadata,
    provider: str,
) -> str:
    model_name = EXTENDED_EVALUATOR_TO_MODEL_ID.get(evaluator_metadata.name, None)
    return (
        evaluator_metadata.custom_model_path
        if evaluator_metadata.custom_model_path is not None
        else model_name
    )


def get_evaluator_metadata_wrapper(
    evaluator_name: EvaluatorNameEnum | ExtendedEvaluatorNameEnum,
    custom_model_name: Optional[str] = None,
) -> ExtendedEvaluatorMetadata:
    if evaluator_name.name != ExtendedEvaluatorNameEnum.CUSTOM.name:
        evaluator_search = [
            e
            for e in EXTENDED_EVALUATORS_METADATA
            if e.name.name == evaluator_name.name
        ]  # and e.evaluator_type == evaluator_type]
        if len(evaluator_search) == 0:
            # raise ValueError(f'A {evaluator_type} evaluator with id {name} does not exist.')
            raise ValueError(f"An evaluator with id {evaluator_name} does not exist.")
        if len(evaluator_search) > 1:
            # raise ValueError(f'A {evaluator_type} evaluator with id {name} matched several models.')
            raise ValueError(
                f"An evaluator with id {evaluator_name} matched several models."
            )
        return evaluator_search[0]
    else:
        custom_models = get_custom_models()
        if custom_model_name not in [
            custom_model["name"] for custom_model in custom_models
        ]:
            raise ValueError("The specified custom model was not found")

        custom_model = [
            custom_model
            for custom_model in custom_models
            if custom_model["name"] == custom_model_name
        ][0]
        return ExtendedEvaluatorMetadata(
            name=evaluator_name,
            custom_model_name=custom_model["name"],
            custom_model_path=custom_model["path"],
            providers=[
                ExtendedModelProviderEnum(p)
                if p in ExtendedModelProviderEnum
                else ModelProviderEnum(p)
                for p in custom_model["providers"]
            ],
        )


def get_default_torch_devide(avoid_mps: bool = False) -> device:
    return TorchDeviceMixin().get_device_id()


def init_evaluator_name(
    evaluator_name: str,
) -> tuple[ExtendedEvaluatorNameEnum, Optional[str]]:
    evaluator_name_as_enum = get_enum_by_value(evaluator_name, EvaluatorNameEnum)
    if evaluator_name_as_enum is None:
        evaluator_name_as_enum = get_enum_by_value(
            evaluator_name, ExtendedEvaluatorNameEnum
        )
    custom_model_name = None
    if evaluator_name_as_enum is not None:
        return (evaluator_name_as_enum, None)

    custom_model_name = evaluator_name
    evaluator_name = ExtendedEvaluatorNameEnum.CUSTOM
    return (evaluator_name, custom_model_name)


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

        logger.debug(
            f"{function.__name__} took {total_time} seconds, {round(total_time / 60, 2)} minutes"
        )

        return res

    return wrapper
