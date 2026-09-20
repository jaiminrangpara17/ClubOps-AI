"""
seed_demo.py — Idempotent demo data seed for ClubOps AI.

Usage (from the backend/ directory):
    python scripts/seed_demo.py

What it creates
───────────────
Users
  admin    / AdminPass123!      role=admin
  manager  / ManagerPass123!    role=manager
  member1  / MemberPass123!     role=member

Club
  Ahmedabad AI Community

Club Members (not the same as app Users — these are club roster records)
  Priya Sharma      priya.sharma@example.com
  Rohan Mehta       rohan.mehta@example.com
  Anjali Patel      anjali.patel@example.com
  Dev Kapoor        dev.kapoor@example.com

Events
  AI Workshop 2026          (past,     2026-08-15)
  Hackathon Sprint          (past,     2026-09-05)
  Guest Lecture: LLMs       (upcoming, 2026-10-20)

Attendance
  AI Workshop 2026   → Priya ✓  Rohan ✓  Anjali ✗  Dev ✓
  Hackathon Sprint   → Priya ✓  Rohan ✗  Anjali ✓  Dev ✓

Safety
  All inserts are idempotent — running the script twice will NOT raise errors
  or create duplicates. Existing records are detected and skipped gracefully.
  No data is ever deleted.
"""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

# ── Allow running as `python scripts/seed_demo.py` from backend/ ─────────────
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.attendance import Attendance
from app.models.club import Club
from app.models.event import Event
from app.models.member import Member
from app.models.user import User, UserRole
from app.security import hash_password


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────


def _get_or_create_user(
    db: Session,
    *,
    username: str,
    email: str,
    full_name: str,
    password: str,
    role: str,
) -> tuple[User, bool]:
    """Return (user, created).  Never raises on duplicate."""
    existing = db.scalar(select(User).where(User.username == username))
    if existing:
        return existing, False
    user = User(
        username=username,
        email=email,
        full_name=full_name,
        hashed_password=hash_password(password),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.flush()
    return user, True


def _get_or_create_club(db: Session, *, name: str, description: str) -> tuple[Club, bool]:
    existing = db.scalar(select(Club).where(Club.name == name))
    if existing:
        return existing, False
    club = Club(name=name, description=description)
    db.add(club)
    db.flush()
    return club, True


def _get_or_create_member(
    db: Session, *, name: str, email: str, club_id: int
) -> tuple[Member, bool]:
    existing = db.scalar(select(Member).where(Member.email == email))
    if existing:
        return existing, False
    m = Member(name=name, email=email, club_id=club_id)
    db.add(m)
    db.flush()
    return m, True


def _get_or_create_event(
    db: Session, *, title: str, description: str, starts_at: datetime, club_id: int
) -> tuple[Event, bool]:
    existing = db.scalar(
        select(Event).where(Event.title == title, Event.club_id == club_id)
    )
    if existing:
        return existing, False
    e = Event(title=title, description=description, starts_at=starts_at, club_id=club_id)
    db.add(e)
    db.flush()
    return e, True


def _get_or_create_attendance(
    db: Session, *, member_id: int, event_id: int, present: bool
) -> tuple[Attendance, bool]:
    existing = db.scalar(
        select(Attendance).where(
            Attendance.member_id == member_id,
            Attendance.event_id == event_id,
        )
    )
    if existing:
        return existing, False
    a = Attendance(member_id=member_id, event_id=event_id, present=present)
    db.add(a)
    db.flush()
    return a, True


def _ts(year: int, month: int, day: int) -> datetime:
    return datetime(year, month, day, 10, 0, 0, tzinfo=timezone.utc)


# ─────────────────────────────────────────────────────────────────────────────
# Main seed logic
# ─────────────────────────────────────────────────────────────────────────────


def seed(db: Session) -> None:
    print("[SEED] ClubOps AI -- demo seed starting ...\n")

    # -- Users ----------------------------------------------------------------
    admin, c = _get_or_create_user(
        db,
        username="admin",
        email="admin@clubops.demo",
        full_name="Admin User",
        password="AdminPass123!",
        role=UserRole.ADMIN.value,
    )
    print(f"  {'[CREATED]' if c else '[EXISTS] '} user  -> admin (role=admin)")

    manager, c = _get_or_create_user(
        db,
        username="manager",
        email="manager@clubops.demo",
        full_name="Manager User",
        password="ManagerPass123!",
        role=UserRole.MANAGER.value,
    )
    print(f"  {'[CREATED]' if c else '[EXISTS] '} user  -> manager (role=manager)")

    member_user, c = _get_or_create_user(
        db,
        username="member1",
        email="member1@clubops.demo",
        full_name="Member User",
        password="MemberPass123!",
        role=UserRole.MEMBER.value,
    )
    print(f"  {'[CREATED]' if c else '[EXISTS] '} user  -> member1 (role=member)")

    # -- Club -----------------------------------------------------------------
    club, c = _get_or_create_club(
        db,
        name="Ahmedabad AI Community",
        description=(
            "A vibrant community of AI enthusiasts, engineers, and researchers "
            "based in Ahmedabad. We run workshops, hackathons, and guest lectures "
            "to foster learning and collaboration in AI/ML."
        ),
    )
    print(f"\n  {'[CREATED]' if c else '[EXISTS] '} club  -> {club.name}")

    # -- Club members (roster entries, separate from app Users) -------------
    roster = [
        ("Priya Sharma", "priya.sharma@example.com"),
        ("Rohan Mehta", "rohan.mehta@example.com"),
        ("Anjali Patel", "anjali.patel@example.com"),
        ("Dev Kapoor", "dev.kapoor@example.com"),
    ]
    members: list[Member] = []
    print()
    for name, email in roster:
        m, c = _get_or_create_member(db, name=name, email=email, club_id=club.id)
        print(f"  {'[CREATED]' if c else '[EXISTS] '} member -> {name}")
        members.append(m)

    priya, rohan, anjali, dev = members

    # -- Events ---------------------------------------------------------------
    workshop, c = _get_or_create_event(
        db,
        title="AI Workshop 2026",
        description="Hands-on workshop covering modern AI/ML frameworks and applied project labs.",
        starts_at=_ts(2026, 8, 15),
        club_id=club.id,
    )
    print(f"\n  {'[CREATED]' if c else '[EXISTS] '} event -> AI Workshop 2026 (past)")

    hackathon, c = _get_or_create_event(
        db,
        title="Hackathon Sprint",
        description="24-hour hackathon focused on building AI-powered prototypes for real-world problems.",
        starts_at=_ts(2026, 9, 5),
        club_id=club.id,
    )
    print(f"  {'[CREATED]' if c else '[EXISTS] '} event -> Hackathon Sprint (past)")

    lecture, c = _get_or_create_event(
        db,
        title="Guest Lecture: LLMs in Production",
        description="Industry expert talk on deploying large language models at scale - challenges, best practices, and live demo.",
        starts_at=_ts(2026, 10, 20),
        club_id=club.id,
    )
    print(f"  {'[CREATED]' if c else '[EXISTS] '} event -> Guest Lecture: LLMs (upcoming)")

    # -- Attendance -----------------------------------------------------------
    #  AI Workshop: Priya present  Rohan present  Anjali absent  Dev present
    attendance_data = [
        (priya.id, workshop.id, True),
        (rohan.id, workshop.id, True),
        (anjali.id, workshop.id, False),
        (dev.id, workshop.id, True),
        # Hackathon: Priya present  Rohan absent  Anjali present  Dev present
        (priya.id, hackathon.id, True),
        (rohan.id, hackathon.id, False),
        (anjali.id, hackathon.id, True),
        (dev.id, hackathon.id, True),
    ]
    print()
    for mid, eid, present in attendance_data:
        _, c = _get_or_create_attendance(db, member_id=mid, event_id=eid, present=present)
        status = "present" if present else "absent "
        if c:
            print(f"  [CREATED] attendance  member_id={mid} event_id={eid} [{status}]")
        else:
            print(f"  [EXISTS]  attendance  member_id={mid} event_id={eid} [{status}]")

    db.commit()
    print("\n[DONE] Seed complete - database is ready for demo.\n")
    print("Demo credentials:")
    print("  username: admin     password: AdminPass123!   role: admin")
    print("  username: manager   password: ManagerPass123! role: manager")
    print("  username: member1   password: MemberPass123!  role: member")


def main() -> None:
    db: Session = SessionLocal()
    try:
        seed(db)
    except Exception as exc:
        db.rollback()
        print(f"\n[ERROR] Seed failed: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
