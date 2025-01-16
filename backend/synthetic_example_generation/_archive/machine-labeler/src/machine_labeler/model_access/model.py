from machine_labeler.utils.model_utils import is_valid_model


class Model:
    def __new__(cls, model_id, config):

        service = config['defaults']['model']['service']

        if not is_valid_model(config, model_id, service):
            available_models = [
                model_name for model_name, model_config in config['models-config'].items()
                if service in model_config
            ]
            raise ValueError(
                f"Model '{model_id}' not served via \"{service}\"; "
                f"available models: {available_models}"
            )

        if service == 'rits':
            from machine_labeler.model_access.services.rits import RITSModel
            return RITSModel(model_id, config)
        elif service == 'vllm':
            from machine_labeler.model_access.services.vllm import VLLMModel
            return VLLMModel(model_id)
        elif service == 'hf':
            from machine_labeler.model_access.services.hf import HFModel
            return HFModel(model_id)
        else:
            raise ValueError(f"unknown service: {service}")
