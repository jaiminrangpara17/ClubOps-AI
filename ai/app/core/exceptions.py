"""Error types for the ClubOps AI service.

Every error exposes a safe, user-facing ``message``. Provider payloads are run
through :func:`redact_secrets` before they are logged or returned, so an API key
can never leak into logs, tracebacks or HTTP responses.
"""

from __future__ import annotations

import re
from collections.abc import Iterable

REDACTED = "***REDACTED***"

# Defence in depth: even if a secret we do not know about shows up in a provider
# error string, these patterns scrub the common key shapes.
_SECRET_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"sk-[A-Za-z0-9_\-]{12,}"),  # OpenAI / OpenRouter
    re.compile(r"AIza[0-9A-Za-z_\-]{20,}"),  # Google / Gemini
    re.compile(r"gsk_[A-Za-z0-9]{20,}"),  # Groq
    re.compile(
        r"(?i)\b(?:api[-_ ]?key|authorization|bearer)\b\s*[:=]?\s*"
        r"[\"']?[A-Za-z0-9._\-]{12,}[\"']?"
    ),
)


def redact_secrets(text: str, secrets: Iterable[str | None] = ()) -> str:
    """Return ``text`` with known secrets and key-like tokens masked."""
    if not text:
        return ""
    cleaned = text
    for secret in secrets:
        if secret and len(secret) >= 8:
            cleaned = cleaned.replace(secret, REDACTED)
    for pattern in _SECRET_PATTERNS:
        cleaned = pattern.sub(REDACTED, cleaned)
    return cleaned


class AIServiceError(Exception):
    """Base class for every error raised by the ClubOps AI service."""

    status_code: int = 500
    default_message: str = "Unexpected AI service error."

    def __init__(self, message: str | None = None, *, detail: str | None = None) -> None:
        self.message = message or self.default_message
        self.detail = detail
        super().__init__(self.message)

    def to_dict(self) -> dict[str, str]:
        payload = {"error": type(self).__name__, "message": self.message}
        if self.detail:
            payload["detail"] = self.detail
        return payload


class ConfigurationError(AIServiceError):
    """The service is misconfigured (missing/invalid environment variables)."""

    status_code = 500
    default_message = "AI service is not configured correctly."


class LLMError(AIServiceError):
    """Generic failure while talking to the LLM provider."""

    status_code = 502
    default_message = "The LLM provider returned an error."


class LLMAuthenticationError(LLMError):
    status_code = 502
    default_message = "The LLM provider rejected the configured API credentials."


class LLMRateLimitError(LLMError):
    status_code = 429
    default_message = "The LLM provider rate limit was exceeded."


class LLMTimeoutError(LLMError):
    status_code = 504
    default_message = "The LLM request timed out."


class LLMConnectionError(LLMError):
    status_code = 503
    default_message = "Could not reach the LLM provider."


class LLMEmptyResponseError(LLMError):
    status_code = 502
    default_message = "The LLM returned an empty response."


class LLMBadRequestError(LLMError):
    status_code = 400
    default_message = "The LLM request was invalid."


class AIValidationError(AIServiceError):
    status_code = 422
    default_message = "AI output validation failed."


class SchemaValidationError(AIValidationError):
    default_message = "AI output does not match expected schema."


class MalformedAIOutputError(AIValidationError):
    status_code = 400
    default_message = "AI output is not valid JSON."


class ActionValidationError(AIValidationError):
    default_message = "Invalid AI action."


class RiskValidationError(AIValidationError):
    default_message = "Risk validation failed."


class KnowledgeValidationError(AIValidationError):
    default_message = "Knowledge grounding validation failed."


class CommunicationValidationError(AIValidationError):
    default_message = "Communication grounding validation failed."


class AIClientError(AIServiceError):
    """Generic failure in AIServiceClient when communicating with the AI service."""

    status_code = 502
    default_message = "The AI service client encountered an error."


class AIClientTimeoutError(AIClientError):
    """The HTTP request to the AI service timed out."""

    status_code = 504
    default_message = "The AI service request timed out."


class AIClientConnectionError(AIClientError):
    """Could not reach the AI service."""

    status_code = 503
    default_message = "Could not reach the AI service."


class AIClientValidationError(AIClientError):
    """AI service response or request payload failed validation."""

    status_code = 422
    default_message = "AI service client payload validation failed."

