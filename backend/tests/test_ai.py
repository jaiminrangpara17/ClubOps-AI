import pytest
from fastapi import HTTPException
from app.main import app
from app.schemas.ai import (
    CopilotRequest,
    EventPlanResponse,
)
from app.services.ai.client import (
    AIClient,
    MockAIClient,
    OpenAIClient,
    get_ai_client,
)
from app.services.ai.service import AIService, get_ai_service


def test_openai_client_unconfigured(monkeypatch):
    """When AI_API_KEY is not set, OpenAIClient raises 503."""
    monkeypatch.delenv("AI_API_KEY", raising=False)
    client = OpenAIClient(api_key=None)
    with pytest.raises(HTTPException) as exc_info:
        client.generate_text("System", "User")
    assert exc_info.value.status_code == 503
    assert "unavailable or unconfigured" in exc_info.value.detail


def test_mock_ai_client_text():
    """MockAIClient generates valid contextual responses."""
    client = MockAIClient()
    resp = client.generate_text("System prompt", "Which events are scheduled?")
    assert "events" in resp.lower()


def test_mock_ai_client_structured():
    """MockAIClient generates validated Pydantic model instances."""
    client = MockAIClient()
    resp = client.generate_structured("System prompt", "Plan a workshop", EventPlanResponse)
    assert isinstance(resp, EventPlanResponse)
    assert resp.title
    assert len(resp.tasks) > 0
    assert len(resp.suggested_schedule) > 0


def test_mock_ai_client_simulated_errors():
    """MockAIClient faithfully simulates upstream provider errors."""
    rate_limit_client = MockAIClient(simulate_rate_limit=True)
    with pytest.raises(HTTPException) as exc_info:
        rate_limit_client.generate_text("System", "User")
    assert exc_info.value.status_code == 429

    timeout_client = MockAIClient(simulate_timeout=True)
    with pytest.raises(HTTPException) as exc_info:
        timeout_client.generate_text("System", "User")
    assert exc_info.value.status_code == 504

    malformed_client = MockAIClient(simulate_malformed=True)
    with pytest.raises(HTTPException) as exc_info:
        malformed_client.generate_structured("System", "User", EventPlanResponse)
    assert exc_info.value.status_code == 500


def test_copilot_service_unconfigured_returns_503(client, member_headers):
    """Calling AI endpoints when unconfigured returns 503."""
    def override_unconfigured_client():
        return MockAIClient(simulate_unconfigured=True)

    app.dependency_overrides[get_ai_client] = override_unconfigured_client
    try:
        response = client.post(
            "/ai/copilot",
            headers=member_headers,
            json={"message": "What events are coming up?"},
        )
        assert response.status_code == 503
        assert "unavailable or unconfigured" in response.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_ai_client, None)


def test_copilot_rate_limit_returns_429(client, member_headers):
    """Provider rate limit returns 429 with clear message."""
    def override_rate_limit_client():
        return MockAIClient(simulate_rate_limit=True)

    app.dependency_overrides[get_ai_client] = override_rate_limit_client
    try:
        response = client.post(
            "/ai/copilot",
            headers=member_headers,
            json={"message": "What events are coming up?"},
        )
        assert response.status_code == 429
        assert "rate limit" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_ai_client, None)


def test_copilot_empty_prompt_returns_400(client, member_headers):
    """Empty or whitespace-only messages are rejected with 400."""
    def override_client():
        return MockAIClient()

    app.dependency_overrides[get_ai_client] = override_client
    try:
        response = client.post(
            "/ai/copilot",
            headers=member_headers,
            json={"message": "   "},
        )
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_ai_client, None)


def test_copilot_long_input_handled(client, member_headers):
    """Long user inputs are safely processed without crash."""
    def override_client():
        return MockAIClient()

    app.dependency_overrides[get_ai_client] = override_client
    try:
        long_message = "Tell me about upcoming events. " * 200
        response = client.post(
            "/ai/copilot",
            headers=member_headers,
            json={"message": long_message},
        )
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
    finally:
        app.dependency_overrides.pop(get_ai_client, None)
