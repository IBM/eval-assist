from machine_labeler.model_access.services.base import BaseModel


class VLLMModel(BaseModel):
    def __init__(self, model_id):
        pass

    def call(self, prompts):
        return self._retry_call(prompts)

    def _retry_call(self, prompts, max_attempts):
        ...

    def _call_model(self, prompts):
        ...

    def _parse_outputs(self, outputs):
        ...
