"""FastAPI entrypoint for the ClubOps AI service."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app import __version__
from app.core.config import get_settings
from app.core.exceptions import AIServiceError
from app.core.llm import close_llm_service
from app.schemas.common import EventType
from app.schemas.event import Event
from app.services.event_planner import EventPlannerService
from app.validators.action_validator import validate_ai_action, validate_ai_actions

logger = logging.getLogger("clubops.ai")


class EventPlanRequest(BaseModel):
    """Payload for generating an AI event plan."""

    prompt: str = Field(min_length=3, description="User prompt describing event requirements")
    event_type: EventType | None = Field(default=None, description="Preferred event category")
    target_date: str | None = Field(default=None, description="Target start date or date range")
    expected_attendees: int | None = Field(
        default=None, ge=0, description="Estimated participant count"
    )
    temperature: float = Field(
        default=0.2, ge=0.0, le=1.0, description="Sampling temperature"
    )


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
    description="Internal AI service for event planning, LLM operations, and validation.",
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


@app.post(
    "/events/plan",
    response_model=Event,
    tags=["planner"],
    summary="Generate structured event plan with tasks, milestones, and risks",
)
async def plan_event(request: EventPlanRequest) -> Event:
    """Generate and validate a structured Event plan from natural language instructions."""
    service = EventPlannerService()
    return await service.generate_plan(
        prompt=request.prompt,
        event_type=request.event_type.value if request.event_type else None,
        target_date=request.target_date,
        expected_attendees=request.expected_attendees,
        temperature=request.temperature,
    )


@app.post(
    "/actions/validate",
    tags=["validation"],
    summary="Validate single AI action against permitted whitelist",
)
async def validate_action(request: Request) -> dict[str, Any]:
    """Validate raw AI output as a safe, strictly typed AIAction object."""
    raw_action = await request.json()
    action = validate_ai_action(raw_action)
    return action.model_dump(mode="json")


@app.post(
    "/actions/validate-batch",
    tags=["validation"],
    summary="Validate multiple AI actions against permitted whitelist",
)
async def validate_action_batch(request: Request) -> list[dict[str, Any]]:
    """Validate list of raw actions against permitted whitelist."""
    raw_actions = await request.json()
    actions = validate_ai_actions(raw_actions)
    return [a.model_dump(mode="json") for a in actions]
