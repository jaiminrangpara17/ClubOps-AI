"""Analytics router — GET /analytics/overview and GET /analytics/clubs/{club_id}."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.attendance import Attendance
from app.models.club import Club
from app.models.event import Event
from app.models.member import Member
from app.models.user import User
from app.schemas.analytics import ClubAnalytics, ClubSummary, EventAttendanceSummary, OverviewAnalytics
from app.security import require_manager_or_admin

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _present_expr():
    """SQLAlchemy expression that counts rows where present is True."""
    return func.sum(case((Attendance.present.is_(True), 1), else_=0))


def _rate(present_col, total_col) -> float:
    """Safe division; returns 0.0 when denominator is 0."""
    if total_col == 0:
        return 0.0
    return round(present_col / total_col, 4)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/overview", response_model=OverviewAnalytics)
def analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    """
    Return a high-level snapshot of the entire ClubOps system:
    total clubs, members, events, attendance records, and an
    attendance-rate breakdown per club.
    """
    total_clubs = db.query(func.count(Club.id)).scalar() or 0
    total_members = db.query(func.count(Member.id)).scalar() or 0
    total_events = db.query(func.count(Event.id)).scalar() or 0
    total_records = db.query(func.count(Attendance.id)).scalar() or 0
    total_present = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.present.is_(True))
        .scalar()
        or 0
    )
    overall_rate = _rate(total_present, total_records)

    # Per-club breakdown using aggregation
    rows = (
        db.query(
            Club.id,
            Club.name,
            func.count(Member.id.distinct()).label("member_count"),
            func.count(Event.id.distinct()).label("event_count"),
            func.count(Attendance.id).label("att_total"),
            _present_expr().label("att_present"),
        )
        .outerjoin(Member, Member.club_id == Club.id)
        .outerjoin(Event, Event.club_id == Club.id)
        .outerjoin(Attendance, Attendance.event_id == Event.id)
        .group_by(Club.id, Club.name)
        .all()
    )

    clubs = [
        ClubSummary(
            club_id=r.id,
            club_name=r.name,
            total_members=r.member_count,
            total_events=r.event_count,
            average_attendance_rate=_rate(r.att_present or 0, r.att_total or 0),
        )
        for r in rows
    ]

    return OverviewAnalytics(
        total_clubs=total_clubs,
        total_members=total_members,
        total_events=total_events,
        total_attendance_records=total_records,
        overall_attendance_rate=overall_rate,
        clubs=clubs,
    )


@router.get("/clubs/{club_id}", response_model=ClubAnalytics)
def analytics_club(
    club_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    """
    Return detailed analytics for a single club including a per-event
    attendance breakdown.
    """
    club = db.query(Club).filter(Club.id == club_id).first()
    if club is None:
        raise HTTPException(status_code=404, detail="Club not found")

    total_members = (
        db.query(func.count(Member.id)).filter(Member.club_id == club_id).scalar() or 0
    )

    # Per-event attendance
    event_rows = (
        db.query(
            Event.id,
            Event.title,
            func.count(Attendance.id).label("att_total"),
            _present_expr().label("att_present"),
        )
        .outerjoin(Attendance, Attendance.event_id == Event.id)
        .filter(Event.club_id == club_id)
        .group_by(Event.id, Event.title)
        .all()
    )

    events: list[EventAttendanceSummary] = []
    total_event_present = 0
    total_event_records = 0

    for r in event_rows:
        att_total = r.att_total or 0
        att_present = r.att_present or 0
        total_event_records += att_total
        total_event_present += att_present
        events.append(
            EventAttendanceSummary(
                event_id=r.id,
                event_title=r.title,
                total_records=att_total,
                present_count=att_present,
                attendance_rate=_rate(att_present, att_total),
            )
        )

    avg_rate = _rate(total_event_present, total_event_records)

    return ClubAnalytics(
        club_id=club.id,
        club_name=club.name,
        total_members=total_members,
        total_events=len(event_rows),
        average_attendance_rate=avg_rate,
        events=events,
    )
