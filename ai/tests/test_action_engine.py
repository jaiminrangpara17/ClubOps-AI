"""Comprehensive test suite for Sprint 6 Action Engine."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock

import pytest
from app.core.exceptions import ActionValidationError, MalformedAIOutputError
from app.core.llm import LLMResponse, LLMService
from app.schemas.action_engine import (
    ActionEngineContext,
    ActionEngineResult,
    ActionProposal,
    PersonContextItem,
    TaskContextItem,
)
from app.schemas.actions import (
    AssignTaskAction,
    AssignTaskParameters,
    CreateAnnouncementAction,
    CreateAnnouncementParameters,
    CreateEventAction,
    CreateEventParameters,
    CreateTaskAction,
    CreateTaskParameters,
    UpdateTaskAction,
    UpdateTaskParameters,
    UpdateTaskStatusAction,
    UpdateTaskStatusParameters,
)
from app.schemas.common import ActionType, TaskStatus
from app.services.action_engine import ActionEngineService
from app.validators.action_engine_validator import (
    validate_action_engine_result,
    validate_action_proposal,
    validate_action_proposals,
)
from pydantic import ValidationError


class TestActionEngineSchemasAndProposals:
    def test_valid_action_proposals_all_types(self) -> None:
        """Verify that all 6 permitted action types can form valid ActionProposals."""
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
                parameters=AssignTaskParameters(task_id="t-1", assignee="Alex"),
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

        proposals = [ActionProposal(action=act) for act in actions]
        assert len(proposals) == 6
        for p in proposals:
            assert p.requires_confirmation is True
            assert p.is_executed is False

        # Also verify validate_action_proposals batch helper
        batch_validated = validate_action_proposals(proposals)
        assert len(batch_validated) == 6

    def test_required_field_validation(self) -> None:
        """Verify that missing required fields trigger validation errors."""
        # Empty title in CreateTask
        with pytest.raises(ValidationError):
            CreateTaskParameters(title="")

        # Missing required task_id in AssignTask
        with pytest.raises(ValidationError):
            AssignTaskParameters.model_validate({"assignee": "Alex"})

        # Invalid action name rejected by union
        with pytest.raises(ActionValidationError):
            validate_action_proposal(
                {"action": "delete_database", "parameters": {}}
            )

    def test_confirmation_always_forced_to_true(self) -> None:
        """Verify that requires_confirmation is strictly True on all proposals."""
        raw_proposal = {
            "action": {
                "action": "create_task",
                "parameters": {"title": "Check cables"},
                "requires_confirmation": False,  # Attempting to bypass confirmation
            },
            "requires_confirmation": False,
            "is_executed": False,
        }

        validated = validate_action_proposal(raw_proposal)
        assert validated.requires_confirmation is True
        assert validated.action.requires_confirmation is True

    def test_no_action_execution(self) -> None:
        """Verify that proposals can never claim to be executed."""
        raw_executed = {
            "action": {
                "action": "create_task",
                "parameters": {"title": "Check cables"},
            },
            "is_executed": True,  # Illegal claim
        }

        with pytest.raises(ActionValidationError, match="cannot claim to be executed"):
            validate_action_proposal(raw_executed)


class TestContextGroundingAndSafety:
    def test_fabricated_task_reference_rejection(self) -> None:
        """Verify that referencing an ungrounded task_id is rejected when task_context exists."""
        context = ActionEngineContext(
            user_intent="Mark the catering task done",
            task_context=[
                TaskContextItem(task_id="t-101", title="Order catering"),
                TaskContextItem(task_id="t-102", title="Book room"),
            ],
        )

        invalid_proposal = {
            "action": {
                "action": "update_task_status",
                "parameters": {"task_id": "t-999", "status": "COMPLETED"},
            }
        }

        with pytest.raises(ActionValidationError, match="Fabricated task reference 't-999'"):
            validate_action_proposal(invalid_proposal, context=context)

    def test_valid_task_reference_acceptance(self) -> None:
        """Verify that referencing an existing task_id from task_context is accepted."""
        context = ActionEngineContext(
            user_intent="Mark task t-101 done",
            task_context=[
                TaskContextItem(task_id="t-101", title="Order catering"),
            ],
        )

        valid_proposal = {
            "action": {
                "action": "update_task_status",
                "parameters": {"task_id": "t-101", "status": "COMPLETED"},
            }
        }

        result = validate_action_proposal(valid_proposal, context=context)
        assert result.action.parameters.task_id == "t-101"

    def test_fabricated_assignee_rejection_when_people_context_exists(self) -> None:
        """Verify that assignees outside supplied people_context are rejected."""
        context = ActionEngineContext(
            user_intent="Assign task to Mallory",
            people_context=[
                PersonContextItem(name="Alice", user_id="u-1"),
                PersonContextItem(name="Bob", user_id="u-2"),
            ],
        )

        invalid_proposal = {
            "action": {
                "action": "assign_task",
                "parameters": {"task_id": "t-101", "assignee": "Mallory"},
            }
        }

        with pytest.raises(ActionValidationError, match="Fabricated assignee 'Mallory'"):
            validate_action_proposal(invalid_proposal, context=context)

    def test_valid_assignee_acceptance(self) -> None:
        """Verify that assignees from supplied people_context are accepted."""
        context = ActionEngineContext(
            user_intent="Assign task to Alice",
            people_context=[
                PersonContextItem(name="Alice", user_id="u-1"),
                PersonContextItem(name="Bob", user_id="u-2"),
            ],
        )

        valid_proposal = {
            "action": {
                "action": "assign_task",
                "parameters": {"task_id": "t-101", "assignee": "Alice"},
            }
        }

        result = validate_action_proposal(valid_proposal, context=context)
        assert result.action.parameters.assignee == "Alice"

    def test_explicit_user_intent_values_accepted_when_context_unavailable(self) -> None:
        """Verify that explicit task IDs and assignees are accepted when context is omitted."""
        context = ActionEngineContext(
            user_intent="Assign task t-500 to Charlie",
            task_context=None,
            people_context=None,
        )

        proposal = {
            "action": {
                "action": "assign_task",
                "parameters": {"task_id": "t-500", "assignee": "Charlie"},
            }
        }

        result = validate_action_proposal(proposal, context=context)
        assert result.action.parameters.task_id == "t-500"
        assert result.action.parameters.assignee == "Charlie"

    def test_create_event_behavior(self) -> None:
        """Verify create_event creates new events and does not require prior event reference."""
        context = ActionEngineContext(
            user_intent="Schedule our Autumn Showcase",
            event_context=None,
        )

        proposal = {
            "action": {
                "action": "create_event",
                "parameters": {
                    "event_name": "Autumn Showcase 2026",
                    "description": "Annual student club performance",
                    "start_date": "2026-10-15",
                    "end_date": "2026-10-16",
                },
            }
        }

        result = validate_action_proposal(proposal, context=context)
        assert isinstance(result.action, CreateEventAction)
        assert result.action.parameters.event_name == "Autumn Showcase 2026"


class TestActionEngineService:
    @pytest.mark.asyncio
    async def test_propose_actions_end_to_end(self) -> None:
        """Verify ActionEngineService produces validated proposals with mocked LLM."""
        mock_llm = AsyncMock(spec=LLMService)
        llm_payload = {
            "summary": "Propose initial tasks for the venue setup",
            "context_grounded": True,
            "proposals": [
                {
                    "action": {
                        "action": "create_task",
                        "parameters": {
                            "title": "Set up registration desk",
                            "priority": "HIGH",
                        },
                        "requires_confirmation": True,
                    },
                    "reasoning": "Registration desk is critical for attendee check-in",
                    "requires_confirmation": True,
                    "is_executed": False,
                }
            ],
        }

        mock_llm.generate_response.return_value = LLMResponse(
            text=json.dumps(llm_payload),
            model="gpt-4o-mini",
        )

        service = ActionEngineService(llm_service=mock_llm)
        context = ActionEngineContext(
            user_intent="We need to prepare registration for tomorrow's hackathon",
        )

        result = await service.propose_actions(context)
        assert isinstance(result, ActionEngineResult)
        assert len(result.proposals) == 1
        assert result.proposals[0].action.parameters.title == "Set up registration desk"
        assert result.proposals[0].requires_confirmation is True
        assert result.proposals[0].is_executed is False

        # Verify validate_action_engine_result parses instance directly
        revalidated = validate_action_engine_result(result, context=context)
        assert len(revalidated.proposals) == 1

    @pytest.mark.asyncio
    async def test_propose_actions_enforces_anti_fabrication_on_llm_output(self) -> None:
        """Verify that if LLM hallucinates an unknown task_id, validator rejects it."""
        mock_llm = AsyncMock(spec=LLMService)
        hallucinated_payload = {
            "summary": "Update fabricated task",
            "proposals": [
                {
                    "action": {
                        "action": "update_task_status",
                        "parameters": {"task_id": "ghost-task-404", "status": "COMPLETED"},
                    },
                    "reasoning": "Falsely hallucinated task",
                    "requires_confirmation": True,
                    "is_executed": False,
                }
            ],
        }

        mock_llm.generate_response.return_value = LLMResponse(
            text=json.dumps(hallucinated_payload),
            model="gpt-4o-mini",
        )

        service = ActionEngineService(llm_service=mock_llm)
        context = ActionEngineContext(
            user_intent="Finish the tasks",
            task_context=[TaskContextItem(task_id="real-task-1", title="Actual Task")],
        )

        with pytest.raises(ActionValidationError, match="Fabricated task reference"):
            await service.propose_actions(context)

    @pytest.mark.asyncio
    async def test_malformed_llm_output_raises_malformed_error(self) -> None:
        """Verify that malformed non-JSON output from LLM raises MalformedAIOutputError."""
        mock_llm = AsyncMock(spec=LLMService)
        mock_llm.generate_response.return_value = LLMResponse(
            text="Sorry, I cannot help with that.",
            model="gpt-4o-mini",
        )

        service = ActionEngineService(llm_service=mock_llm)
        with pytest.raises(MalformedAIOutputError):
            await service.propose_actions(ActionEngineContext(user_intent="Do something"))
