"""FastAPI entrypoint for the ClubOps AI service (Sprint 1: health only)."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app import __version__
from app.core.config import get_settings
from app.core.exceptions import AIServiceError
from app.core.llm import close_llm_service

logger = logging.getLogger("clubops.ai")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )
    logger.info("Starting ClubOps AI service: %s", settings.safe_summary())
    if settings.requires_api_key and settings.llm_api_key is None:
        logger.warning(
            "LLM_API_KEY is not set - /health will respond, but LLM calls will fail. "
            "Copy ai/.env.example to ai/.env."
        )
    try:
        yield
    finally:
        await close_llm_service()
        logger.info("ClubOps AI service stopped.")


app = FastAPI(
    title="ClubOps AI",
    description="Internal AI service for ClubOps.",
    version=__version__,
    lifespan=lifespan,
)


@app.exception_handler(AIServiceError)
async def ai_service_error_handler(_: Request, exc: AIServiceError) -> JSONResponse:
    """Return safe, already-redacted error payloads (never leak secrets)."""
    logger.error("%s: %s", type(exc).__name__, exc.message)
    return JSONResponse(status_code=exc.status_code, content=exc.to_dict())


@app.get("/health", tags=["system"], summary="Service health check")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": get_settings().service_name}
