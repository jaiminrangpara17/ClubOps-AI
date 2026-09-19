"""LLM service tests - no real network calls are made."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any

import httpx
import openai
import pytest

from app.core.config import get_settings, reset_settings
from app.core.exceptions import (
    ConfigurationError,
    LLMAuthenticationError,
    LLMBadRequestError,
    LLMConnectionError,
    LLMEmptyResponseError,
    LLMRateLimitError,
    LLMTimeoutError,
)
from app.core.llm import LLMService, Message

REQUEST = httpx.Request("POST", "https://api.example.test/v1/chat/completions")


def completion(content: str | None = "Board meeting summary.", model: str = "gpt-4o-mini") -> Any:
    return SimpleNamespace(
        model=model,
        choices=[
            SimpleNamespace(
                index=0,
                finish_reason="stop",
                message=SimpleNamespace(role="assistant", content=content),
            )
        ],
        usage=SimpleNamespace(prompt_tokens=11, completion_tokens=7, total_tokens=18),
    )


class FakeCompletions:
    def __init__(self, result: Any) -> None:
        self.result = result
        self.calls: list[dict[str, Any]] = []

    async def create(self, **kwargs: Any) -> Any:
        self.calls.append(kwargs)
        if isinstance(self.result, Exception):
            raise self.result
        return self.result


class FakeClient:
    def __init__(self, result: Any) -> None:
        self.completions = FakeCompletions(result)
        self.chat = SimpleNamespace(completions=self.completions)
        self.closed = False

    async def close(self) -> None:
        self.closed = True


def build_service(result: Any) -> tuple[LLMService, FakeClient]:
    reset_settings()
    client = FakeClient(result)
    return LLMService(settings=get_settings(), client=client), client


# --- initialisation --------------------------------------------------


def test_missing_api_key_blocks_initialisation() -> None:
    with pytest.raises(ConfigurationError) as err:
        LLMService()
    assert "LLM_API_KEY" in str(err.value)


def test_service_initialises_with_api_key(configured_env: str) -> None:
    reset_settings()
    service = LLMService()
    assert service.model == "gpt-4o-mini"


def test_client_is_built_from_settings(monkeypatch: pytest.MonkeyPatch, configured_env: str) -> None:
    captured: dict[str, Any] = {}

    def fake_async_openai(**kwargs: Any) -> Any:
        captured.update(kwargs)
        return FakeClient(completion())

    monkeypatch.setattr("app.core.llm.AsyncOpenAI", fake_async_openai)
    monkeypatch.setenv("LLM_TIMEOUT_SECONDS", "15")
    reset_settings()

    LLMService().client

    assert captured["api_key"] == configured_env
    assert captured["base_url"] == "https://api.openai.com/v1"
    assert captured["timeout"] == 15.0
    assert captured["max_retries"] == 2


# --- happy path ------------------------------------------------------


async def test_generate_response_returns_text(configured_env: str) -> None:
    service, client = build_service(completion())
    response = await service.generate_response("Summarise the club budget.")

    assert response.text == "Board meeting summary."
    assert response.model == "gpt-4o-mini"
    assert response.total_tokens == 18
    assert response.latency_ms >= 0
    assert client.completions.calls[0]["messages"] == [
        {"role": "user", "content": "Summarise the club budget."}
    ]


async def test_messages_and_system_prompt_are_forwarded(configured_env: str) -> None:
    service, client = build_service(completion())
    await service.generate_response(
        messages=[Message(role="user", content="Hi"), {"role": "assistant", "content": "Hello"}],
        system="You are the ClubOps assistant.",
    )
    assert client.completions.calls[0]["messages"] == [
        {"role": "system", "content": "You are the ClubOps assistant."},
        {"role": "user", "content": "Hi"},
        {"role": "assistant", "content": "Hello"},
    ]


async def test_per_call_overrides(configured_env: str) -> None:
    service, client = build_service(completion())
    await service.generate_response("Hi", temperature=0.0, timeout=5.0, max_output_tokens=64)
    call = client.completions.calls[0]
    assert call["temperature"] == 0.0
    assert call["timeout"] == 5.0
    assert call["max_tokens"] == 64


# --- input validation ------------------------------------------------


@pytest.mark.parametrize("kwargs", [{}, {"prompt": "   "}, {"system": "only system"}])
async def test_invalid_input_raises(configured_env: str, kwargs: dict[str, Any]) -> None:
    service, _ = build_service(completion())
    with pytest.raises(LLMBadRequestError):
        await service.generate_response(**kwargs)


# --- empty responses -------------------------------------------------


@pytest.mark.parametrize("content", [None, "", "   "])
async def test_empty_content_raises(configured_env: str, content: str | None) -> None:
    service, _ = build_service(completion(content=content))
    with pytest.raises(LLMEmptyResponseError):
        await service.generate_response("Hi")


async def test_missing_choices_raises(configured_env: str) -> None:
    service, _ = build_service(SimpleNamespace(model="gpt-4o-mini", choices=[], usage=None))
    with pytest.raises(LLMEmptyResponseError):
        await service.generate_response("Hi")


# --- provider failures -----------------------------------------------


async def test_timeout_is_mapped(configured_env: str) -> None:
    service, _ = build_service(openai.APITimeoutError(request=REQUEST))
    with pytest.raises(LLMTimeoutError):
        await service.generate_response("Hi")


async def test_connection_error_is_mapped(configured_env: str) -> None:
    service, _ = build_service(openai.APIConnectionError(request=REQUEST))
    with pytest.raises(LLMConnectionError):
        await service.generate_response("Hi")


async def test_rate_limit_is_mapped(configured_env: str) -> None:
    error = openai.RateLimitError(
        "quota exceeded", response=httpx.Response(429, request=REQUEST), body=None
    )
    service, _ = build_service(error)
    with pytest.raises(LLMRateLimitError):
        await service.generate_response("Hi")


async def test_auth_error_never_leaks_the_api_key(configured_env: str) -> None:
    error = openai.AuthenticationError(
        f"Incorrect API key provided: {configured_env}",
        response=httpx.Response(401, request=REQUEST),
        body=None,
    )
    service, _ = build_service(error)
    with pytest.raises(LLMAuthenticationError) as err:
        await service.generate_response("Hi")

    assert configured_env not in err.value.message
    assert configured_env not in (err.value.detail or "")
    assert "REDACTED" in (err.value.detail or "")


async def test_aclose_releases_the_client(configured_env: str) -> None:
    service, client = build_service(completion())
    await service.aclose()
    assert client.closed is True