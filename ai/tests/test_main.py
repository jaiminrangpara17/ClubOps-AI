"""API entrypoint tests."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, patch

import pytest
from app.core.llm import LLMResponse
from app.main import app
from fastapi.testclient import TestClient


def test_health_endpoint_returns_ok() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "clubops-ai"}


def test_health_endpoint_works_without_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    with TestClient(app) as client:
        assert client.get("/health").json()["status"] == "ok"


def test_validate_action_endpoint_valid() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/actions/validate",
            json={
                "action": "create_task",
                "parameters": {"title": "Test Task"},
                "requires_confirmation": True,
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert data["action"] == "create_task"
    assert data["parameters"]["title"] == "Test Task"


def test_validate_action_endpoint_invalid() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/actions/validate",
            json={
                "action": "drop_database",
                "parameters": {},
            },
        )
    assert response.status_code == 422
    assert response.json()["error"] == "ActionValidationError"


def test_validate_action_batch_endpoint() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/actions/validate-batch",
            json=[
                {
                    "action": "create_task",
                    "parameters": {"title": "Task 1"},
                },
                {
                    "action": "assign_task",
                    "parameters": {"task_id": "t1", "assignee": "Alice"},
                },
            ],
        )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["action"] == "create_task"
    assert data[1]["action"] == "assign_task"


def test_plan_event_endpoint() -> None:
    event_payload = {
        "event_name": "Hack Day",
        "description": "Short sprint",
        "event_type": "COMPETITION",
        "start_date": "2026-12-01",
        "end_date": "2026-12-02",
        "tasks": [{"title": "Setup"}],
    }

    mock_response = LLMResponse(
        text=json.dumps(event_payload),
        model="gpt-4o-mini",
    )

    with patch("app.services.event_planner.get_llm_service") as mock_get_llm:
        mock_instance = AsyncMock()
        mock_instance.generate_response.return_value = mock_response
        mock_get_llm.return_value = mock_instance

        with TestClient(app) as client:
            response = client.post(
                "/events/plan",
                json={
                    "prompt": "Create a hack day event for developers",
                    "event_type": "COMPETITION",
                },
            )

    assert response.status_code == 200
    data = response.json()
    assert data["event_name"] == "Hack Day"
    assert data["event_type"] == "COMPETITION"
    assert len(data["tasks"]) == 1
