from datetime import datetime, timezone
from typing import Any
from fastapi import Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.attendance import Attendance
from app.models.club import Club
from app.models.event import Event
from app.models.member import Member
from app.models.user import User
from app.schemas.ai import (
    ActionValidationRequest,
    ActionValidationResponse,
    AIInsightMetric,
    AIInsightResponse,
    CopilotRequest,
    CopilotResponse,
    EventPlanRequest,
    EventPlanResponse,
    MeetingAnalyzeRequest,
    MeetingIntelligenceResponse,
)
from app.services.ai.client import AIClient, get_ai_client
from app.services.ai.prompts import (
    ACTION_VALIDATION_SYSTEM_PROMPT,
    COPILOT_SYSTEM_PROMPT,
    EVENT_PLANNER_SYSTEM_PROMPT,
    INSIGHTS_SYSTEM_PROMPT,
    MEETING_INTELLIGENCE_SYSTEM_PROMPT,
)
from app.services.ai.tools import (
    get_attendance,
    get_club_summary,
    get_events,
    get_grounding_context,
    get_members,
    get_upcoming_events,
)


class AIService:
    def __init__(self, client: AIClient):
        self.client = client

    def copilot_chat(
        self,
        db: Session,
        user: User,
        request: CopilotRequest,
    ) -> CopilotResponse:
        message = request.message.strip()
        if not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message prompt cannot be empty",
            )

        # Grounding with real database records
        grounding_data, sources, actions = get_grounding_context(
            db=db,
            user=user,
            query=message,
            club_id=request.club_id,
        )

        user_prompt = (
            f"User Question: {message}\n\n"
            f"Verified ClubOps Operational Database Records:\n{grounding_data}\n\n"
            "Please answer the user's question accurately using only the verified records above."
        )

        answer = self.client.generate_text(
            system_prompt=COPILOT_SYSTEM_PROMPT,
            user_prompt=user_prompt,
        )

        return CopilotResponse(
            answer=answer,
            sources=sources,
            actions=actions,
        )

    def plan_event(
        self,
        db: Session,
        user: User,
        request: EventPlanRequest,
    ) -> EventPlanResponse:
        prompt = request.prompt.strip()
        if not prompt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event planning prompt cannot be empty",
            )

        club_context = ""
        if request.club_id is not None:
            summary = get_club_summary(db, request.club_id)
            club_context = f"\nTarget Club Details: {summary}"

        user_prompt = (
            f"User Event Request: {prompt}"
            f"{club_context}\n\n"
            "Generate a structured event plan matching the required JSON format."
        )

        return self.client.generate_structured(
            system_prompt=EVENT_PLANNER_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_model=EventPlanResponse,
        )

    def validate_action(
        self,
        db: Session,
        user: User,
        request: ActionValidationRequest,
    ) -> ActionValidationResponse:
        action_type = request.action_type.strip()
        params = request.parameters

        # 1. Deterministic validation checks
        if action_type == "create_event":
            # Check club exists
            club_id = params.get("club_id") or request.club_id
            if club_id is not None and not db.get(Club, club_id):
                return ActionValidationResponse(
                    valid=False,
                    reason=f"Target club (ID {club_id}) does not exist.",
                    risk="Orphaned event cannot be created.",
                    suggested_correction="Specify an existing, valid club ID.",
                )

            # Check starts_at not in the past
            starts_at_raw = params.get("starts_at")
            if starts_at_raw:
                try:
                    if isinstance(starts_at_raw, str):
                        # Support ISO formats with or without Z
                        starts_dt = datetime.fromisoformat(starts_at_raw.replace("Z", "+00:00"))
                    else:
                        starts_dt = starts_at_raw
                    now = datetime.now(timezone.utc)
                    if starts_dt.tzinfo is None:
                        starts_dt = starts_dt.replace(tzinfo=timezone.utc)
                    if starts_dt < now:
                        return ActionValidationResponse(
                            valid=False,
                            reason="Event start time cannot be in the past.",
                            risk="Historical event scheduling can disrupt member notifications and calendar synchronization.",
                            suggested_correction="Update the event start time to a future date.",
                        )
                except (ValueError, TypeError):
                    return ActionValidationResponse(
                        valid=False,
                        reason="Invalid datetime format for starts_at.",
                        risk="Date parsing failure.",
                        suggested_correction="Use ISO 8601 datetime format (e.g., '2026-10-15T10:00:00Z').",
                    )

        elif action_type == "create_member":
            club_id = params.get("club_id") or request.club_id
            if club_id is not None and not db.get(Club, club_id):
                return ActionValidationResponse(
                    valid=False,
                    reason=f"Target club (ID {club_id}) does not exist.",
                    risk="Member cannot join a non-existent club.",
                    suggested_correction="Provide a valid club ID.",
                )
            email = params.get("email")
            if email:
                existing = db.scalar(select(Member).where(Member.email == email))
                if existing:
                    return ActionValidationResponse(
                        valid=False,
                        reason=f"A member with email '{email}' already exists.",
                        risk="Duplicate member entry.",
                        suggested_correction="Use a unique email address or update the existing member record.",
                    )

        # 2. AI validation for business nuance & risks
        user_prompt = (
            f"Action Type: {action_type}\n"
            f"Parameters: {params}\n"
            f"Club ID: {request.club_id}\n\n"
            "Assess operational validity, schedule risks, and suggest corrections if needed."
        )

        return self.client.generate_structured(
            system_prompt=ACTION_VALIDATION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_model=ActionValidationResponse,
        )

    def analyze_meeting(
        self,
        db: Session,
        user: User,
        request: MeetingAnalyzeRequest,
    ) -> MeetingIntelligenceResponse:
        transcript = request.transcript.strip()
        if not transcript:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Meeting transcript cannot be empty",
            )

        club_info = ""
        if request.club_id is not None:
            club = db.get(Club, request.club_id)
            if club:
                club_info = f"\nClub Context: {club.name} (ID {club.id})"

        user_prompt = (
            f"Meeting Transcript:\n{transcript}"
            f"{club_info}\n\n"
            "Extract structured meeting intelligence, decisions, action items with owners and deadlines, risks, and follow-ups."
        )

        return self.client.generate_structured(
            system_prompt=MEETING_INTELLIGENCE_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_model=MeetingIntelligenceResponse,
        )

    def generate_insights(
        self,
        db: Session,
        user: User,
        club_id: int | None = None,
    ) -> AIInsightResponse:
        # 1. Compute factual metrics from DB
        club_stmt = select(Club)
        member_stmt = select(Member)
        event_stmt = select(Event)
        attendance_stmt = select(Attendance)

        if club_id is not None:
            club_stmt = club_stmt.where(Club.id == club_id)
            member_stmt = member_stmt.where(Member.club_id == club_id)
            event_stmt = event_stmt.where(Event.club_id == club_id)
            # Find events for this club
            event_ids = db.scalars(select(Event.id).where(Event.club_id == club_id)).all()
            if event_ids:
                attendance_stmt = attendance_stmt.where(Attendance.event_id.in_(event_ids))
            else:
                attendance_stmt = attendance_stmt.where(Attendance.id == -1)

        total_clubs = len(db.scalars(club_stmt).all())
        members = db.scalars(member_stmt).all()
        total_members = len(members)
        events = db.scalars(event_stmt).all()
        total_events = len(events)

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        upcoming_events = sum(1 for e in events if e.starts_at and e.starts_at >= now)

        attendance_records = db.scalars(attendance_stmt).all()
        total_attendance = len(attendance_records)
        present_count = sum(1 for a in attendance_records if a.present)
        attendance_rate = (
            round((present_count / total_attendance) * 100, 1)
            if total_attendance > 0
            else 0.0
        )

        # Inactive members: members with no 'present' attendance
        attended_member_ids = {a.member_id for a in attendance_records if a.present}
        inactive_members_count = sum(1 for m in members if m.id not in attended_member_ids)

        metrics = [
            AIInsightMetric(
                metric_name="Total Clubs",
                value=total_clubs,
                interpretation=f"{total_clubs} active club organization(s) managed.",
            ),
            AIInsightMetric(
                metric_name="Total Members",
                value=total_members,
                interpretation=f"{total_members} enrolled member(s).",
            ),
            AIInsightMetric(
                metric_name="Total Events",
                value=total_events,
                interpretation=f"{total_events} scheduled event(s) across the calendar.",
            ),
            AIInsightMetric(
                metric_name="Upcoming Events",
                value=upcoming_events,
                interpretation=f"{upcoming_events} upcoming event(s) requiring active coordination.",
            ),
            AIInsightMetric(
                metric_name="Attendance Rate",
                value=f"{attendance_rate}%",
                interpretation=(
                    "Healthy participation rate"
                    if attendance_rate >= 70
                    else "Moderate to low attendance; promotional outreach recommended"
                ),
            ),
            AIInsightMetric(
                metric_name="Inactive Members",
                value=inactive_members_count,
                interpretation=(
                    f"{inactive_members_count} member(s) have not attended recent events."
                ),
            ),
        ]

        metrics_text = "\n".join(
            f"- {m.metric_name}: {m.value} ({m.interpretation})" for m in metrics
        )

        user_prompt = (
            f"Club ID: {club_id or 'All Clubs'}\n"
            f"Factual ClubOps Metrics:\n{metrics_text}\n\n"
            "Generate qualitative operational insights and actionable recommendations grounded strictly in these metrics."
        )

        try:
            insight_data = self.client.generate_structured(
                system_prompt=INSIGHTS_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                response_model=AIInsightResponse,
            )
            return AIInsightResponse(
                club_id=club_id,
                metrics=metrics,
                insights=insight_data.insights,
                recommendations=insight_data.recommendations,
            )
        except Exception:
            # Fallback deterministic interpretation if LLM call fails
            return AIInsightResponse(
                club_id=club_id,
                metrics=metrics,
                insights=[
                    f"Current event schedule features {upcoming_events} upcoming session(s).",
                    f"Overall recorded attendance turnout is at {attendance_rate}%.",
                ],
                recommendations=[
                    "Send timely reminders 24 hours prior to upcoming events.",
                    "Engage inactive members through personalized feedback surveys.",
                ],
            )


def get_ai_service(
    client: AIClient = Depends(get_ai_client),
) -> AIService:
    return AIService(client=client)
