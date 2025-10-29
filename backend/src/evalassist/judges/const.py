from unitxt.inference import CrossProviderInferenceEngine, LiteLLMInferenceEngine

DEFAULT_JUDGE_INFERENCE_PARAMS = {
    "temperature": 0,
    # "stop": '}',
    "provider_specific_args": {
        k: {
            "response_format": {"type": "json_object"},
        }
        for k, v in CrossProviderInferenceEngine._provider_to_base_class.items()
        if v == LiteLLMInferenceEngine
    },
}
