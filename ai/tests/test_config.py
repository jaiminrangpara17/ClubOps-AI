"""Configuration loading tests."""

from __future__ import annotations

import pytest

from app.core.config import PROVIDER_BASE_URLS, get_settings, reset_settings
from app.core.exceptions import ConfigurationError, redact_secrets


def test_defaults_are_applied() -> None:
    settings = get_settings()
    assert settings.service_name == "clubops-ai"
    assert settings.llm_provider == "gemini"
    assert settings.llm_temperature == 0.2
    assert settings.llm_timeout_seconds == 30.0
    assert settings.llm_api_key is None


def test_env_overrides_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    monkeypatch.setenv("LLM_MODEL", "llama-3.1-8b-instant")
    monkeypatch.setenv("LLM_TEMPERATURE", "0.9")
    monkeypatch.setenv("LLM_TIMEOUT_SECONDS", "12.5")
    monkeypatch.setenv("LLM_API_KEY", "gsk_testkey")
    reset_settings()

    settings = get_settings()
    assert settings.llm_provider == "groq"
    assert settings.llm_model == "llama-3.1-8b-instant"
    assert settings.llm_temperature == 0.9
    assert settings.llm_timeout_seconds == 12.5
    assert settings.api_key() == "gsk_testkey"


def test_invalid_temperature_raises_configuration_error(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LLM_TEMPERATURE", "9.5")
    reset_settings()
    with pytest.raises(ConfigurationError) as err:
        get_settings()
    assert "llm_temperature" in str(err.value)


def test_missing_api_key_raises_on_access() -> None:
    settings = get_settings()
    assert settings.requires_api_key is True
    with pytest.raises(ConfigurationError) as err:
        settings.api_key()
    assert "LLM_API_KEY" in str(err.value)


def test_provider_without_auth_does_not_require_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    reset_settings()
    settings = get_settings()
    assert settings.requires_api_key is False
    assert settings.api_key() == "not-required"


def test_provider_base_url_resolution(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    reset_settings()
    assert get_settings().resolved_base_url == PROVIDER_BASE_URLS["openai"]


def test_explicit_base_url_overrides_provider_default(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LLM_BASE_URL", "http://localhost:9999/v1")
    reset_settings()
    assert get_settings().resolved_base_url == "http://localhost:9999/v1"


def test_api_key_is_never_exposed(monkeypatch: pytest.MonkeyPatch, configured_env: str) -> None:
    reset_settings()
    settings = get_settings()
    assert configured_env not in repr(settings)
    assert configured_env not in str(settings.safe_summary())
    assert settings.safe_summary()["api_key_configured"] is True
    assert configured_env not in redact_secrets(
        f"boom: {configured_env}", settings.secret_values()
    )