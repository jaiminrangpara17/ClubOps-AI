from datetime import datetime, timezone
from typing import Any
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.club import Club
from app.models.event import Event
from app.models.member import Member
from app.models.user import User
from app.schemas.ai import CopilotAction, CopilotSource


def get_clubs(db: Session) -> list[dict[str, Any]]:
    clubs = db.scalars(select(Club).order_by(Club.id)).all()
    return [
        {"id": c.id, "name": c.name, "description": c.description}
        for c in clubs
    ]


def get_members(db: Session, club_id: int | None = None) -> list[dict[str, Any]]:
    stmt = select(Member)
    if club_id is not None:
        stmt = stmt.where(Member.club_id == club_id)
    members = db.scalars(stmt.order_by(Member.id)).all()
    return [
        {"id": m.id, "name": m.name, "email": m.email, "club_id": m.club_id}
        for m in members
    ]


def get_events(
    db: Session,
    club_id: int | None = None,
    upcoming_only: bool = False,
) -> list[dict[str, Any]]:
    stmt = select(Event)
    if club_id is not None:
        stmt = stmt.where(Event.club_id == club_id)
    if upcoming_only:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        stmt = stmt.where(Event.starts_at >= now)
    events = db.scalars(stmt.order_by(Event.starts_at, Event.id)).all()
    return [
        {
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "starts_at": e.starts_at.isoformat() if e.starts_at else None,
            "club_id": e.club_id,
        }
        for e in events
    ]


def get_upcoming_events(
    db: Session,
    club_id: int | None = None,
) -> list[dict[str, Any]]:
    return get_events(db, club_id=club_id, upcoming_only=True)


def get_attendance(
    db: Session,
    event_id: int | None = None,
    member_id: int | None = None,
) -> list[dict[str, Any]]:
    stmt = select(Attendance)
    if event_id is not None:
        stmt = stmt.where(Attendance.event_id == event_id)
    if member_id is not None:
        stmt = stmt.where(Attendance.member_id == member_id)
    records = db.scalars(stmt.order_by(Attendance.id)).all()
    return [
        {
            "id": a.id,
            "member_id": a.member_id,
            "event_id": a.event_id,
            "present": a.present,
        }
        for a in records
    ]


def get_member_attendance(db: Session, member_id: int) -> list[dict[str, Any]]:
    return get_attendance(db, member_id=member_id)


def get_club_summary(db: Session, club_id: int) -> dict[str, Any]:
    club = db.get(Club, club_id)
    if not club:
        return {"error": "Club not found"}
    members = db.scalars(select(Member).where(Member.club_id == club_id)).all()
    events = db.scalars(select(Event).where(Event.club_id == club_id)).all()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    upcoming = [e for e in events if e.starts_at and e.starts_at >= now]
    return {
        "club_id": club.id,
        "name": club.name,
        "description": club.description,
        "total_members": len(members),
        "total_events": len(events),
        "upcoming_events_count": len(upcoming),
    }


def get_grounding_context(
    db: Session,
    user: User,
    query: str,
    club_id: int | None = None,
) -> tuple[str, list[CopilotSource], list[CopilotAction]]:
    """Inspect query intent and extract relevant database records for AI grounding."""
    q_lower = query.lower()
    context_lines: list[str] = []
    sources: list[CopilotSource] = []
    actions: list[CopilotAction] = []

    # 1. Club info
    all_clubs = get_clubs(db)
    target_club = None
    if club_id is not None:
        target_club = next((c for c in all_clubs if c["id"] == club_id), None)
    elif len(all_clubs) == 1:
        target_club = all_clubs[0]

    if target_club:
        context_lines.append(
            f"Club: '{target_club['name']}' (ID: {target_club['id']}), Description: {target_club.get('description') or 'None'}"
        )
        sources.append(CopilotSource(type="club", id=target_club["id"], name=target_club["name"]))
        actions.append(CopilotAction(label=f"View {target_club['name']}", action_type="navigate", target=f"/clubs/{target_club['id']}"))
    else:
        context_lines.append(f"Clubs in system ({len(all_clubs)} total): " + ", ".join(f"{c['name']} (ID: {c['id']})" for c in all_clubs))

    # 2. Member questions
    if any(k in q_lower for k in ["member", "members", "who", "people", "inactive"]):
        cid = target_club["id"] if target_club else None
        members = get_members(db, club_id=cid)
        club_label = f" in {target_club['name']}" if target_club else ""
        context_lines.append(f"Total members{club_label}: {len(members)}")
        for m in members[:20]:
            context_lines.append(f" - Member: {m['name']} (Email: {m['email']}, ID: {m['id']})")
            if len(sources) < 10:
                sources.append(CopilotSource(type="member", id=m["id"], name=m["name"]))

    # 3. Event questions
    if any(k in q_lower for k in ["event", "events", "upcoming", "scheduled", "workshop", "activity", "week", "schedule"]):
        cid = target_club["id"] if target_club else None
        all_ev = get_events(db, club_id=cid)
        up_ev = get_upcoming_events(db, club_id=cid)
        context_lines.append(f"Events summary: {len(all_ev)} total events, {len(up_ev)} upcoming events.")
        for e in up_ev:
            context_lines.append(f" - Upcoming Event: '{e['title']}' at {e['starts_at']} (ID: {e['id']})")
            sources.append(CopilotSource(type="event", id=e["id"], name=e["title"]))
            actions.append(CopilotAction(label=f"View {e['title']}", action_type="navigate", target=f"/events/{e['id']}"))
        for e in all_ev:
            if e not in up_ev:
                context_lines.append(f" - Past Event: '{e['title']}' at {e['starts_at']} (ID: {e['id']})")

    # 4. Attendance questions
    if any(k in q_lower for k in ["attend", "attendance", "turnout", "participat"]):
        cid = target_club["id"] if target_club else None
        evs = get_events(db, club_id=cid)
        for e in evs:
            att = get_attendance(db, event_id=e["id"])
            present_count = sum(1 for a in att if a["present"])
            context_lines.append(
                f"Event '{e['title']}' (ID: {e['id']}): Total attendance records = {len(att)}, Present = {present_count}."
            )
            # Find member names for attended
            for a in att:
                if a["present"]:
                    m = db.get(Member, a["member_id"])
                    m_name = m.name if m else f"ID {a['member_id']}"
                    context_lines.append(f"   * Attended by: {m_name}")

    # Fallback general summary if no specific keyword matched
    if not context_lines or len(context_lines) <= 1:
        cid = target_club["id"] if target_club else None
        members = get_members(db, club_id=cid)
        events = get_events(db, club_id=cid)
        context_lines.append(f"Overview: {len(all_clubs)} clubs, {len(members)} members, {len(events)} events.")

    context_str = "\n".join(context_lines)
    return context_str, sources, actions
