from abc import ABC, abstractmethod


class BaseModel(ABC):
    def __init__(self,
                 model_id,
                 output_format,
                 config):
        self.model_id = model_id
        self.output_format = output_format
        self.config = config

    @abstractmethod
    def call(self,
             data_unlabeled,
             instruction,
             rubrics,
             templates,
             data_examples,
             num_example_samples,
             num_prompt_samples,
             save_dir):
        pass
