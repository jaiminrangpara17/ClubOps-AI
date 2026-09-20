"""
Tests for GET /analytics/overview and GET /analytics/clubs/{club_id}.

Fixtures from conftest.py:
  client, db_session, admin_headers, manager_headers, member_headers
"""
from __future__ import annotations

import pytest

from app.models.attendance import Attendance
from app.models.club import Club
from app.models.event import Event
from app.models.member import Member

from datetime import datetime


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_club(db, name: str, description: str | None = None) -> Club:
    club = Club(name=name, description=description)
    db.add(club)
    db.commit()
    db.refresh(club)
    return club


def _make_member(db, club_id: int, name: str, email: str) -> Member:
    m = Member(name=name, email=email, club_id=club_id)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def _make_event(db, club_id: int, title: str) -> Event:
    e = Event(
        title=title,
        club_id=club_id,
        starts_at=datetime(2025, 1, 1, 10, 0),
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


def _mark_attendance(db, member_id: int, event_id: int, present: bool) -> Attendance:
    a = Attendance(member_id=member_id, event_id=event_id, present=present)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


# ---------------------------------------------------------------------------
# /analytics/overview — auth guards
# ---------------------------------------------------------------------------


def test_overview_requires_auth(client):
    r = client.get("/analytics/overview")
    assert r.status_code == 401


def test_overview_member_forbidden(client, member_headers):
    r = client.get("/analytics/overview", headers=member_headers)
    assert r.status_code == 403


def test_overview_manager_allowed(client, manager_headers):
    r = client.get("/analytics/overview", headers=manager_headers)
    assert r.status_code == 200


def test_overview_admin_allowed(client, admin_headers):
    r = client.get("/analytics/overview", headers=admin_headers)
    assert r.status_code == 200


# ---------------------------------------------------------------------------
# /analytics/overview — empty state
# ---------------------------------------------------------------------------


def test_overview_empty(client, admin_headers):
    r = client.get("/analytics/overview", headers=admin_headers)
    data = r.json()
    assert r.status_code == 200
    assert data["total_clubs"] == 0
    assert data["total_members"] == 0
    assert data["total_events"] == 0
    assert data["total_attendance_records"] == 0
    assert data["overall_attendance_rate"] == 0.0
    assert data["clubs"] == []


# ---------------------------------------------------------------------------
# /analytics/overview — with data
# ---------------------------------------------------------------------------


def test_overview_with_data(client, db_session, admin_headers):
    club = _make_club(db_session, "Alpha Club")
    m1 = _make_member(db_session, club.id, "Alice", "alice@test.com")
    m2 = _make_member(db_session, club.id, "Bob", "bob@test.com")
    evt = _make_event(db_session, club.id, "Kickoff")
    _mark_attendance(db_session, m1.id, evt.id, True)
    _mark_attendance(db_session, m2.id, evt.id, False)

    r = client.get("/analytics/overview", headers=admin_headers)
    data = r.json()

    assert data["total_clubs"] == 1
    assert data["total_members"] == 2
    assert data["total_events"] == 1
    assert data["total_attendance_records"] == 2
    assert data["overall_attendance_rate"] == 0.5
    assert len(data["clubs"]) == 1
    club_row = data["clubs"][0]
    assert club_row["club_name"] == "Alpha Club"
    assert club_row["total_members"] == 2
    assert club_row["total_events"] == 1
    assert club_row["average_attendance_rate"] == 0.5


def test_overview_multiple_clubs(client, db_session, admin_headers):
    c1 = _make_club(db_session, "Club One")
    c2 = _make_club(db_session, "Club Two")

    m1 = _make_member(db_session, c1.id, "User1", "u1@test.com")
    e1 = _make_event(db_session, c1.id, "Event1")
    _mark_attendance(db_session, m1.id, e1.id, True)

    m2 = _make_member(db_session, c2.id, "User2", "u2@test.com")
    e2 = _make_event(db_session, c2.id, "Event2")
    _mark_attendance(db_session, m2.id, e2.id, False)

    r = client.get("/analytics/overview", headers=admin_headers)
    data = r.json()

    assert data["total_clubs"] == 2
    assert data["total_members"] == 2
    assert data["total_events"] == 2
    assert data["total_attendance_records"] == 2
    # 1 present out of 2 total = 0.5
    assert data["overall_attendance_rate"] == 0.5


# ---------------------------------------------------------------------------
# /analytics/clubs/{club_id} — auth guards
# ---------------------------------------------------------------------------


def test_club_analytics_requires_auth(client, db_session):
    club = _make_club(db_session, "SecretClub")
    r = client.get(f"/analytics/clubs/{club.id}")
    assert r.status_code == 401


def test_club_analytics_member_forbidden(client, db_session, member_headers):
    club = _make_club(db_session, "MemberClub")
    r = client.get(f"/analytics/clubs/{club.id}", headers=member_headers)
    assert r.status_code == 403


def test_club_analytics_not_found(client, admin_headers):
    r = client.get("/analytics/clubs/99999", headers=admin_headers)
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# /analytics/clubs/{club_id} — with data
# ---------------------------------------------------------------------------


def test_club_analytics_no_events(client, db_session, admin_headers):
    club = _make_club(db_session, "Empty Club")
    _make_member(db_session, club.id, "Solo", "solo@test.com")

    r = client.get(f"/analytics/clubs/{club.id}", headers=admin_headers)
    data = r.json()

    assert r.status_code == 200
    assert data["club_id"] == club.id
    assert data["club_name"] == "Empty Club"
    assert data["total_members"] == 1
    assert data["total_events"] == 0
    assert data["average_attendance_rate"] == 0.0
    assert data["events"] == []


def test_club_analytics_with_events(client, db_session, manager_headers):
    club = _make_club(db_session, "Active Club")
    m1 = _make_member(db_session, club.id, "Ana", "ana@test.com")
    m2 = _make_member(db_session, club.id, "Ben", "ben@test.com")

    e1 = _make_event(db_session, club.id, "Workshop")
    e2 = _make_event(db_session, club.id, "Hackathon")

    # e1: both present → rate 1.0
    _mark_attendance(db_session, m1.id, e1.id, True)
    _mark_attendance(db_session, m2.id, e1.id, True)
    # e2: none present → rate 0.0
    _mark_attendance(db_session, m1.id, e2.id, False)
    _mark_attendance(db_session, m2.id, e2.id, False)

    r = client.get(f"/analytics/clubs/{club.id}", headers=manager_headers)
    data = r.json()

    assert r.status_code == 200
    assert data["total_members"] == 2
    assert data["total_events"] == 2
    # 2 present out of 4 total records → 0.5
    assert data["average_attendance_rate"] == 0.5

    event_map = {e["event_title"]: e for e in data["events"]}
    assert event_map["Workshop"]["attendance_rate"] == 1.0
    assert event_map["Workshop"]["present_count"] == 2
    assert event_map["Hackathon"]["attendance_rate"] == 0.0
    assert event_map["Hackathon"]["present_count"] == 0


def test_club_analytics_partial_attendance(client, db_session, admin_headers):
    club = _make_club(db_session, "Partial Club")
    m = _make_member(db_session, club.id, "Partial", "partial@test.com")
    evt = _make_event(db_session, club.id, "Single Event")
    _mark_attendance(db_session, m.id, evt.id, True)

    r = client.get(f"/analytics/clubs/{club.id}", headers=admin_headers)
    data = r.json()
    assert data["average_attendance_rate"] == 1.0
    assert data["events"][0]["present_count"] == 1


# ---------------------------------------------------------------------------
# Security headers
# ---------------------------------------------------------------------------


def test_security_headers_present(client, admin_headers):
    r = client.get("/analytics/overview", headers=admin_headers)
    assert r.headers.get("x-content-type-options") == "nosniff"
    assert r.headers.get("x-frame-options") == "DENY"
    assert r.headers.get("x-xss-protection") == "1; mode=block"
    assert r.headers.get("referrer-policy") == "strict-origin-when-cross-origin"


# ---------------------------------------------------------------------------
# /health/ready
# ---------------------------------------------------------------------------


def test_health_ready(client):
    r = client.get("/health/ready")
    # In the test environment, the DB is reachable
    assert r.status_code in (200, 503)
    data = r.json()
    assert "status" in data
    assert "checks" in data
    assert "database" in data["checks"]
