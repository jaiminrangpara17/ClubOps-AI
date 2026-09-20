"""Configuration for the ClubOps AI service.

Every value comes from environment variables (or a local, git-ignored ``.env``).
No secret is ever hardcoded, and ``Settings`` never renders the API key.
"""

from __future__ import annotations

from typing import Literal

from pydantic import Field, SecretStr, ValidationError, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.exceptions import ConfigurationError

LLMProvider = Literal["openai", "gemini", "groq", "openrouter", "ollama"]

# All supported providers expose an OpenAI-compatible chat-completions API,
# so one client + one base URL table covers them all.
PROVIDER_BASE_URLS: dict[str, str] = {
    "openai": "https://api.openai.com/v1",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/",
    "groq": "https://api.groq.com/openai/v1",
    "openrouter": "https://openrouter.ai/api/v1",
    "ollama": "http://localhost:11434/v1",
}

PROVIDERS_WITHOUT_AUTH: frozenset[str] = frozenset({"ollama"})


class Settings(BaseSettings):
    """Runtime settings, loaded from the environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- service ---
    service_name: str = "clubops-ai"
    app_env: Literal["development", "test", "production"] = "development"
    log_level: str = "INFO"

    # --- llm ---
    llm_provider: LLMProvider = "gemini"
    llm_api_key: SecretStr | None = None
    llm_model: str = "gemini-2.0-flash"
    llm_temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    llm_timeout_seconds: float = Field(default=30.0, gt=0.0, le=300.0)
    llm_max_retries: int = Field(default=2, ge=0, le=5)
    llm_base_url: str | None = None
    llm_max_output_tokens: int | None = Field(default=None, gt=0, le=32_000)

    @field_validator("log_level")
    @classmethod
    def _normalise_log_level(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("llm_model", "service_name")
    @classmethod
    def _require_non_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be empty")
        return value.strip()

    @property
    def requires_api_key(self) -> bool:
        return self.llm_provider not in PROVIDERS_WITHOUT_AUTH

    @property
    def resolved_base_url(self) -> str:
        return self.llm_base_url or PROVIDER_BASE_URLS[self.llm_provider]

    def api_key(self) -> str:
        """Return the raw API key, or raise :class:`ConfigurationError`."""
        if self.llm_api_key is not None:
            return self.llm_api_key.get_secret_value()
        if not self.requires_api_key:
            return "not-required"
        raise ConfigurationError(
            f"LLM_API_KEY is not set. Provider '{self.llm_provider}' requires an API key. "
            "Copy ai/.env.example to ai/.env and fill it in."
        )

    def secret_values(self) -> tuple[str, ...]:
        """Secrets that must be scrubbed from logs and error messages."""
        if self.llm_api_key is None:
            return ()
        return (self.llm_api_key.get_secret_value(),)

    def safe_summary(self) -> dict[str, object]:
        """Log-safe view of the configuration (never includes the key)."""
        return {
            "service": self.service_name,
            "env": self.app_env,
            "provider": self.llm_provider,
            "model": self.llm_model,
            "base_url": self.resolved_base_url,
            "temperature": self.llm_temperature,
            "timeout_seconds": self.llm_timeout_seconds,
            "api_key_configured": self.llm_api_key is not None,
        }


_settings: Settings | None = None


def get_settings() -> Settings:
    """Return the cached settings instance, validating the environment once."""
    global _settings
    if _settings is None:
        try:
            _settings = Settings()
        except ValidationError as exc:
            raise ConfigurationError(
                f"Invalid AI service configuration -> {_summarise(exc)}"
            ) from None
    return _settings


def reset_settings() -> None:
    """Clear the cached settings (used by tests)."""
    global _settings
    _settings = None


def _summarise(exc: ValidationError) -> str:
    """Field names + reasons only - never the offending values."""
    return "; ".join(
        f"{'.'.join(str(part) for part in error['loc']) or 'config'}: {error['msg']}"
        for error in exc.errors()
    )
