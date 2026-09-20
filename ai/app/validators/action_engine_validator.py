"""Deterministic validator for the Sprint 6 Action Engine."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from app.core.exceptions import (
    ActionValidationError,
    MalformedAIOutputError,
    SchemaValidationError,
)
from app.schemas.action_engine import (
    ActionEngineContext,
    ActionEngineResult,
    ActionProposal,
    PersonContextItem,
    TaskContextItem,
)
from app.schemas.actions import (
    AIAction,
    AssignTaskAction,
    CreateAnnouncementAction,
    CreateEventAction,
    CreateTaskAction,
    UpdateTaskAction,
    UpdateTaskStatusAction,
)
from app.validators.action_validator import validate_ai_action
from app.validators.output_validator import validate_ai_output

_MUTATION_ACTIONS = (
    CreateTaskAction,
    UpdateTaskAction,
    AssignTaskAction,
    UpdateTaskStatusAction,
    CreateAnnouncementAction,
    CreateEventAction,
)


def _extract_task_id_set(task_context: list[Any] | None) -> set[str] | None:
    """Extract normalized set of valid task identifiers from task_context."""
    if task_context is None:
        return None
    ids: set[str] = set()
    for item in task_context:
        if isinstance(item, TaskContextItem):
            ids.add(item.task_id)
            if item.title:
                ids.add(item.title.strip().lower())
        elif isinstance(item, dict):
            tid = item.get("task_id") or item.get("id")
            if tid:
                ids.add(str(tid))
            title = item.get("title")
            if title:
                ids.add(str(title).strip().lower())
        elif isinstance(item, str):
            clean = item.strip()
            if clean:
                ids.add(clean)
                ids.add(clean.lower())
        elif hasattr(item, "title"):
            ids.add(str(item.title).strip().lower())
    return ids


def _extract_people_set(people_context: list[Any] | None) -> set[str] | None:
    """Extract normalized set of valid person identifiers from people_context."""
    if people_context is None:
        return None
    people: set[str] = set()
    for item in people_context:
        if isinstance(item, PersonContextItem):
            people.add(item.name.strip().lower())
            people.add(item.name.strip())
            if item.user_id:
                people.add(item.user_id.strip())
                people.add(item.user_id.strip().lower())
        elif isinstance(item, dict):
            name = item.get("name")
            if name:
                people.add(str(name).strip().lower())
                people.add(str(name).strip())
            uid = item.get("user_id") or item.get("id")
            if uid:
                people.add(str(uid).strip())
                people.add(str(uid).strip().lower())
        elif isinstance(item, str):
            clean = item.strip()
            if clean:
                people.add(clean)
                people.add(clean.lower())
    return people


def _is_task_known(task_id: str, known_ids: set[str]) -> bool:
    clean = task_id.strip()
    return clean in known_ids or clean.lower() in known_ids


def _is_person_known(assignee: str, known_people: set[str]) -> bool:
    clean = assignee.strip()
    return clean in known_people or clean.lower() in known_people


def validate_action_proposal(
    raw_proposal: ActionProposal | AIAction | dict[str, Any],
    context: ActionEngineContext | None = None,
) -> ActionProposal:
    """Validate an action proposal against schema constraints and context grounding."""
    # 1. Parse into ActionProposal
    if isinstance(raw_proposal, ActionProposal):
        proposal = raw_proposal
    elif isinstance(raw_proposal, _MUTATION_ACTIONS):
        proposal = ActionProposal(
            action=raw_proposal, requires_confirmation=True, is_executed=False
        )
    elif isinstance(raw_proposal, dict):
        if "action" in raw_proposal and isinstance(raw_proposal["action"], (dict, BaseModel)):
            action_obj = validate_ai_action(raw_proposal["action"])
            reasoning = raw_proposal.get("reasoning")
            if raw_proposal.get("is_executed", False):
                err_msg = "Action proposal cannot claim to be executed."
                raise ActionValidationError(err_msg, detail=err_msg)
            proposal = ActionProposal(
                action=action_obj,
                reasoning=reasoning,
                requires_confirmation=True,
                is_executed=False,
            )
        else:
            action_obj = validate_ai_action(raw_proposal)
            proposal = ActionProposal(
                action=action_obj,
                requires_confirmation=True,
                is_executed=False,
            )
    else:
        msg = f"Unsupported action proposal type: {type(raw_proposal)}"
        raise ActionValidationError(msg, detail=msg)

    # 2. Safety Rule: Confirmation is ALWAYS enforced as True
    if hasattr(proposal.action, "requires_confirmation"):
        object.__setattr__(proposal.action, "requires_confirmation", True)
    if proposal.is_executed:
        raise ActionValidationError(detail="Action proposals must not be marked as executed.")

    # 3. Context Grounding Validation
    known_tasks = _extract_task_id_set(context.task_context if context else None)
    known_people = _extract_people_set(context.people_context if context else None)

    action = proposal.action
    params = action.parameters

    # Check task reference fabrication
    if known_tasks is not None and isinstance(
        action, (UpdateTaskAction, AssignTaskAction, UpdateTaskStatusAction)
    ):
        task_id = getattr(params, "task_id", None)
        if task_id and not _is_task_known(task_id, known_tasks):
            detail_msg = (
                f"Fabricated task reference '{task_id}': task does not exist in task context."
            )
            raise ActionValidationError(detail_msg, detail=detail_msg)

    # Check assignee fabrication
    if known_people is not None:
        assignee = getattr(params, "assignee", None)
        if assignee and not _is_person_known(assignee, known_people):
            detail_msg = (
                f"Fabricated assignee '{assignee}': person does not exist in people context."
            )
            raise ActionValidationError(detail_msg, detail=detail_msg)

    return proposal


def validate_action_proposals(
    raw_proposals: list[Any],
    context: ActionEngineContext | None = None,
) -> list[ActionProposal]:
    """Validate a sequence of action proposals deterministically."""
    if not isinstance(raw_proposals, list):
        raise ActionValidationError(detail="Expected a list of action proposals.")
    return [validate_action_proposal(p, context=context) for p in raw_proposals]


def validate_action_engine_result(
    raw_output: Any,
    context: ActionEngineContext | None = None,
) -> ActionEngineResult:
    """Validate raw AI output as a verified ActionEngineResult."""
    if raw_output is None:
        raise MalformedAIOutputError("Action Engine output is empty.")

    # If raw_output is a list of proposals or actions directly
    if isinstance(raw_output, list):
        proposals = validate_action_proposals(raw_output, context=context)
        return ActionEngineResult(
            summary=f"Proposed {len(proposals)} operational action(s).",
            proposals=proposals,
            context_grounded=True,
        )

    # If already an ActionEngineResult instance
    if isinstance(raw_output, ActionEngineResult):
        proposals = validate_action_proposals(raw_output.proposals, context=context)
        return ActionEngineResult(
            summary=raw_output.summary,
            proposals=proposals,
            context_grounded=raw_output.context_grounded,
        )

    # Parse JSON/dict into ActionEngineResult structure
    try:
        parsed = validate_ai_output(raw_output, ActionEngineResult)
    except SchemaValidationError as e:
        raise ActionValidationError(detail=e.detail) from None

    proposals = validate_action_proposals(parsed.proposals, context=context)
    return ActionEngineResult(
        summary=parsed.summary,
        proposals=proposals,
        context_grounded=parsed.context_grounded,
    )
