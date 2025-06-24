import pytest
from evalassist.main import app
from fastapi.testclient import TestClient

# e.g. in tests/conftest.py or app startup
from unitxt.settings_utils import get_settings

# Set the flag before any unitxt behavior is invoked
get_settings().skip_artifacts_prepare_and_verify = True


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
