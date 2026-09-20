"""Comprehensive test suite for Sprint 6: AI Action Engine."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock

import pytest
from app.core.exceptions import ActionValidationError, MalformedAIOutputError
from app.core.llm import LLMResponse, LLMService
from app.schemas.action_engine import ActionEngineRequest, ActionProposalList
from app.schemas.actions import (
    ActionType,
    AssignTaskAction,
    AssignTaskParameters,
    CreateAnnouncementAction,
    CreateAnnouncementParameters,
    CreateEventAction,
    CreateEventParameters,
    CreateTaskAction,
    CreateTaskParameters,
    TaskStatus,
    UpdateTaskAction,
    UpdateTaskParameters,
    UpdateTaskStatusAction,
    UpdateTaskStatusParameters,
)
from app.services.action_engine import ActionEngineService
from app.validators.action_engine_validator import (
    validate_action,
    validate_action_proposals,
)
from pydantic import ValidationError


class TestActionEngineSchemas:
    def test_valid_action_engine_request(self) -> None:
        """Verify valid ActionEngineRequest with all fields populated."""
        req = ActionEngineRequest(
            user_intent="Create task for hall booking",
            event_context="Annual Gala 2026",
            task_context=[{"task_id": "t-1", "title": "Reserve venue", "assignee": "Alice"}],
            meeting_output={"summary": "Approved budget for venue"},
            risk_output={"title": "Venue deposit cutoff approaching"},
            operational_context="Venue requires 14 days advance notice",
        )
        assert req.user_intent == "Create task for hall booking"
        assert req.event_context == "Annual Gala 2026"
        assert len(req.task_context) == 1
        assert req.task_context[0]["task_id"] == "t-1"

    def test_optional_null_fields(self) -> None:
        """Verify that optional context fields default to None."""
        req = ActionEngineRequest(user_intent="Just a general task")
        assert req.event_context is None
        assert req.task_context is None
        assert req.meeting_output is None
        assert req.risk_output is None
        assert req.operational_context is None

    def test_extra_fields_rejected(self) -> None:
        """Verify that extra unknown fields are strictly rejected on ActionEngineRequest."""
        with pytest.raises(ValidationError):
            ActionEngineRequest.model_validate(
                {"user_intent": "Do something", "injected_field": "exploit"}
            )

    def test_valid_action_proposal_list(self) -> None:
        """Verify ActionProposalList parses valid actions of all 6 supported types."""
        actions = [
            CreateTaskAction(
                action=ActionType.CREATE_TASK,
                parameters=CreateTaskParameters(title="Setup lighting"),
            ),
            UpdateTaskAction(
                action=ActionType.UPDATE_TASK,
                parameters=UpdateTaskParameters(task_id="t-1", title="Setup stage lighting"),
            ),
            AssignTaskAction(
                action=ActionType.ASSIGN_TASK,
                parameters=AssignTaskParameters(task_id="t-1", assignee="Alice"),
            ),
            UpdateTaskStatusAction(
                action=ActionType.UPDATE_TASK_STATUS,
                parameters=UpdateTaskStatusParameters(task_id="t-1", status=TaskStatus.COMPLETED),
            ),
            CreateAnnouncementAction(
                action=ActionType.CREATE_ANNOUNCEMENT,
                parameters=CreateAnnouncementParameters(title="Meeting Today", message="Room 402"),
            ),
            CreateEventAction(
                action=ActionType.CREATE_EVENT,
                parameters=CreateEventParameters(event_name="Orientation 2026"),
            ),
        ]
        proposal_list = ActionProposalList(actions=actions)
        assert len(proposal_list.actions) == 6

    def test_invalid_action_rejected(self) -> None:
        """Verify that unknown/unsupported action types are rejected by ActionProposalList."""
        with pytest.raises(ValidationError):
            ActionProposalList.model_validate(
                {"actions": [{"action": "drop_database", "parameters": {}}]}
            )


class TestActionEngineValidation:
    def test_unsupported_action_rejected(self) -> None:
        """Verify that unsupported action name raises ActionValidationError."""
        with pytest.raises(ActionValidationError, match="Unsupported action"):
            validate_action({"action": "delete_all_tasks", "parameters": {}})

    def test_requires_confirmation_false_is_overridden_to_true(self) -> None:
        """Verify that requires_confirmation=False is strictly overridden to True."""
        raw = {
            "action": "create_task",
            "parameters": {"title": "Check microphone cables"},
            "requires_confirmation": False,
        }
        validated = validate_action(raw)
        assert validated.requires_confirmation is True

    def test_missing_required_parameter_rejected(self) -> None:
        """Verify that missing required parameter causes validation error."""
        # Missing title in create_task
        with pytest.raises(ActionValidationError):
            validate_action({"action": "create_task", "parameters": {}})

        # Missing assignee in assign_task
        with pytest.raises(ActionValidationError):
            validate_action({"action": "assign_task", "parameters": {"task_id": "t-1"}})

    def test_fabricated_task_id_rejected_when_task_context_exists(self) -> None:
        """Verify that non-existent task reference is rejected when task_context is supplied."""
        request = ActionEngineRequest(
            user_intent="Mark task t-999 done",
            task_context=[{"task_id": "t-101", "title": "Setup Stage"}],
        )
        action = {
            "action": "update_task_status",
            "parameters": {"task_id": "t-999", "status": "COMPLETED"},
        }
        with pytest.raises(ActionValidationError, match="Fabricated task reference 't-999'"):
            validate_action(action, request=request)

    def test_valid_task_id_accepted(self) -> None:
        """Verify that valid task reference from task_context is accepted."""
        request = ActionEngineRequest(
            user_intent="Mark task t-101 done",
            task_context=[{"task_id": "t-101", "title": "Setup Stage"}],
        )
        action = {
            "action": "update_task_status",
            "parameters": {"task_id": "t-101", "status": "COMPLETED"},
        }
        validated = validate_action(action, request=request)
        assert validated.parameters.task_id == "t-101"

    def test_fabricated_assignee_rejected_when_people_context_exists(self) -> None:
        """Verify that ungrounded assignee is rejected when people exist in task_context."""
        request = ActionEngineRequest(
            user_intent="Assign task to Mallory",
            task_context=[
                {"task_id": "t-101", "title": "Setup Stage", "assignee": "Alice"},
                {"task_id": "t-102", "title": "Catering", "owner": "Bob"},
            ],
        )
        action = {
            "action": "assign_task",
            "parameters": {"task_id": "t-101", "assignee": "Mallory"},
        }
        with pytest.raises(ActionValidationError, match="Fabricated assignee 'Mallory'"):
            validate_action(action, request=request)

    def test_valid_assignee_accepted(self) -> None:
        """Verify that valid assignee from task_context is accepted."""
        request = ActionEngineRequest(
            user_intent="Assign task to Alice",
            task_context=[
                {"task_id": "t-101", "title": "Setup Stage", "assignee": "Alice"},
            ],
        )
        action = {
            "action": "assign_task",
            "parameters": {"task_id": "t-101", "assignee": "Alice"},
        }
        validated = validate_action(action, request=request)
        assert validated.parameters.assignee == "Alice"

    def test_explicit_user_intent_values_accepted_when_context_is_absent(self) -> None:
        """Verify that explicit task ID and assignee are accepted when context is absent."""
        request = ActionEngineRequest(
            user_intent="Assign task t-500 to Charlie",
            task_context=None,
        )
        action = {
            "action": "assign_task",
            "parameters": {"task_id": "t-500", "assignee": "Charlie"},
        }
        validated = validate_action(action, request=request)
        assert validated.parameters.task_id == "t-500"
        assert validated.parameters.assignee == "Charlie"

    def test_create_event_allowed_without_existing_event(self) -> None:
        """Verify create_event creates new event and does not require existing event reference."""
        request = ActionEngineRequest(
            user_intent="Create the Autumn Showcase event",
            event_context=None,
        )
        action = {
            "action": "create_event",
            "parameters": {
                "event_name": "Autumn Showcase 2026",
                "start_date": "2026-11-01",
            },
        }
        validated = validate_action(action, request=request)
        assert validated.parameters.event_name == "Autumn Showcase 2026"

    def test_existing_event_reference_validated_when_applicable(self) -> None:
        """Verify that existing event reference is validated against supplied event_context."""
        request = ActionEngineRequest(
            user_intent="Schedule ceremony for Autumn Gala",
            event_context="Annual Autumn Gala 2026",
        )
        # Valid reference matching event_context
        action_valid = {
            "action": "create_announcement",
            "parameters": {"title": "Gala Schedule", "message": "Doors open at 6pm"},
        }
        validated = validate_action(action_valid, request=request)
        assert validated.parameters.title == "Gala Schedule"

    def test_casing_and_whitespace_insensitivity(self) -> None:
        """Verify that case and whitespace differences do not cause false rejections."""
        request = ActionEngineRequest(
            user_intent="Update the stage task",
            task_context=[{"task_id": "TASK-100", "title": "Main Stage Setup", "owner": "ALICE"}],
        )
        action = {
            "action": "assign_task",
            "parameters": {"task_id": "task-100", "assignee": "alice"},
        }
        validated = validate_action(action, request=request)
        assert validated.parameters.task_id == "task-100"


class TestActionEngineService:
    @pytest.mark.asyncio
    async def test_valid_llm_output_accepted(self) -> None:
        """Verify that valid structured LLM output produces ActionProposalList."""
        mock_llm = AsyncMock(spec=LLMService)
        llm_payload = {
            "actions": [
                {
                    "action": "create_task",
                    "parameters": {"title": "Print registration badges", "priority": "HIGH"},
                    "requires_confirmation": True,
                }
            ]
        }
        mock_llm.generate_response.return_value = LLMResponse(
            text=json.dumps(llm_payload),
            model="gpt-4o-mini",
        )

        service = ActionEngineService(llm_service=mock_llm)
        request = ActionEngineRequest(user_intent="Prepare registration badges for tomorrow")

        result = await service.propose_actions(request)
        assert isinstance(result, ActionProposalList)
        assert len(result.actions) == 1
        assert result.actions[0].parameters.title == "Print registration badges"
        assert result.actions[0].requires_confirmation is True

    @pytest.mark.asyncio
    async def test_malformed_json_rejected(self) -> None:
        """Verify that non-JSON output from LLM raises MalformedAIOutputError."""
        mock_llm = AsyncMock(spec=LLMService)
        mock_llm.generate_response.return_value = LLMResponse(
            text="I recommend creating a task for registration.",
            model="gpt-4o-mini",
        )

        service = ActionEngineService(llm_service=mock_llm)
        request = ActionEngineRequest(user_intent="Prepare registration badges")

        with pytest.raises(MalformedAIOutputError):
            await service.propose_actions(request)

    @pytest.mark.asyncio
    async def test_invalid_action_rejected(self) -> None:
        """Verify that unsupported action in LLM output raises ActionValidationError."""
        mock_llm = AsyncMock(spec=LLMService)
        llm_payload = {
            "actions": [
                {
                    "action": "delete_database",
                    "parameters": {},
                    "requires_confirmation": True,
                }
            ]
        }
        mock_llm.generate_response.return_value = LLMResponse(
            text=json.dumps(llm_payload),
            model="gpt-4o-mini",
        )

        service = ActionEngineService(llm_service=mock_llm)
        request = ActionEngineRequest(user_intent="Wipe database")

        with pytest.raises(ActionValidationError):
            await service.propose_actions(request)

    @pytest.mark.asyncio
    async def test_service_uses_existing_llm_abstraction(self) -> None:
        """Verify that ActionEngineService delegates to LLMService abstraction."""
        mock_llm = AsyncMock(spec=LLMService)
        mock_llm.generate_response.return_value = LLMResponse(
            text=json.dumps({"actions": []}),
            model="gpt-4o-mini",
        )

        service = ActionEngineService(llm_service=mock_llm)
        request = ActionEngineRequest(user_intent="No action needed")

        result = await service.propose_actions(request)
        assert isinstance(result, ActionProposalList)
        assert len(result.actions) == 0
        mock_llm.generate_response.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_service_does_not_execute_anything(self) -> None:
        """Verify that ActionEngineService contains zero execution or mutation methods."""
        service = ActionEngineService(llm_service=AsyncMock(spec=LLMService))
        public_methods = [m for m in dir(service) if not m.startswith("_")]
        assert "propose_actions" in public_methods
        assert not any("execute" in m or "mutate" in m or "run" in m for m in public_methods)

    def test_validate_action_proposals_batch_helper(self) -> None:
        """Verify validate_action_proposals accepts ActionProposalList directly."""
        proposal_list = ActionProposalList(
            actions=[
                CreateTaskAction(
                    action=ActionType.CREATE_TASK,
                    parameters=CreateTaskParameters(title="Check audio"),
                )
            ]
        )
        validated = validate_action_proposals(
            proposal_list, request=ActionEngineRequest(user_intent="Check audio")
        )
        assert len(validated.actions) == 1
        assert validated.actions[0].requires_confirmation is True
