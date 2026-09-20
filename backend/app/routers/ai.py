from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.ai import (
    ActionValidationRequest,
    ActionValidationResponse,
    AIInsightResponse,
    CopilotRequest,
    CopilotResponse,
    EventPlanRequest,
    EventPlanResponse,
    MeetingAnalyzeRequest,
    MeetingIntelligenceResponse,
)
from app.security import get_current_active_user, require_manager_or_admin
from app.services.ai.service import AIService, get_ai_service

router = APIRouter(
    prefix="/ai",
    tags=["ai"],
)


@router.post("/copilot", response_model=CopilotResponse)
def copilot_chat(
    request: CopilotRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    ai_service: AIService = Depends(get_ai_service),
):
    """Natural-language question answering grounded in real ClubOps operational data."""
    return ai_service.copilot_chat(
        db=db,
        user=current_user,
        request=request,
    )


@router.post("/planner", response_model=EventPlanResponse)
@router.post("/events/plan", response_model=EventPlanResponse)
def plan_event(
    request: EventPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
    ai_service: AIService = Depends(get_ai_service),
):
    """Generate a structured event plan with agenda, tasks, resources, and risks."""
    return ai_service.plan_event(
        db=db,
        user=current_user,
        request=request,
    )


@router.post("/actions/validate", response_model=ActionValidationResponse)
def validate_action(
    request: ActionValidationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
    ai_service: AIService = Depends(get_ai_service),
):
    """Validate proposed club actions using deterministic rules and AI operational advice."""
    return ai_service.validate_action(
        db=db,
        user=current_user,
        request=request,
    )


@router.post("/meetings/analyze", response_model=MeetingIntelligenceResponse)
def analyze_meeting(
    request: MeetingAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
    ai_service: AIService = Depends(get_ai_service),
):
    """Extract executive summary, decisions, action items, risks, and follow-ups from meeting transcript."""
    return ai_service.analyze_meeting(
        db=db,
        user=current_user,
        request=request,
    )


@router.get("/insights", response_model=AIInsightResponse)
def get_insights(
    club_id: int | None = Query(None, description="Optional club identifier for targeted insights"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
    ai_service: AIService = Depends(get_ai_service),
):
    """Generate operational insights and recommendations based on real ClubOps attendance and events data."""
    return ai_service.generate_insights(
        db=db,
        user=current_user,
        club_id=club_id,
    )
