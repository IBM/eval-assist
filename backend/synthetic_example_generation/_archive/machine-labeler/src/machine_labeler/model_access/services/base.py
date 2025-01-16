from abc import ABC, abstractmethod
from typing import Dict, Any


class BaseModel(ABC):
    @abstractmethod
    def generate(self, prompts):
        pass

    def _retry_call(self, prompts):
        """Common retry logic"""
        pass

    def _parse_outputs(self, outputs):
        """Common parsing logic"""
        pass
