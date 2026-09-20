"""Reusable LLM client for the ClubOps AI service.

Sprint 1 scope: initialise the configured model, send messages, return the model
output, and translate provider failures into ClubOps errors.
No agents, no tool calling, no persistence.
"""

from __future__ import annotations

import inspect
import logging
import time
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any, Literal

import openai
from openai import AsyncOpenAI

from app.core.config import Settings, get_settings
from app.core.exceptions import (
    ConfigurationError,
    LLMAuthenticationError,
    LLMBadRequestError,
    LLMConnectionError,
    LLMEmptyResponseError,
    LLMError,
    LLMRateLimitError,
    LLMTimeoutError,
    redact_secrets,
)

logger = logging.getLogger(__name__)

Role = Literal["system", "user", "assistant"]
_VALID_ROLES: frozenset[str] = frozenset({"system", "user", "assistant"})


@dataclass(frozen=True, slots=True)
class Message:
    """A single chat message."""

    role: Role
    content: str

    def to_dict(self) -> dict[str, str]:
        return {"role": self.role, "content": self.content}


@dataclass(frozen=True, slots=True)
class LLMResponse:
    """Normalised model output."""

    text: str
    model: str
    finish_reason: str | None = None
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None
    latency_ms: int = 0


class LLMService:
    """Thin wrapper around the configured OpenAI-compatible chat API."""

    def __init__(self, settings: Settings | None = None, client: Any | None = None) -> None:
        self._settings = settings or get_settings()
        self._client = client
        if client is None and self._settings.requires_api_key:
            # Fail fast at startup instead of on the first user request.
            self._settings.api_key()

    # -- properties ----------------------------------------------------

    @property
    def settings(self) -> Settings:
        return self._settings

    @property
    def model(self) -> str:
        return self._settings.llm_model

    @property
    def client(self) -> Any:
        """Lazily build the provider client from configuration."""
        if self._client is None:
            self._client = AsyncOpenAI(
                api_key=self._settings.api_key(),
                base_url=self._settings.resolved_base_url,
                timeout=self._settings.llm_timeout_seconds,
                max_retries=self._settings.llm_max_retries,
            )
        return self._client

    # -- public API ----------------------------------------------------

    async def generate_response(
        self,
        prompt: str | None = None,
        *,
        messages: Sequence[Message | dict[str, Any]] | None = None,
        system: str | None = None,
        temperature: float | None = None,
        max_output_tokens: int | None = None,
        timeout: float | None = None,  # noqa: ASYNC109
    ) -> LLMResponse:
        """Send a prompt (or message list) to the LLM and return its output.

        Raises:
            LLMBadRequestError: invalid or empty input.
            LLMTimeoutError / LLMRateLimitError / LLMAuthenticationError /
            LLMConnectionError / LLMEmptyResponseError / LLMError: provider failures.
        """
        payload = _normalise_messages(messages=messages, prompt=prompt, system=system)
        settings = self._settings

        request: dict[str, Any] = {
            "model": settings.llm_model,
            "messages": payload,
            "temperature": settings.llm_temperature if temperature is None else temperature,
            "timeout": settings.llm_timeout_seconds if timeout is None else timeout,
        }
        tokens = settings.llm_max_output_tokens if max_output_tokens is None else max_output_tokens
        if tokens is not None:
            request["max_tokens"] = tokens

        started = time.perf_counter()
        try:
            completion = await self.client.chat.completions.create(**request)
        # NOTE: APITimeoutError subclasses APIConnectionError - order matters.
        except openai.APITimeoutError as exc:
            self._log_failure(exc)
            raise LLMTimeoutError(f"LLM request timed out after {request['timeout']}s.") from None
        except (openai.AuthenticationError, openai.PermissionDeniedError) as exc:
            self._log_failure(exc)
            raise LLMAuthenticationError(detail=self._sanitise(exc)) from None
        except openai.RateLimitError as exc:
            self._log_failure(exc)
            raise LLMRateLimitError(detail=self._sanitise(exc)) from None
        except openai.APIConnectionError as exc:
            self._log_failure(exc)
            raise LLMConnectionError(detail=self._sanitise(exc)) from None
        except openai.BadRequestError as exc:
            self._log_failure(exc)
            raise LLMBadRequestError(detail=self._sanitise(exc)) from None
        except openai.OpenAIError as exc:
            self._log_failure(exc)
            raise LLMError(detail=self._sanitise(exc)) from None
        except ConfigurationError:
            raise
        except Exception as exc:  # pragma: no cover - unexpected transport failure
            self._log_failure(exc)
            raise LLMError(detail=self._sanitise(exc)) from None

        latency_ms = int((time.perf_counter() - started) * 1000)
        response = self._parse(completion, latency_ms)
        logger.info(
            "LLM call ok (model=%s, latency_ms=%s, total_tokens=%s)",
            response.model,
            response.latency_ms,
            response.total_tokens,
        )
        return response

    async def aclose(self) -> None:
        """Release the underlying HTTP connection pool."""
        client, self._client = self._client, None
        close = getattr(client, "close", None) if client is not None else None
        if close is None:
            return
        result = close()
        if inspect.isawaitable(result):
            await result

    # -- internals -----------------------------------------------------

    def _parse(self, completion: Any, latency_ms: int) -> LLMResponse:
        choices = getattr(completion, "choices", None) or []
        if not choices:
            raise LLMEmptyResponseError("The LLM returned no choices.")

        message = getattr(choices[0], "message", None)
        text = (getattr(message, "content", None) or "").strip()
        if not text:
            raise LLMEmptyResponseError()

        usage = getattr(completion, "usage", None)
        return LLMResponse(
            text=text,
            model=getattr(completion, "model", None) or self._settings.llm_model,
            finish_reason=getattr(choices[0], "finish_reason", None),
            prompt_tokens=getattr(usage, "prompt_tokens", None),
            completion_tokens=getattr(usage, "completion_tokens", None),
            total_tokens=getattr(usage, "total_tokens", None),
            latency_ms=latency_ms,
        )

    def _sanitise(self, exc: Exception) -> str:
        return redact_secrets(str(exc), self._settings.secret_values())

    def _log_failure(self, exc: Exception) -> None:
        logger.warning("LLM call failed (%s): %s", type(exc).__name__, self._sanitise(exc))


def _normalise_messages(
    *,
    messages: Sequence[Message | dict[str, Any]] | None,
    prompt: str | None,
    system: str | None,
) -> list[dict[str, str]]:
    normalised: list[dict[str, str]] = []

    if system and system.strip():
        normalised.append({"role": "system", "content": system.strip()})

    if messages:
        for item in messages:
            if isinstance(item, Message):
                role, content = item.role, item.content
            elif isinstance(item, dict):
                role = str(item.get("role", "")).strip()
                content = item.get("content", "")
            else:
                raise LLMBadRequestError(
                    "Messages must be Message objects or dicts with 'role' and 'content'."
                )
            if role not in _VALID_ROLES:
                raise LLMBadRequestError(f"Unsupported message role: {role!r}.")
            if not isinstance(content, str) or not content.strip():
                raise LLMBadRequestError("Message content must be a non-empty string.")
            normalised.append({"role": role, "content": content})
    elif prompt is not None:
        if not prompt.strip():
            raise LLMBadRequestError("Prompt must be a non-empty string.")
        normalised.append({"role": "user", "content": prompt})

    if not any(item["role"] != "system" for item in normalised):
        raise LLMBadRequestError(
            "generate_response() requires a prompt or at least one non-system message."
        )
    return normalised


_service: LLMService | None = None


def get_llm_service() -> LLMService:
    """Return the shared LLM service (FastAPI dependency / internal use)."""
    global _service
    if _service is None:
        _service = LLMService()
    return _service


def reset_llm_service() -> None:
    """Drop the cached service without closing it (used by tests)."""
    global _service
    _service = None


async def close_llm_service() -> None:
    """Close the shared service, if one was created."""
    global _service
    if _service is not None:
        await _service.aclose()
        _service = None
