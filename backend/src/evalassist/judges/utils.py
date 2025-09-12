from collections.abc import Callable
from typing import Any

from pydantic import BaseModel, ConfigDict, create_model, field_validator

from .types import Criteria, Instance


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


def get_context_dict(instance: Instance, criteria: Criteria) -> dict[str, str]:
    """
    Return a context dict using the instance context and the criteria declared context_fields.
    The criteria context_fields takes precedense. This is useful for multi criteria evaluations
    where different criteria require different context.
    """
    if criteria.context_fields is not None:
        # criteria implicitly expects no context
        if len(criteria.context_fields) == 0:
            return {}
        # criteria expects some context, get it from instance.context if available
        if all(field in instance.context for field in criteria.context_fields):
            return {
                context_field: instance.context[context_field]
                for context_field in criteria.context_fields
            }
    # criteria does not specify whether it expects context or not, return the instance context
    return instance.context


def is_float(element: Any) -> bool:
    # If you expect None to be passed:
    if element is None:
        return False
    try:
        float(element)
        return True
    except ValueError:
        return False
