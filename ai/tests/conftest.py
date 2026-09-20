"""Shared test fixtures: isolate tests from the developer's real environment."""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from app.core.config import reset_settings
from app.core.llm import reset_llm_service

_ENV_VARS = (
    "SERVICE_NAME",
    "APP_ENV",
    "LOG_LEVEL",
    "LLM_PROVIDER",
    "LLM_API_KEY",
    "LLM_MODEL",
    "LLM_TEMPERATURE",
    "LLM_TIMEOUT_SECONDS",
    "LLM_MAX_RETRIES",
    "LLM_BASE_URL",
    "LLM_MAX_OUTPUT_TOKENS",
)

FAKE_API_KEY = "sk-clubops-test-secret-0123456789"


@pytest.fixture(autouse=True)
def clean_environment(monkeypatch: pytest.MonkeyPatch, tmp_path) -> Iterator[None]:
    for name in _ENV_VARS:
        monkeypatch.delenv(name, raising=False)
    # cwd without a .env so a local .env can never influence tests
    monkeypatch.chdir(tmp_path)
    reset_settings()
    reset_llm_service()
    yield
    reset_settings()
    reset_llm_service()


@pytest.fixture
def configured_env(monkeypatch: pytest.MonkeyPatch) -> str:
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.setenv("LLM_API_KEY", FAKE_API_KEY)
    monkeypatch.setenv("LLM_MODEL", "gpt-4o-mini")
    return FAKE_API_KEY
