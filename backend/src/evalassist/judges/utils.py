from pydantic import BaseModel, ConfigDict, create_model, field_validator

from .types import Criteria, Instance


def generate_dynamic_model(
    model_name: str, option_names: list[str], include_feedback: bool
):
    # Field definitions
    field_defs = {
        "assessment": (str, ...),
        "selected_option": (str, ...),
    }

    # Validator function to enforce valid options
    def validate_selected_option(cls, value: str) -> str:
        if value not in option_names:
            raise ValueError(f"value must be one of {option_names}")
        return value

    # Wrap with field_validator decorator
    validators = {
        "validate_selected_option": field_validator("selected_option", mode="after")(
            validate_selected_option
        )
    }

    # Create base dynamic model
    dynamic_model = create_model(
        model_name,
        __config__=ConfigDict(extra="forbid"),
        __doc__=None,
        __base__=BaseModel,
        __module__=__name__,
        __validators__=validators,
        __cls_kwargs__=None,
        **field_defs,
    )

    # Optionally extend with a feedback field
    if include_feedback:
        dynamic_model = create_model(
            f"{model_name}WithFeedback",
            __base__=dynamic_model,
            feedback=(str, ""),
            __config__=None,
        )

    return dynamic_model


def get_context_dict(instance: Instance, criteria: Criteria) -> dict[str, str]:
    """
    Return a context dict using the instance context and the criteria declared context_fields.
    The criteria context_fields takes precedense. This is useful for multi criteria evaluations
    where different criteria require different context.
    """
    if (
        criteria.context_fields is not None
        and instance.context is not None
        and all(field in instance.context for field in criteria.context_fields)
    ):
        return {
            context_field: instance.context[context_field]
            for context_field in criteria.context_fields
        }
    return instance.context if instance.context is not None else {}
