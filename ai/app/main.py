"""FastAPI entrypoint for the ClubOps AI service."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.core.config import get_settings
from app.core.exceptions import (
    ActionValidationError,
    AIServiceError,
    MalformedAIOutputError,
)
from app.core.llm import close_llm_service
from app.schemas.action_engine import ActionEngineRequest, ActionProposalList
from app.schemas.communication import (
    AnnouncementRequest,
    AnnouncementResult,
    BriefingRequest,
    DailyBriefing,
)
from app.schemas.event import Event, EventPlanRequest
from app.schemas.knowledge import KnowledgeAnswer, KnowledgeQueryRequest
from app.schemas.meeting import MeetingResult
from app.schemas.meeting_intelligence import MeetingIntelligenceRequest
from app.schemas.risk_intelligence import (
    RiskAnalysisResult,
    RiskIntelligenceRequest,
)
from app.services.action_engine import ActionEngineService
from app.services.announcement_generator import AnnouncementGeneratorService
from app.services.daily_briefing import DailyBriefingService
from app.services.event_planner import EventPlannerService
from app.services.knowledge_assistant import KnowledgeAssistantService
from app.services.meeting_intelligence import MeetingIntelligenceService
from app.services.risk_intelligence import RiskIntelligenceService
from app.validators.action_validator import validate_ai_action, validate_ai_actions

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
    description="Internal AI service for event planning, LLM operations, and validation.",
    version=__version__,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AIServiceError)
async def ai_service_error_handler(_: Request, exc: AIServiceError) -> JSONResponse:
    """Return safe, already-redacted error payloads (never leak secrets)."""
    logger.error("%s: %s", type(exc).__name__, exc.message)
    return JSONResponse(status_code=exc.status_code, content=exc.to_dict())


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    """Catch unexpected errors, log securely, and return safe 500 without leaking tracebacks."""
    logger.exception("Unhandled server error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"error": "InternalServerError", "message": "An unexpected server error occurred."},
    )


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
    "/meetings/analyze",
    response_model=MeetingResult,
    tags=["meeting_intelligence"],
    summary="Extract structured meeting intelligence from raw transcripts",
)
async def analyze_meeting(request: MeetingIntelligenceRequest) -> MeetingResult:
    """Extract summary, decisions, action items, and follow-ups from meeting transcript."""
    service = MeetingIntelligenceService()
    return await service.process_transcript(request)


@app.post(
    "/risks/analyze",
    response_model=RiskAnalysisResult,
    tags=["risk_intelligence"],
    summary="Identify grounded operational risks with deterministic evidence validation",
)
async def analyze_risks(request: RiskIntelligenceRequest) -> RiskAnalysisResult:
    """Analyze operational context and return validated, evidence-grounded risks."""
    service = RiskIntelligenceService()
    return await service.analyze_risks(request)


@app.post(
    "/actions/propose",
    response_model=ActionProposalList,
    tags=["action_engine"],
    summary="Generate safe, structured action proposals from operational context",
)
async def propose_actions(request: ActionEngineRequest) -> ActionProposalList:
    """Convert user intent and context into safe, whitelisted action proposals."""
    service = ActionEngineService()
    return await service.propose_actions(request)


@app.post(
    "/knowledge/query",
    response_model=KnowledgeAnswer,
    tags=["knowledge"],
    summary="Answer queries strictly grounded in retrieved club knowledge documents",
)
async def query_knowledge(request: KnowledgeQueryRequest) -> KnowledgeAnswer:
    """Answer questions strictly from retrieved context chunks with source citations."""
    service = KnowledgeAssistantService()
    return await service.answer(request)


@app.post(
    "/announcements/generate",
    response_model=AnnouncementResult,
    tags=["communication"],
    summary="Generate grounded draft announcement from supplied event and club facts",
)
async def generate_announcement(request: AnnouncementRequest) -> AnnouncementResult:
    """Draft grounded club announcements tailored to audience and tone."""
    service = AnnouncementGeneratorService()
    return await service.generate(request)


@app.post(
    "/briefings/generate",
    response_model=DailyBriefing,
    tags=["communication"],
    summary="Generate grounded, categorized daily operational briefing",
)
async def generate_briefing(request: BriefingRequest) -> DailyBriefing:
    """Synthesize operational context into a structured, categorized daily briefing."""
    service = DailyBriefingService()
    return await service.generate(request)


@app.post(
    "/actions/validate",
    tags=["validation"],
    summary="Validate single AI action against permitted whitelist",
)
async def validate_action(request: Request) -> dict[str, Any]:
    """Validate raw AI output as a safe, strictly typed AIAction object."""
    try:
        raw_action = await request.json()
    except Exception:
        raise MalformedAIOutputError("Request body must be valid JSON.") from None
    if not isinstance(raw_action, dict):
        raise ActionValidationError("Action payload must be a JSON object.")
    action = validate_ai_action(raw_action)
    return action.model_dump(mode="json")


@app.post(
    "/actions/validate-batch",
    tags=["validation"],
    summary="Validate multiple AI actions against permitted whitelist",
)
async def validate_action_batch(request: Request) -> list[dict[str, Any]]:
    """Validate list of raw actions against permitted whitelist."""
    try:
        raw_actions = await request.json()
    except Exception:
        raise MalformedAIOutputError("Request body must be valid JSON.") from None
    if not isinstance(raw_actions, list):
        raise ActionValidationError("Batch action payload must be a JSON array.")
    actions = validate_ai_actions(raw_actions)
    return [a.model_dump(mode="json") for a in actions]
