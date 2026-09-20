"""Client tests for AIServiceClient, AsyncAIServiceClient, and Execution Contract (Sprint 9).

Verifies client transport, typed error mapping, timeout/connect handling, and action execution.
"""

from __future__ import annotations

from typing import Any

import httpx
import pytest
from app.client import AIServiceClient, AsyncAIServiceClient
from app.core.exceptions import (
    ActionValidationError,
    AIClientConnectionError,
    AIClientError,
    AIClientTimeoutError,
    AIClientValidationError,
)
from app.schemas.action_engine import ActionEngineRequest, ActionProposalList
from app.schemas.actions import CreateTaskAction, CreateTaskParameters
from app.schemas.communication import (
    AnnouncementRequest,
    AnnouncementResult,
    BriefingRequest,
    DailyBriefing,
)
from app.schemas.event import Event, EventPlanRequest
from app.schemas.integration import (
    ActionExecutionRequest,
    ActionExecutionResponse,
    verify_action_execution,
)
from app.schemas.knowledge import KnowledgeAnswer, KnowledgeQueryRequest
from app.schemas.meeting import MeetingResult
from app.schemas.meeting_intelligence import MeetingIntelligenceRequest
from app.schemas.risk_intelligence import (
    RiskAnalysisResult,
    RiskIntelligenceRequest,
)
from pydantic import ValidationError


def _make_mock_transport(handler: Any) -> httpx.MockTransport:
    return httpx.MockTransport(handler)


class TestAIServiceClientSync:
    """Test suite for synchronous AIServiceClient."""

    def test_health(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.path == "/health"
            return httpx.Response(200, json={"status": "ok", "service": "clubops-ai"})

        client = httpx.Client(transport=_make_mock_transport(handler))
        with AIServiceClient(client=client) as ai_client:
            result = ai_client.health()
        assert result == {"status": "ok", "service": "clubops-ai"}

    def test_plan_event(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.path == "/events/plan"
            return httpx.Response(
                200,
                json={
                    "event_name": "Annual Summit",
                    "description": "Tech conference",
                    "tasks": [],
                    "milestones": [],
                    "risks": [],
                },
            )

        client = httpx.Client(transport=_make_mock_transport(handler))
        with AIServiceClient(client=client) as ai_client:
            req = EventPlanRequest(prompt="Annual summit planning")
            event = ai_client.plan_event(req)
        assert isinstance(event, Event)
        assert event.event_name == "Annual Summit"

    def test_analyze_meeting(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.path == "/meetings/analyze"
            return httpx.Response(
                200,
                json={
                    "summary": "Discussed marketing plan",
                    "decisions": ["Post on social media"],
                    "action_items": [],
                    "risks": [],
                },
            )

        client = httpx.Client(transport=_make_mock_transport(handler))
        with AIServiceClient(client=client) as ai_client:
            req = MeetingIntelligenceRequest(transcript="Alice: Post on social media.")
            result = ai_client.analyze_meeting(req)
        assert isinstance(result, MeetingResult)
        assert result.summary == "Discussed marketing plan"

    def test_analyze_risks(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.path == "/risks/analyze"
            return httpx.Response(
                200,
                json={
                    "risks": [
                        {
                            "title": "Low turnout",
                            "description": "Risk description",
                            "severity": "medium",
                            "evidence": ["Signups low"],
                        }
                    ],
                },
            )

        client = httpx.Client(transport=_make_mock_transport(handler))
        with AIServiceClient(client=client) as ai_client:
            req = RiskIntelligenceRequest(operational_context="Signups low")
            result = ai_client.analyze_risks(req)
        assert isinstance(result, RiskAnalysisResult)
        assert len(result.risks) == 1
        assert result.risks[0].title == "Low turnout"

    def test_propose_actions(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.path == "/actions/propose"
            return httpx.Response(
                200,
                json={
                    "actions": [
                        {
                            "action": "create_task",
                            "parameters": {"title": "Book Venue"},
                            "requires_confirmation": True,
                        }
                    ],
                },
            )

        client = httpx.Client(transport=_make_mock_transport(handler))
        with AIServiceClient(client=client) as ai_client:
            req = ActionEngineRequest(user_intent="Book venue for summit")
            result = ai_client.propose_actions(req)
        assert isinstance(result, ActionProposalList)
        assert len(result.actions) == 1
        assert result.actions[0].action == "create_task"

    def test_query_knowledge(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.path == "/knowledge/query"
            return httpx.Response(
                200,
                json={
                    "answer": "Club was founded in 2020.",
                    "grounded": True,
                    "sources": [
                        {
                            "document_id": "doc-1",
                            "title": "Club History",
                            "chunk_id": "c-1",
                            "text": "Founded in 2020.",
                        }
                    ],
                },
            )

        client = httpx.Client(transport=_make_mock_transport(handler))
        with AIServiceClient(client=client) as ai_client:
            req = KnowledgeQueryRequest(query="When was club founded?")
            result = ai_client.query_knowledge(req)
        assert isinstance(result, KnowledgeAnswer)
        assert result.grounded is True
        assert result.sources[0].document_id == "doc-1"

    def test_generate_announcement(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.path == "/announcements/generate"
            return httpx.Response(
                200,
                json={
                    "title": "Summit Announcement",
                    "body": "Join us on Friday for the summit!",
                    "audience": "All",
                    "grounded": True,
                    "used_facts": ["Friday summit"],
                },
            )

        client = httpx.Client(transport=_make_mock_transport(handler))
        with AIServiceClient(client=client) as ai_client:
            req = AnnouncementRequest(
                purpose="Announce Summit",
                key_details=["Friday summit"],
            )
            result = ai_client.generate_announcement(req)
        assert isinstance(result, AnnouncementResult)
        assert result.title == "Summit Announcement"
        assert result.grounded is True

    def test_generate_daily_briefing(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.path == "/briefings/generate"
            return httpx.Response(
                200,
                json={
                    "date": "2026-10-10",
                    "summary": "All systems operating normally.",
                    "items": [],
                    "grounded": True,
                },
            )

        client = httpx.Client(transport=_make_mock_transport(handler))
        with AIServiceClient(client=client) as ai_client:
            req = BriefingRequest(date="2026-10-10", operational_context="Operating normally")
            result = ai_client.generate_daily_briefing(req)
        assert isinstance(result, DailyBriefing)
        assert result.date == "2026-10-10"

    def test_validate_action(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.path == "/actions/validate"
            return httpx.Response(
                200,
                json={
                    "action": "create_task",
                    "parameters": {"title": "Task 1"},
                    "requires_confirmation": True,
                },
            )

        client = httpx.Client(transport=_make_mock_transport(handler))
        with AIServiceClient(client=client) as ai_client:
            result = ai_client.validate_action(
                {"action": "create_task", "parameters": {"title": "Task 1"}}
            )
        assert result["action"] == "create_task"

    def test_validate_action_batch(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.path == "/actions/validate-batch"
            return httpx.Response(
                200,
                json=[
                    {
                        "action": "create_task",
                        "parameters": {"title": "Task 1"},
                        "requires_confirmation": True,
                    }
                ],
            )

        client = httpx.Client(transport=_make_mock_transport(handler))
        with AIServiceClient(client=client) as ai_client:
            result = ai_client.validate_action_batch(
                [{"action": "create_task", "parameters": {"title": "Task 1"}}]
            )
        assert len(result) == 1
        assert result[0]["action"] == "create_task"


class TestAIServiceClientAsync:
    """Test suite for asynchronous AsyncAIServiceClient."""

    @pytest.mark.asyncio
    async def test_async_health(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json={"status": "ok", "service": "clubops-ai"})

        client = httpx.AsyncClient(transport=_make_mock_transport(handler))
        async with AsyncAIServiceClient(client=client) as ai_client:
            result = await ai_client.health()
        assert result["status"] == "ok"

    @pytest.mark.asyncio
    async def test_async_plan_event(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "event_name": "Async Hackathon",
                    "description": "Async plan",
                    "tasks": [],
                    "milestones": [],
                    "risks": [],
                },
            )

        client = httpx.AsyncClient(transport=_make_mock_transport(handler))
        async with AsyncAIServiceClient(client=client) as ai_client:
            result = await ai_client.plan_event({"prompt": "Async Hackathon"})
        assert result.event_name == "Async Hackathon"

    @pytest.mark.asyncio
    async def test_async_analyze_meeting(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "summary": "Async meeting summary",
                    "decisions": [],
                    "action_items": [],
                    "risks": [],
                },
            )

        client = httpx.AsyncClient(transport=_make_mock_transport(handler))
        async with AsyncAIServiceClient(client=client) as ai_client:
            result = await ai_client.analyze_meeting({"transcript": "Meeting notes"})
        assert result.summary == "Async meeting summary"

    @pytest.mark.asyncio
    async def test_async_analyze_risks(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "risks": [],
                },
            )

        client = httpx.AsyncClient(transport=_make_mock_transport(handler))
        async with AsyncAIServiceClient(client=client) as ai_client:
            result = await ai_client.analyze_risks({"operational_context": "No issues"})
        assert len(result.risks) == 0

    @pytest.mark.asyncio
    async def test_async_propose_actions(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "actions": [],
                },
            )

        client = httpx.AsyncClient(transport=_make_mock_transport(handler))
        async with AsyncAIServiceClient(client=client) as ai_client:
            result = await ai_client.propose_actions({"user_intent": "Hello"})
        assert len(result.actions) == 0

    @pytest.mark.asyncio
    async def test_async_query_knowledge(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "answer": "Async answer",
                    "grounded": True,
                    "sources": [],
                },
            )

        client = httpx.AsyncClient(transport=_make_mock_transport(handler))
        async with AsyncAIServiceClient(client=client) as ai_client:
            result = await ai_client.query_knowledge({"query": "Question"})
        assert result.answer == "Async answer"

    @pytest.mark.asyncio
    async def test_async_generate_announcement(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "title": "Title",
                    "body": "Body content",
                    "audience": "All",
                    "grounded": True,
                    "used_facts": [],
                },
            )

        client = httpx.AsyncClient(transport=_make_mock_transport(handler))
        async with AsyncAIServiceClient(client=client) as ai_client:
            result = await ai_client.generate_announcement(
                {"purpose": "Event", "key_details": ["Fact 1"]}
            )
        assert result.title == "Title"

    @pytest.mark.asyncio
    async def test_async_generate_daily_briefing(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "date": "2026-10-10",
                    "summary": "Summary",
                    "items": [],
                    "grounded": True,
                },
            )

        client = httpx.AsyncClient(transport=_make_mock_transport(handler))
        async with AsyncAIServiceClient(client=client) as ai_client:
            result = await ai_client.generate_daily_briefing(
                {"date": "2026-10-10", "operational_context": "Context"}
            )
        assert result.summary == "Summary"

    @pytest.mark.asyncio
    async def test_async_validate_action(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json={"action": "create_task"})

        client = httpx.AsyncClient(transport=_make_mock_transport(handler))
        async with AsyncAIServiceClient(client=client) as ai_client:
            result = await ai_client.validate_action({"action": "create_task"})
        assert result["action"] == "create_task"

    @pytest.mark.asyncio
    async def test_async_validate_action_batch(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=[{"action": "create_task"}])

        client = httpx.AsyncClient(transport=_make_mock_transport(handler))
        async with AsyncAIServiceClient(client=client) as ai_client:
            result = await ai_client.validate_action_batch([{"action": "create_task"}])
        assert len(result) == 1


class TestClientErrorHandling:
    """Test suite for error translation in AIServiceClient."""

    def test_timeout_translates_to_ai_client_timeout_error(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            raise httpx.ReadTimeout("Socket timed out")

        client = httpx.Client(transport=_make_mock_transport(handler))
        ai_client = AIServiceClient(client=client)

        with pytest.raises(AIClientTimeoutError) as exc_info:
            ai_client.health()
        assert exc_info.value.status_code == 504

    def test_connection_error_translates_to_ai_client_connection_error(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            raise httpx.ConnectError("Connection refused")

        client = httpx.Client(transport=_make_mock_transport(handler))
        ai_client = AIServiceClient(client=client)

        with pytest.raises(AIClientConnectionError) as exc_info:
            ai_client.health()
        assert exc_info.value.status_code == 503

    def test_validation_error_422_translates_to_ai_client_validation_error(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(422, json={"detail": "Field required"})

        client = httpx.Client(transport=_make_mock_transport(handler))
        ai_client = AIServiceClient(client=client)

        with pytest.raises(AIClientValidationError) as exc_info:
            ai_client.plan_event({"prompt": "Short"})
        assert exc_info.value.status_code == 422

    def test_server_error_translates_to_ai_client_error(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(500, text="Internal service crash")

        client = httpx.Client(transport=_make_mock_transport(handler))
        ai_client = AIServiceClient(client=client)

        with pytest.raises(AIClientError) as exc_info:
            ai_client.health()
        assert exc_info.value.status_code == 502

    def test_malformed_response_json_translates_to_ai_client_validation_error(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            # Missing required fields for Event
            return httpx.Response(200, json={"wrong_key": "val"})

        client = httpx.Client(transport=_make_mock_transport(handler))
        ai_client = AIServiceClient(client=client)

        with pytest.raises(AIClientValidationError):
            ai_client.plan_event({"prompt": "Valid prompt here"})


class TestActionExecutionContract:
    """Test suite for ActionExecutionRequest and verify_action_execution."""

    def test_unconfirmed_action_rejected(self) -> None:
        action = CreateTaskAction(
            action="create_task",
            parameters=CreateTaskParameters(title="Unconfirmed Task"),
            requires_confirmation=True,
        )
        req = ActionExecutionRequest(action=action, confirmed=False, user_id="user-123")
        with pytest.raises(ActionValidationError, match="explicit human confirmation"):
            verify_action_execution(req)

    def test_unauthenticated_action_rejected(self) -> None:
        action = CreateTaskAction(
            action="create_task",
            parameters=CreateTaskParameters(title="No User Task"),
            requires_confirmation=True,
        )
        req = ActionExecutionRequest(action=action, confirmed=True, user_id=None)
        with pytest.raises(ActionValidationError, match="authenticated user context"):
            verify_action_execution(req)

    def test_empty_user_id_rejected(self) -> None:
        action = CreateTaskAction(
            action="create_task",
            parameters=CreateTaskParameters(title="Empty User Task"),
            requires_confirmation=True,
        )
        req = ActionExecutionRequest(action=action, confirmed=True, user_id="   ")
        with pytest.raises(ActionValidationError, match="authenticated user context"):
            verify_action_execution(req)

    def test_confirmed_and_authenticated_action_accepted(self) -> None:
        action = CreateTaskAction(
            action="create_task",
            parameters=CreateTaskParameters(title="Authorized Task"),
            requires_confirmation=True,
        )
        req = ActionExecutionRequest(action=action, confirmed=True, user_id="user-123")
        # Should not raise
        verify_action_execution(req)

    def test_extra_fields_forbidden_on_action_execution_request(self) -> None:
        action = CreateTaskAction(
            action="create_task",
            parameters=CreateTaskParameters(title="Valid Task"),
            requires_confirmation=True,
        )
        with pytest.raises(ValidationError):
            ActionExecutionRequest.model_validate(
                {
                    "action": action.model_dump(),
                    "confirmed": True,
                    "user_id": "user-1",
                    "injected_field": "dangerous",
                }
            )

    def test_action_execution_response_model(self) -> None:
        resp = ActionExecutionResponse(
            status="executed",
            action_type="create_task",
            message="Task created successfully.",
            mutation_details={"task_id": "task-999"},
        )
        assert resp.status == "executed"
        assert resp.action_type == "create_task"
        assert resp.mutation_details == {"task_id": "task-999"}
