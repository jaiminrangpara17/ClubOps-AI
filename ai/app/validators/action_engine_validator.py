"""Deterministic validator for Sprint 6: AI Action Engine."""

from __future__ import annotations

import re
from typing import Any

from pydantic import BaseModel, ValidationError

from app.core.exceptions import (
    ActionValidationError,
    MalformedAIOutputError,
    SchemaValidationError,
)
from app.schemas.action_engine import ActionEngineRequest, ActionProposalList
from app.schemas.actions import (
    SUPPORTED_ACTIONS,
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


def normalize_text(text: str) -> str:
    """Normalize text by lowercasing, stripping punctuation, and collapsing whitespace."""
    if not text:
        return ""
    lowered = text.lower()
    cleaned = re.sub(r"[^\w\s]", " ", lowered)
    return re.sub(r"\s+", " ", cleaned).strip()


def extract_known_tasks(task_context: list[dict[str, Any]] | None) -> set[str] | None:
    """Extract normalized set of valid task identifiers and titles from task_context."""
    if task_context is None:
        return None
    ids: set[str] = set()
    for item in task_context:
        if isinstance(item, dict):
            for k in ("task_id", "id", "title", "name"):
                val = item.get(k)
                if val is not None:
                    norm = normalize_text(str(val))
                    if norm:
                        ids.add(norm)
                        ids.add(str(val).strip().lower())
        elif isinstance(item, str):
            norm = normalize_text(item)
            if norm:
                ids.add(norm)
                ids.add(item.strip().lower())
    return ids


def extract_known_people(task_context: list[dict[str, Any]] | None) -> set[str] | None:
    """Extract normalized set of valid people from task_context if people info exists."""
    if task_context is None:
        return None
    people: set[str] = set()
    for item in task_context:
        if isinstance(item, dict):
            for k in ("assignee", "owner", "owner_name", "member", "name", "user_id", "person"):
                val = item.get(k)
                if isinstance(val, str) and val.strip():
                    people.add(normalize_text(val))
                    people.add(val.strip().lower())
            # Check nested lists of members or people
            for list_key in ("members", "people", "assignees", "owners"):
                arr = item.get(list_key)
                if isinstance(arr, list):
                    for elem in arr:
                        if isinstance(elem, str) and elem.strip():
                            people.add(normalize_text(elem))
                            people.add(elem.strip().lower())
                        elif isinstance(elem, dict):
                            for sub_k in ("name", "user_id", "assignee"):
                                sub_v = elem.get(sub_k)
                                if isinstance(sub_v, str) and sub_v.strip():
                                    people.add(normalize_text(sub_v))
                                    people.add(sub_v.strip().lower())
    return people if people else None


def validate_action(
    raw_action: AIAction | dict[str, Any] | BaseModel,
    request: ActionEngineRequest | None = None,
) -> AIAction:
    """Validate a single action against schema constraints and context grounding."""
    # A. Validate action and parameters using existing AIAction schema
    if isinstance(raw_action, _MUTATION_ACTIONS):
        action_obj = raw_action
    elif isinstance(raw_action, dict):
        action_name = raw_action.get("action")
        if not action_name or action_name not in SUPPORTED_ACTIONS:
            msg = f"Unsupported action: '{action_name}'. Allowed actions: {SUPPORTED_ACTIONS}"
            raise ActionValidationError(msg, detail=msg)
        try:
            action_obj = validate_ai_action(raw_action)
        except (ActionValidationError, SchemaValidationError, ValidationError) as e:
            detail = getattr(e, "detail", str(e))
            raise ActionValidationError(detail=detail) from None
    else:
        msg = f"Unsupported action object type: {type(raw_action)}"
        raise ActionValidationError(msg, detail=msg)

    # B. Force confirmation to ALWAYS True
    object.__setattr__(action_obj, "requires_confirmation", True)

    # D & E. Context Grounding Validation
    known_tasks = extract_known_tasks(request.task_context) if request else None
    known_people = extract_known_people(request.task_context) if request else None
    params = action_obj.parameters

    # Check task reference fabrication for task operations
    if known_tasks is not None and isinstance(
        action_obj, (UpdateTaskAction, AssignTaskAction, UpdateTaskStatusAction)
    ):
        task_id = getattr(params, "task_id", None)
        if task_id:
            tid_norm = normalize_text(str(task_id))
            tid_clean = str(task_id).strip().lower()
            matched = (
                tid_norm in known_tasks
                or tid_clean in known_tasks
                or any(tid_norm in k or k in tid_norm for k in known_tasks if k)
            )
            if not matched:
                detail_msg = (
                    f"Fabricated task reference '{task_id}': task does not exist in task context."
                )
                raise ActionValidationError(detail_msg, detail=detail_msg)

    # Check assignee fabrication when people context exists in task_context
    if known_people is not None and isinstance(action_obj, (AssignTaskAction, UpdateTaskAction)):
        assignee = getattr(params, "assignee", None)
        if assignee:
            assignee_norm = normalize_text(str(assignee))
            assignee_clean = str(assignee).strip().lower()
            matched = (
                assignee_norm in known_people
                or assignee_clean in known_people
                or any(assignee_norm in p or p in assignee_norm for p in known_people if p)
            )
            if not matched:
                detail_msg = (
                    f"Fabricated assignee '{assignee}': person does not exist in people context."
                )
                raise ActionValidationError(detail_msg, detail=detail_msg)

    # Check event reference validation when operating on existing event
    # Note: create_event creates a NEW event, so it does NOT require an existing event reference
    if (
        request
        and request.event_context
        and not isinstance(action_obj, CreateEventAction)
        and hasattr(params, "event_name")
    ):
        event_ref = getattr(params, "event_name", None)
        if event_ref:
            ev_norm = normalize_text(request.event_context)
            ref_norm = normalize_text(str(event_ref))
            if ref_norm not in ev_norm:
                detail_msg = (
                    f"Fabricated event reference '{event_ref}': event not in event context."
                )
                raise ActionValidationError(detail_msg, detail=detail_msg)

    return action_obj


def validate_action_proposals(
    raw_output: ActionProposalList | list[Any] | dict[str, Any] | str,
    request: ActionEngineRequest,
) -> ActionProposalList:
    """Deterministically validate raw AI output into a verified ActionProposalList."""
    if raw_output is None:
        raise MalformedAIOutputError("Action Engine output is empty.")

    if isinstance(raw_output, ActionProposalList):
        parsed = raw_output
    elif isinstance(raw_output, list):
        parsed = ActionProposalList(actions=raw_output)
    elif isinstance(raw_output, dict):
        try:
            parsed = ActionProposalList.model_validate(raw_output)
        except ValidationError as exc:
            raise ActionValidationError(detail=str(exc)) from None
    elif isinstance(raw_output, str):
        parsed = validate_ai_output(raw_output, ActionProposalList)
    else:
        msg = f"Unsupported output type for ActionProposalList: {type(raw_output)}"
        raise ActionValidationError(msg, detail=msg)

    validated_actions = [validate_action(act, request=request) for act in parsed.actions]
    return ActionProposalList(actions=validated_actions)
