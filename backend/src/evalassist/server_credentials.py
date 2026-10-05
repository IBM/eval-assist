"""Server-side default LLM provider credentials.

Operators can configure default credentials through EVALASSIST_* environment
variables. Secret values (API keys) must never be sent to clients: clients get
a placeholder instead, and the server swaps in the real value when the
placeholder comes back in a request (see `resolve_server_default_credentials`).
"""

import os

# Value sent to clients in place of a server-configured secret.
SERVER_DEFAULT_PLACEHOLDER = "<server-default>"

SECRET_FIELDS = {"api_key"}

# The frontend's default watsonx endpoint; it is always sent when the user
# didn't choose another one, so it is safe to use with the server's key.
WATSONX_DEFAULT_API_BASE = "https://us-south.ml.cloud.ibm.com"

# provider (ModelProviderEnum value) -> credential field -> environment variable
DEFAULT_CREDENTIALS_ENV: dict[str, dict[str, str]] = {
    "rits": {"api_key": "EVALASSIST_RITS_API_KEY"},  # pragma: allowlist secret
    "watsonx": {
        "api_key": "EVALASSIST_WATSONX_API_KEY",  # pragma: allowlist secret
        "project_id": "EVALASSIST_WATSONX_PROJECT_ID",
        "api_base": "EVALASSIST_WATSONX_API_BASE",
    },
    "open-ai": {"api_key": "EVALASSIST_OPENAI_API_KEY"},  # pragma: allowlist secret
    "replicate": {
        "api_key": "EVALASSIST_REPLICATE_API_KEY",  # pragma: allowlist secret
    },
    "azure": {
        "api_key": "EVALASSIST_AZURE_API_KEY",  # pragma: allowlist secret
        "api_base": "EVALASSIST_AZURE_API_BASE",
    },
    "together-ai": {
        "api_key": "EVALASSIST_TOGETHER_AI_API_KEY",  # pragma: allowlist secret
    },
    "vertex-ai": {
        "api_key": "EVALASSIST_VERTEX_AI_API_KEY",  # pragma: allowlist secret
    },
    "aws": {"api_key": "EVALASSIST_BEDROCK_AI_API_KEY"},  # pragma: allowlist secret
    "open-ai-like": {
        "api_key": "EVALASSIST_OPEN_AI_LIKE_API_KEY",  # pragma: allowlist secret
        "api_base": "EVALASSIST_OPEN_AI_LIKE_API_BASE",
    },
    "ollama": {"api_base": "EVALASSIST_OLLAMA_API_BASE"},
}


def get_public_default_credentials() -> dict[str, dict[str, str]]:
    """Server defaults that are safe to send to clients: secrets are masked."""
    res: dict[str, dict[str, str]] = {}
    for provider, fields in DEFAULT_CREDENTIALS_ENV.items():
        for field, env_var in fields.items():
            value = os.getenv(env_var)
            if value:
                res.setdefault(provider, {})[field] = (
                    SERVER_DEFAULT_PLACEHOLDER if field in SECRET_FIELDS else value
                )
    return res


def resolve_server_default_credentials(
    provider: str, credentials: dict[str, str | None]
) -> dict[str, str | None]:
    """Replace placeholders in `credentials` with the server's secret values."""
    fields = DEFAULT_CREDENTIALS_ENV.get(provider, {})
    resolved = dict(credentials)
    placeholders = [
        k for k, v in credentials.items() if v == SERVER_DEFAULT_PLACEHOLDER
    ]
    if not placeholders:
        return resolved

    # A server secret must only ever be sent to the server-configured endpoint,
    # otherwise a client could point `api_base` at its own host and read the key.
    trusted_bases = {None, "", os.getenv(fields.get("api_base", ""))}
    if provider == "watsonx":
        trusted_bases.add(WATSONX_DEFAULT_API_BASE)
    if credentials.get("api_base") not in trusted_bases:
        raise ValueError(
            f"The server's default credentials for '{provider}' can only be used "
            "with the server's default api_base."
        )

    for field in placeholders:
        value = os.getenv(fields[field]) if field in fields else None
        if field not in SECRET_FIELDS or not value:
            raise ValueError(
                f"No server default is configured for '{provider}' '{field}'."
            )
        resolved[field] = value
    return resolved
