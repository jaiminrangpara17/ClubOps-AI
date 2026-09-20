"""Pydantic schemas and execution contracts for Sprint 9: Backend Integration."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.core.exceptions import ActionValidationError
from app.schemas.actions import SUPPORTED_ACTIONS, AIAction

ExecutionStatus = Literal["executed", "rejected", "pending_confirmation"]


class ActionExecutionRequest(BaseModel):
    """Contract for executing a proposed AIAction through backend business logic.

    Enforces mandatory human confirmation and verified user authorization before any mutation.
    """

    action: AIAction = Field(..., description="The validated AIAction proposal to execute.")
    confirmed: bool = Field(
        default=False,
        description="Explicit human confirmation flag. Must be True for mutations to execute.",
    )
    user_id: str | None = Field(
        default=None,
        description="Authenticated user ID from backend authorization. Required for mutations.",
    )

    model_config = ConfigDict(extra="forbid")


class ActionExecutionResponse(BaseModel):
    """Response returned following backend action execution verification."""

    status: ExecutionStatus = Field(..., description="Status of the execution attempt.")
    action_type: str = Field(..., description="The type of action evaluated.")
    message: str = Field(..., description="Human-readable status or error explanation.")
    mutation_details: dict[str, Any] | None = Field(
        default=None, description="Details of the applied mutation if executed."
    )

    model_config = ConfigDict(extra="forbid")


def verify_action_execution(request: ActionExecutionRequest) -> None:
    """Verify that an action execution request satisfies human confirmation and user auth.

    Guarantees:
    1. Rejects unconfirmed mutations: requires_confirmation is strictly enforced.
    2. Rejects unauthenticated execution attempts: user_id must be provided by backend.
    3. AI never directly touches the database; backend remains the authority.
    """
    if not request.confirmed:
        raise ActionValidationError(
            "Mutation rejected: action requires explicit human confirmation."
        )

    if not request.user_id or not request.user_id.strip():
        raise ActionValidationError(
            "Mutation rejected: action requires an authenticated user context."
        )

    if request.action.action not in SUPPORTED_ACTIONS:
        raise ActionValidationError(
            f"Mutation rejected: action '{request.action.action}' is not in permitted whitelist."
        )
