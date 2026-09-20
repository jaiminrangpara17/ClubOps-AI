"""API Integration tests for ClubOps AI endpoints (Sprint 9).

Verifies all exposed FastAPI HTTP routes, validation rules, and error handling.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

from app.core.exceptions import ActionValidationError
from app.main import app
from app.schemas.action_engine import ActionProposalList
from app.schemas.actions import CreateTaskAction, CreateTaskParameters
from app.schemas.common import Priority
from app.schemas.communication import AnnouncementResult, DailyBriefing
from app.schemas.knowledge import KnowledgeAnswer, KnowledgeSource
from app.schemas.meeting import MeetingActionItem, MeetingResult
from app.schemas.risk_intelligence import RiskAnalysisResult, RiskItem
from fastapi.testclient import TestClient


def test_meeting_analyze_endpoint_valid(configured_env: str) -> None:
    mock_result = MeetingResult(
        summary="Sprint planning meeting completed.",
        decisions=["Ship on Friday"],
        action_items=[
            MeetingActionItem(
                title="Write unit tests",
                description="Cover all routes",
                owner_name="Alice",
                priority=Priority.HIGH,
            )
        ],
        risks=[],
    )

    with (
        patch(
            "app.services.meeting_intelligence.MeetingIntelligenceService.process_transcript",
            new_callable=AsyncMock,
            return_value=mock_result,
        ),
        TestClient(app) as client,
    ):
        response = client.post(
            "/meetings/analyze",
            json={
                "transcript": "Alice: We will ship on Friday. I will write unit tests.",
                "participants": ["Alice"],
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert data["summary"] == "Sprint planning meeting completed."
    assert len(data["action_items"]) == 1
    assert data["action_items"][0]["title"] == "Write unit tests"


def test_meeting_analyze_endpoint_invalid_payload() -> None:
    with TestClient(app) as client:
        response = client.post("/meetings/analyze", json={})
    assert response.status_code == 422


def test_risks_analyze_endpoint_valid(configured_env: str) -> None:
    mock_result = RiskAnalysisResult(
        risks=[
            RiskItem(
                title="Budget Overrun",
                description="Costs exceed current budget",
                severity="high",
                evidence=["Costs are at 110% of budget"],
            )
        ]
    )

    with (
        patch(
            "app.services.risk_intelligence.RiskIntelligenceService.analyze_risks",
            new_callable=AsyncMock,
            return_value=mock_result,
        ),
        TestClient(app) as client,
    ):
        response = client.post(
            "/risks/analyze",
            json={
                "operational_context": "Costs are at 110% of budget.",
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert len(data["risks"]) == 1
    assert data["risks"][0]["title"] == "Budget Overrun"
    assert data["risks"][0]["severity"] == "high"


def test_risks_analyze_endpoint_invalid_payload() -> None:
    with TestClient(app) as client:
        response = client.post("/risks/analyze", json={"unknown_field": "invalid"})
    assert response.status_code == 422


def test_actions_propose_endpoint_valid(configured_env: str) -> None:
    mock_result = ActionProposalList(
        actions=[
            CreateTaskAction(
                action="create_task",
                parameters=CreateTaskParameters(title="Setup server"),
                requires_confirmation=True,
            )
        ]
    )

    with (
        patch(
            "app.services.action_engine.ActionEngineService.propose_actions",
            new_callable=AsyncMock,
            return_value=mock_result,
        ),
        TestClient(app) as client,
    ):
        response = client.post(
            "/actions/propose",
            json={
                "user_intent": "Please create a task to setup the server.",
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert len(data["actions"]) == 1
    assert data["actions"][0]["action"] == "create_task"
    assert data["actions"][0]["requires_confirmation"] is True


def test_actions_propose_endpoint_invalid_payload() -> None:
    with TestClient(app) as client:
        response = client.post("/actions/propose", json={})
    assert response.status_code == 422


def test_knowledge_query_endpoint_valid() -> None:
    mock_result = KnowledgeAnswer(
        answer="The club room is located in Hall B.",
        sources=[
            KnowledgeSource(
                document_id="doc-1",
                title="Club Guide",
                chunk_id="chunk-1",
                text="The club room is in Hall B.",
            )
        ],
        grounded=True,
    )

    with (
        patch(
            "app.services.knowledge_assistant.KnowledgeAssistantService.answer",
            new_callable=AsyncMock,
            return_value=mock_result,
        ),
        TestClient(app) as client,
    ):
        response = client.post(
            "/knowledge/query",
            json={
                "query": "Where is the club room?",
                "top_k": 3,
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert data["grounded"] is True
    assert data["sources"][0]["document_id"] == "doc-1"


def test_knowledge_query_endpoint_invalid_payload() -> None:
    with TestClient(app) as client:
        response = client.post("/knowledge/query", json={})
    assert response.status_code == 422


def test_announcements_generate_endpoint_valid() -> None:
    mock_result = AnnouncementResult(
        title="Annual Robotics Hackathon Announcement",
        body="Join us for the Annual Robotics Hackathon on October 15th at Main Auditorium!",
        audience="All Members",
        grounded=True,
        used_facts=["October 15th", "Main Auditorium"],
    )

    with (
        patch(
            "app.services.announcement_generator.AnnouncementGeneratorService.generate",
            new_callable=AsyncMock,
            return_value=mock_result,
        ),
        TestClient(app) as client,
    ):
        response = client.post(
            "/announcements/generate",
            json={
                "purpose": "Annual Robotics Hackathon",
                "key_details": ["October 15th", "Main Auditorium"],
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Annual Robotics Hackathon Announcement"
    assert data["grounded"] is True


def test_announcements_generate_endpoint_invalid_payload() -> None:
    with TestClient(app) as client:
        response = client.post("/announcements/generate", json={})
    assert response.status_code == 422


def test_briefings_generate_endpoint_valid() -> None:
    mock_result = DailyBriefing(
        date="2026-10-10",
        summary="All operations normal.",
        items=[],
        grounded=True,
    )

    with (
        patch(
            "app.services.daily_briefing.DailyBriefingService.generate",
            new_callable=AsyncMock,
            return_value=mock_result,
        ),
        TestClient(app) as client,
    ):
        response = client.post(
            "/briefings/generate",
            json={
                "date": "2026-10-10",
                "operational_context": "All operations normal.",
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == "2026-10-10"
    assert data["summary"] == "All operations normal."


def test_briefings_generate_endpoint_invalid_payload() -> None:
    with TestClient(app) as client:
        response = client.post("/briefings/generate", json={})
    assert response.status_code == 422


def test_ai_service_error_handler(configured_env: str) -> None:
    with (
        patch(
            "app.services.action_engine.ActionEngineService.propose_actions",
            new_callable=AsyncMock,
            side_effect=ActionValidationError("Test action error"),
        ),
        TestClient(app) as client,
    ):
        response = client.post(
            "/actions/propose",
            json={"user_intent": "Do something dangerous."},
        )
    assert response.status_code == 422
    assert response.json()["error"] == "ActionValidationError"
    assert response.json()["message"] == "Test action error"
