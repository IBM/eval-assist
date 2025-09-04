from .types import Criteria, Instance


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
