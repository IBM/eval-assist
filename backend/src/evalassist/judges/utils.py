import json
import logging
import re
from collections.abc import Callable
from typing import Any, cast

from pydantic import BaseModel, ConfigDict, create_model, field_validator

from .types import Criteria, Instance

logger = logging.getLogger(__name__)


def generate_dynamic_pydantic_model(
    model_name: str,
    field_definitions: list[tuple[str, type, Any, list[Callable[..., Any]]]],
) -> type[BaseModel]:
    validators: dict[str, Callable[..., Any]] = {
        validator.__name__: field_validator(field_definition[0], mode="after")(
            validator
        )
        for field_definition in field_definitions
        for validator in field_definition[3]
    }
    field_defs: dict[str, tuple[type, Any]] = {
        field_definition[0]: (field_definition[1], field_definition[2])
        for field_definition in field_definitions
    }
    return create_model(
        model_name,
        __config__=ConfigDict(extra="forbid"),
        __doc__=None,
        __base__=BaseModel,
        __module__=__name__,
        __validators__=validators,
        __cls_kwargs__=None,
        **field_defs,
    )


def get_to_evaluate_text(instance: Instance, criteria: Criteria) -> str | list[str]:
    # if instance only has one field, it must be the text to evaluate
    if len(instance.fields) == 1:
        instance_field = list(instance.fields.keys())[0]
        if criteria.to_evaluate_field != instance_field:
            logger.warning(
                f"Criteria's to_evaluate_field differs from instance's only field. {criteria.to_evaluate_field} != {instance_field}"
            )
        return instance.fields[instance_field]
    else:
        return instance.fields[criteria.to_evaluate_field]


def get_context_dict(instance: Instance, criteria: Criteria) -> dict[str, str]:
    """
    Return a context dict using the instance's fields and the criteria declared context_fields.
    This is useful for multi criteria evaluations where different criteria require different
    contexts and/or text to evaluate.
    """

    # # if instance only has one field, it must be the text to evaluate
    # if len(instance.fields) == 1:
    #     instance_field = list(instance.fields.keys())[0]
    #     if criteria.to_evaluate_field != instance_field:
    #         logger.warning(f"Criteria's to_evaluate_field differs from instance's only field. {criteria.to_evaluate_field} != {instance_field}")
    #     return {}
    if criteria.context_fields is not None:
        # criteria implicitly expects no context
        if len(criteria.context_fields) == 0:
            return {}
        # criteria expects some context, get it from instance.context if available
        if all(field in instance.fields for field in criteria.context_fields):
            return {
                context_field: cast(str, instance.fields[context_field])
                for context_field in criteria.context_fields
            }
        else:
            raise ValueError(
                f"Instance doesn't have the fields that the criteria expects. Criteria's context fields are: {list(criteria.context_fields)} while instance fields are has {list(instance.fields.keys())}"
            )
    # criteria does not specify whether it expects context or not, default to returning the instance non-text-to-evaluate fields as context fields
    return {
        k: cast(str, v)
        for k, v in instance.fields.items()
        if k != criteria.to_evaluate_field
    }


def is_float(element: Any) -> bool:
    # If you expect None to be passed:
    if element is None:
        return False
    try:
        float(element)
        return True
    except ValueError:
        return False


def build_format_instructions(model: type[BaseModel]) -> str:
    """Generate text format instructions based on JSON schema."""
    return (
        "The output should be formatted as a JSON instance that conforms to the JSON schema below.\n\n"
        "As an example, for the schema "
        '{"properties": {"foo": {"title": "Foo", "description": "a list of strings", "type": "array", "items": {"type": "string"}}}, "required": ["foo"]}\n'
        'the object {"foo": ["bar", "baz"]} is a well-formatted instance of the schema. '
        'The object {"properties": {"foo": ["bar", "baz"]}} is not well-formatted.\n\n'
        "Here is the output schema:\n```json\n"
        f"{model.model_json_schema()}\n```\n"
        "You must output a single-line JSON object (not pretty-printed, no newlines or indentation). Do not add spaces or formatting for readability. All control characters inside strings must be escaped."
    )


def sanitize_and_parse_json(raw_json: str) -> str:
    """
    Sanitize a JSON string to make it parseable.

    This function performs multiple steps to sanitize the input JSON string:
    1. Removes Markdown fences (```json, json```, etc.)
    2. Fixes invalid escape sequences (e.g., \', stray backslashes)
    3. Escapes unescaped newlines (\n), carriage returns (\r), and tabs (\t)
    4. Converts smart quotes to plain quotes
    5. Attempts to fix partial or malformed JSON (e.g., missing closing braces)

    Args:
        raw_json: The raw JSON string (possibly with unescaped characters or formatting issues).

    Returns:
        A sanitized JSON string that can be parsed with json.loads().

    Raises:
        json.JSONDecodeError: If the string cannot be fixed.
        TypeError: If raw_json is not a string.
    """
    if not isinstance(raw_json, str):
        raise TypeError("raw_json must be a string")

    # Step 1: Normalize and strip Markdown fences
    raw_json = raw_json.strip()
    markdown_match = re.search(r"```(?:json)?(.*?)```", raw_json, re.DOTALL)
    json_str = markdown_match.group(1).strip() if markdown_match else raw_json

    # Step 2: Normalize invalid characters and escapes
    # Replace smart quotes, backticks, and other special characters with their plain equivalents
    json_str = (
        json_str.replace("“", '"')
        .replace("”", '"')
        .replace("‘", "'")
        .replace("’", "'")
        .replace("`", '"')
    )

    # Replace Python-style escaped single quotes with plain quotes
    json_str = re.sub(r"\\'", "'", json_str)

    # Remove invalid backslash escapes (anything not valid JSON escape)
    json_str = re.sub(r'\\(?!["\\/bfnrtu])', r"\\\\", json_str)

    # Step 3: Escape problematic characters inside string values
    def _replace_chars(match: re.Match[str]) -> str:
        # Replace newlines, carriage returns, and tabs with their escaped versions
        value = match.group(2)
        value = re.sub(r"\n", r"\\n", value)
        value = re.sub(r"\r", r"\\r", value)
        value = re.sub(r"\t", r"\\t", value)
        # Ensure double quotes are properly escaped
        value = re.sub(r'(?<!\\)"', r"\"", value)
        return match.group(1) + value + match.group(3)

    json_str = re.sub(
        r'(".*?"\s*:\s*")(.*?)(")', _replace_chars, json_str, flags=re.DOTALL
    )

    # Step 4: Try parsing and, if needed, repair partial JSON
    try:
        # Attempt to parse the sanitized JSON string
        json.loads(json_str)
        return json_str
    except json.JSONDecodeError:
        # Handle empty string
        if not json_str:
            raise json.JSONDecodeError("Empty string is not valid JSON", json_str, 0)

        # Initialize variables for repairing partial JSON
        new_chars = []
        stack = []
        is_inside_string = False
        escaped = False

        # Iterate through characters to repair JSON
        for char in json_str:
            new_char = char
            if is_inside_string:
                # Handle characters inside a string
                if char == '"' and not escaped:
                    is_inside_string = False
                elif char == "\n" and not escaped:
                    new_char = "\\n"
                elif char == "\\":
                    escaped = not escaped
                else:
                    escaped = False
            elif char == '"':
                # Enter a string
                is_inside_string = True
                escaped = False
            elif char == "{":
                # Push opening brace onto stack
                stack.append("}")
            elif char == "[":
                # Push opening bracket onto stack
                stack.append("]")
            elif char in {"}", "]"}:
                # Pop corresponding closing bracket/brace from stack if it matches
                if stack and stack[-1] == char:
                    stack.pop()
                else:
                    # If no match, consider it an error (return empty string)
                    return ""
            new_chars.append(new_char)

        # Handle remaining state after iterating through all characters
        if is_inside_string:
            if escaped:
                new_chars.pop()
            new_chars.append('"')

        # Reverse the stack to get closing brackets/braces in correct order
        stack.reverse()

        # Attempt to repair JSON by adding missing closing brackets/braces
        while new_chars:
            candidate = "".join(new_chars + stack)
            try:
                json.loads(candidate)
                return candidate
            except json.JSONDecodeError:
                new_chars.pop()

        # If all else fails, return the original sanitized JSON string
        return json_str


def create_default_instance(
    model_cls: type[BaseModel], values: dict[str, Any] | None = None
) -> BaseModel:
    """
    Create an instance of a Pydantic model with default placeholder values.
    If 'values' is provided, it overrides the defaults for matching fields.
    """
    values = values or {}
    defaults: dict[str, Any] = {}

    for name, field in model_cls.model_fields.items():
        if name in values:
            defaults[name] = values[name]
        else:
            defaults[name] = ""

    return model_cls(**defaults)
