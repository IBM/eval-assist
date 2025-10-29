import json

import pytest
from evalassist.judges import Criteria, Instance
from evalassist.judges.utils import get_context_dict, sanitize_and_parse_json


def test_get_context_dict():
    # test scenario where criteria defines context
    instance = Instance(
        fields={
            "response": "",
            "context": "",
        }
    )
    criteria = Criteria(
        name="",
        description="",
        options=[],
        to_evaluate_field="response",
        context_fields=["context"],
    )
    context_dict = get_context_dict(instance, criteria)

    assert "context" in context_dict and len(context_dict) == 1

    # test scenario where criteria defines context as None and instance has context
    instance = Instance(
        fields={
            "response": "",
            "context": "",
        }
    )
    criteria = Criteria(
        name="",
        description="",
        options=[],
        to_evaluate_field="response",
    )
    context_dict = get_context_dict(instance, criteria)

    assert "context" in context_dict and len(context_dict) == 1

    # test scenario where criteria defines context as []
    instance = Instance(
        fields={
            "response": "",
            "context": "",
        }
    )
    criteria = Criteria(
        name="",
        description="",
        options=[],
        to_evaluate_field="response",
        context_fields=[],
    )
    context_dict = get_context_dict(instance, criteria)

    assert len(context_dict) == 0

    # test scenario where criteria defines context that the instance doesnt have
    instance = Instance(
        fields={
            "response": "",
            "context": "",
        }
    )
    criteria = Criteria(
        name="",
        description="",
        options=[],
        to_evaluate_field="response",
        context_fields=["reference_document"],
    )
    with pytest.raises(ValueError):
        context_dict = get_context_dict(instance, criteria)


def test_sanitize_and_parse_json():
    """
    Test the sanitize_and_parse_json function with various input scenarios.
    """
    # Test valid JSON string
    assert sanitize_and_parse_json('{"key": "value"}') == '{"key": "value"}'

    # Test JSON string wrapped in Markdown fences
    assert (
        sanitize_and_parse_json('```json\n{"key": "value"}\n```') == '{"key": "value"}'
    )

    # Test JSON with correctly escaped newline
    assert sanitize_and_parse_json('{"key": "value\\n"}') == '{"key": "value\\n"}'

    # Test JSON with unescaped newline (should be escaped)
    assert sanitize_and_parse_json('{"key": "value\n"}') == '{"key": "value\\n"}'

    # Test JSON with partial content (missing closing brace)
    assert sanitize_and_parse_json('{"key": "value"') == '{"key": "value"}'

    # Test JSON with smart quotes (should be converted to regular quotes)
    assert sanitize_and_parse_json('{"key": "“value”"}') == '{"key": "\'value\'"}'

    # Test JSON with invalid characters (carriage return)
    assert sanitize_and_parse_json('{"key": "value\r"}') == '{"key": "value\\r"}'

    # Test empty string (should raise JSONDecodeError)
    with pytest.raises(json.JSONDecodeError):
        sanitize_and_parse_json("")

    # Test malformed JSON (missing closing brace, should be repaired)
    assert sanitize_and_parse_json('{"key": "value"') == '{"key": "value"}'

    # Test non-string input (should raise TypeError)
    with pytest.raises(TypeError):
        sanitize_and_parse_json(123)  # type: ignore
