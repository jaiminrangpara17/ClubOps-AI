"""Meeting Intelligence tests - LLM mocked, no network, no DB/backend."""

from __future__ import annotations

import json

import pytest
from app.core.exceptions import MalformedAIOutputError, SchemaValidationError
from app.schemas.meeting_intelligence import MeetingIntelligenceRequest
from app.services.meeting_intelligence import MeetingIntelligenceService


class FakeLLM:
    def __init__(self, text: str | None = None, exc: Exception | None = None) -> None:
        self.text = text
        self.exc = exc

    class _Resp:
        def __init__(self, text: str) -> None:
            self.text = text

    async def generate_response(self, **kwargs) -> _Resp:
        if self.exc is not None:
            raise self.exc
        return self._Resp(self.text)


def make_request(transcript: str = "We discussed the roadmap.") -> MeetingIntelligenceRequest:
    return MeetingIntelligenceRequest(transcript=transcript)


BASE_VALID = {
    "summary": "Reviewed Q3 roadmap and assigned next steps.",
    "decisions": ["Adopt new design system", "Postpone launch to October"],
    "action_items": [
        {
            "title": "Update Figma tokens",
            "description": "Apply new color palette",
            "owner_name": "Alice",
            "deadline": "2026-10-01",
            "priority": "HIGH",
            "dependencies": [],
        }
    ],
    "risks": [
        {
            "title": "API vendor delay",
            "description": "Backend integration may slip",
            "severity": "HIGH",
            "reason": "Vendor confirmed 2-week delay",
            "affected_tasks": ["Update Figma tokens"],
            "recommended_action": "Escalate to vendor account manager",
        }
    ],
}


def service_for(payload) -> tuple[MeetingIntelligenceService, FakeLLM]:
    fake = FakeLLM(text=payload if isinstance(payload, str) else json.dumps(payload))
    return MeetingIntelligenceService(llm_service=fake), fake


@pytest.mark.asyncio
async def test_valid_transcript_processing():
    svc, _ = service_for(BASE_VALID)
    result = await svc.process_transcript(make_request())
    assert result.summary == BASE_VALID["summary"]
    assert len(result.action_items) == 1
    assert len(result.risks) == 1


@pytest.mark.asyncio
async def test_summary_extraction():
    payload = {**BASE_VALID, "summary": "Focused on budget approval."}
    svc, _ = service_for(payload)
    result = await svc.process_transcript(make_request())
    assert result.summary == "Focused on budget approval."


@pytest.mark.asyncio
async def test_decision_extraction():
    payload = {**BASE_VALID, "decisions": ["Approve budget", "Hire contractor"]}
    svc, _ = service_for(payload)
    result = await svc.process_transcript(make_request())
    assert result.decisions == ["Approve budget", "Hire contractor"]


@pytest.mark.asyncio
async def test_explicit_action_item_extraction():
    svc, _ = service_for(BASE_VALID)
    result = await svc.process_transcript(make_request())
    assert result.action_items[0].title == "Update Figma tokens"


@pytest.mark.asyncio
async def test_explicit_owner_extraction():
    svc, _ = service_for(BASE_VALID)
    result = await svc.process_transcript(make_request())
    assert result.action_items[0].owner_name == "Alice"


@pytest.mark.asyncio
async def test_missing_owner_becomes_null():
    payload = json.loads(json.dumps(BASE_VALID))
    payload["action_items"][0]["owner_name"] = None
    svc, _ = service_for(payload)
    result = await svc.process_transcript(make_request())
    assert result.action_items[0].owner_name is None


@pytest.mark.asyncio
async def test_explicit_deadline_extraction():
    svc, _ = service_for(BASE_VALID)
    result = await svc.process_transcript(make_request())
    assert str(result.action_items[0].deadline) == "2026-10-01"


@pytest.mark.asyncio
async def test_missing_deadline_becomes_null():
    payload = json.loads(json.dumps(BASE_VALID))
    payload["action_items"][0]["deadline"] = None
    svc, _ = service_for(payload)
    result = await svc.process_transcript(make_request())
    assert result.action_items[0].deadline is None


@pytest.mark.asyncio
async def test_priority_extraction():
    svc, _ = service_for(BASE_VALID)
    result = await svc.process_transcript(make_request())
    assert result.action_items[0].priority.value == "HIGH"


@pytest.mark.asyncio
async def test_dependency_extraction():
    payload = json.loads(json.dumps(BASE_VALID))
    payload["action_items"][0]["dependencies"] = ["Design review", "Asset export"]
    svc, _ = service_for(payload)
    result = await svc.process_transcript(make_request())
    assert result.action_items[0].dependencies == ["Design review", "Asset export"]


@pytest.mark.asyncio
async def test_evidence_based_risk_extraction():
    svc, _ = service_for(BASE_VALID)
    result = await svc.process_transcript(make_request())
    risk = result.risks[0]
    assert risk.title == "API vendor delay"
    assert risk.reason == "Vendor confirmed 2-week delay"


@pytest.mark.asyncio
async def test_no_unsupported_risk():
    payload = json.loads(json.dumps(BASE_VALID))
    payload["risks"] = []
    svc, _ = service_for(payload)
    result = await svc.process_transcript(make_request())
    assert result.risks == []


@pytest.mark.asyncio
async def test_suggestions_not_converted_to_actions():
    payload = json.loads(json.dumps(BASE_VALID))
    payload["action_items"] = []
    svc, _ = service_for(payload)
    result = await svc.process_transcript(make_request())
    assert result.action_items == []


@pytest.mark.asyncio
async def test_malformed_llm_json():
    svc, _ = service_for("{invalid json structure")
    with pytest.raises(MalformedAIOutputError):
        await svc.process_transcript(make_request())


@pytest.mark.asyncio
async def test_invalid_llm_schema():
    payload = json.loads(json.dumps(BASE_VALID))
    payload["action_items"][0]["priority"] = "URGENT"
    svc, _ = service_for(payload)
    with pytest.raises(SchemaValidationError):
        await svc.process_transcript(make_request())


@pytest.mark.asyncio
async def test_multiple_action_items():
    payload = json.loads(json.dumps(BASE_VALID))
    payload["action_items"].append(
        {
            "title": "Draft press release",
            "description": None,
            "owner_name": "Bob",
            "deadline": None,
            "priority": "MEDIUM",
            "dependencies": ["Update Figma tokens"],
        }
    )
    svc, _ = service_for(payload)
    result = await svc.process_transcript(make_request())
    assert len(result.action_items) == 2
    assert result.action_items[1].title == "Draft press release"
