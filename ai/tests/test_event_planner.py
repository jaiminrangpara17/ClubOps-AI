import json
from unittest.mock import AsyncMock

import pytest
from app.core.exceptions import MalformedAIOutputError, SchemaValidationError
from app.core.llm import LLMResponse, LLMService
from app.schemas.common import EventType, Priority, RiskSeverity
from app.schemas.event import Event
from app.services.event_planner import EventPlannerService


@pytest.mark.asyncio
async def test_generate_plan_success() -> None:
    mock_llm = AsyncMock(spec=LLMService)
    event_payload = {
        "event_name": "Annual Hackathon 2026",
        "description": "48-hour student hackathon",
        "event_type": "COMPETITION",
        "start_date": "2026-11-10",
        "end_date": "2026-11-12",
        "expected_participants": 200,
        "teams": ["Tech", "Logistics", "Marketing"],
        "tasks": [
            {
                "title": "Book venue hall",
                "priority": "HIGH",
                "status": "TODO",
            }
        ],
        "milestones": [
            {
                "title": "Registration opens",
                "due_date": "2026-10-01",
            }
        ],
        "risks": [
            {
                "title": "Wi-Fi outage",
                "severity": "HIGH",
                "reason": "Campus network maintenance planned",
                "is_ai_prediction": True,
            }
        ],
    }
    mock_llm.generate_response.return_value = LLMResponse(
        text=json.dumps(event_payload),
        model="gpt-4o-mini",
        prompt_tokens=150,
        completion_tokens=250,
    )

    service = EventPlannerService(llm_service=mock_llm)
    result = await service.generate_plan(
        prompt="Organize a 48h campus hackathon for 200 students",
        event_type="COMPETITION",
        expected_attendees=200,
    )

    assert isinstance(result, Event)
    assert result.event_name == "Annual Hackathon 2026"
    assert result.event_type == EventType.COMPETITION
    assert len(result.tasks) == 1
    assert result.tasks[0].priority == Priority.HIGH
    assert len(result.milestones) == 1
    assert len(result.risks) == 1
    assert result.risks[0].severity == RiskSeverity.HIGH


@pytest.mark.asyncio
async def test_generate_plan_malformed_json_fails() -> None:
    mock_llm = AsyncMock(spec=LLMService)
    mock_llm.generate_response.return_value = LLMResponse(
        text="Not valid JSON response",
        model="gpt-4o-mini",
    )

    service = EventPlannerService(llm_service=mock_llm)
    with pytest.raises(MalformedAIOutputError):
        await service.generate_plan("Plan a meeting")


@pytest.mark.asyncio
async def test_generate_plan_invalid_schema_fails() -> None:
    mock_llm = AsyncMock(spec=LLMService)
    # end_date before start_date should trigger validation error
    invalid_event = {
        "event_name": "Broken Dates Event",
        "start_date": "2026-11-15",
        "end_date": "2026-11-10",
    }
    mock_llm.generate_response.return_value = LLMResponse(
        text=json.dumps(invalid_event),
        model="gpt-4o-mini",
    )

    service = EventPlannerService(llm_service=mock_llm)
    with pytest.raises(SchemaValidationError):
        await service.generate_plan("Plan an event")
