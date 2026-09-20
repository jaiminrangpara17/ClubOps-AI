from datetime import datetime, timedelta, timezone
import pytest
from app.main import app
from app.models.attendance import Attendance
from app.models.club import Club
from app.models.event import Event
from app.models.member import Member
from app.services.ai.client import MockAIClient, get_ai_client


@pytest.fixture(autouse=True)
def override_mock_ai():
    """Automatically use MockAIClient for meeting intelligence tests."""
    mock = MockAIClient()
    app.dependency_overrides[get_ai_client] = lambda: mock
    yield mock
    app.dependency_overrides.pop(get_ai_client, None)


# --- 1. Meeting Intelligence Tests ---

def test_meeting_analyze_unauthenticated_returns_401(client):
    """Unauthenticated calls to meeting intelligence are blocked."""
    response = client.post(
        "/ai/meetings/analyze",
        json={"transcript": "Discussed Q4 plans and budget."},
    )
    assert response.status_code == 401


def test_meeting_analyze_member_forbidden_returns_403(client, member_headers):
    """Regular members are forbidden from calling meeting intelligence."""
    response = client.post(
        "/ai/meetings/analyze",
        headers=member_headers,
        json={"transcript": "Meeting notes..."},
    )
    assert response.status_code == 403


def test_meeting_analyze_manager_success(client, manager_headers):
    """Managers can analyze transcripts and receive structured action items."""
    transcript = (
        "President Sarah opened the meeting at 10 AM. "
        "We agreed to hold the annual workshop next Saturday. "
        "Alex Rivera will manage the room booking by Oct 1. "
        "Maya Patel will coordinate food by Oct 3."
    )
    response = client.post(
        "/ai/meetings/analyze",
        headers=manager_headers,
        json={"transcript": transcript},
    )
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert isinstance(data["decisions"], list)
    assert isinstance(data["action_items"], list)
    assert len(data["action_items"]) > 0
    first_action = data["action_items"][0]
    assert "title" in first_action
    assert "description" in first_action
    assert "owner" in first_action
    assert "due_date" in first_action
    assert "priority" in first_action
    assert "source" in first_action


def test_meeting_analyze_empty_transcript_returns_400(client, manager_headers):
    """Empty transcript is rejected with 400."""
    response = client.post(
        "/ai/meetings/analyze",
        headers=manager_headers,
        json={"transcript": "   "},
    )
    assert response.status_code == 400


# --- 2. Event Planner Tests ---

def test_event_planner_member_forbidden_returns_403(client, member_headers):
    """Members cannot access event planner."""
    response = client.post(
        "/ai/planner",
        headers=member_headers,
        json={"prompt": "Plan a technology hackathon."},
    )
    assert response.status_code == 403


def test_event_planner_manager_success(client, manager_headers):
    """Managers can generate structured event plans."""
    response = client.post(
        "/ai/planner",
        headers=manager_headers,
        json={"prompt": "Plan a technology workshop for 50 members next Saturday."},
    )
    assert response.status_code == 200
    data = response.json()
    assert "title" in data
    assert "description" in data
    assert isinstance(data["suggested_schedule"], list)
    assert len(data["suggested_schedule"]) > 0
    assert "audience" in data
    assert isinstance(data["tasks"], list)
    assert isinstance(data["resources"], list)
    assert isinstance(data["risks"], list)
    assert isinstance(data["follow_up_actions"], list)


def test_event_planner_alias_endpoint(client, manager_headers):
    """The /ai/events/plan alias endpoint returns the same structured plan."""
    response = client.post(
        "/ai/events/plan",
        headers=manager_headers,
        json={"prompt": "Plan an orientation session for new club members."},
    )
    assert response.status_code == 200
    assert "title" in response.json()


def test_event_planner_empty_prompt_returns_400(client, manager_headers):
    """Empty or whitespace-only event planner prompt is rejected."""
    response = client.post(
        "/ai/planner",
        headers=manager_headers,
        json={"prompt": "   "},
    )
    assert response.status_code in (400, 422)


# --- 3. Action Validation Tests ---

def test_action_validation_member_forbidden_returns_403(client, member_headers):
    """Members cannot trigger action validation."""
    response = client.post(
        "/ai/actions/validate",
        headers=member_headers,
        json={
            "action_type": "create_event",
            "parameters": {"title": "Test"},
        },
    )
    assert response.status_code == 403


def test_action_validation_deterministic_past_date_fails(client, manager_headers, db_session):
    """Deterministic validation catches events scheduled in the past."""
    club = Club(name="Art Society", description="Visual arts club")
    db_session.add(club)
    db_session.commit()
    db_session.refresh(club)

    past_date = "2020-01-01T10:00:00Z"
    response = client.post(
        "/ai/actions/validate",
        headers=manager_headers,
        json={
            "action_type": "create_event",
            "club_id": club.id,
            "parameters": {
                "title": "Old Gallery",
                "club_id": club.id,
                "starts_at": past_date,
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert "past" in data["reason"].lower()
    assert data["suggested_correction"] is not None


def test_action_validation_deterministic_missing_club_fails(client, manager_headers):
    """Deterministic validation catches actions for non-existent clubs."""
    response = client.post(
        "/ai/actions/validate",
        headers=manager_headers,
        json={
            "action_type": "create_event",
            "club_id": 99999,
            "parameters": {
                "title": "Ghost Event",
                "club_id": 99999,
                "starts_at": "2026-11-01T10:00:00Z",
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert "does not exist" in data["reason"].lower()


def test_action_validation_success_valid_action(client, manager_headers, db_session):
    """Valid actions pass validation with confirmation."""
    club = Club(name="Music Society", description="Instruments and orchestra")
    db_session.add(club)
    db_session.commit()
    db_session.refresh(club)

    future_date = "2026-12-15T18:00:00Z"
    response = client.post(
        "/ai/actions/validate",
        headers=manager_headers,
        json={
            "action_type": "create_event",
            "club_id": club.id,
            "parameters": {
                "title": "Winter Concert",
                "club_id": club.id,
                "starts_at": future_date,
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert "reason" in data


# --- 4. Operational Insights Tests ---

def test_ai_insights_member_forbidden_returns_403(client, member_headers):
    """Members cannot access operational insights."""
    response = client.get("/ai/insights", headers=member_headers)
    assert response.status_code == 403


def test_ai_insights_manager_success(client, manager_headers, db_session):
    """Managers can retrieve AI operational insights grounded in database metrics."""
    club = Club(name="BioTech Club", description="Biology and Technology")
    db_session.add(club)
    db_session.commit()
    db_session.refresh(club)

    m1 = Member(name="Daniel Day", email="daniel@biotech.org", club_id=club.id)
    m2 = Member(name="Emma Watson", email="emma@biotech.org", club_id=club.id)
    db_session.add_all([m1, m2])

    future_time = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=5)
    ev = Event(
        title="CRISPR Lecture",
        description="Gene editing presentation",
        starts_at=future_time,
        club_id=club.id,
    )
    db_session.add(ev)
    db_session.commit()

    response = client.get(
        f"/ai/insights?club_id={club.id}",
        headers=manager_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["club_id"] == club.id
    assert isinstance(data["metrics"], list)
    metric_names = [m["metric_name"] for m in data["metrics"]]
    assert "Total Members" in metric_names
    assert "Total Events" in metric_names
    assert "Upcoming Events" in metric_names
    assert "Attendance Rate" in metric_names
    assert isinstance(data["insights"], list)
    assert isinstance(data["recommendations"], list)
