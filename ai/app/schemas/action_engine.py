"""Schemas for Sprint 6: AI Action Engine."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.actions import AIAction


class ActionEngineRequest(BaseModel):
    """Input payload for proposing grounded operational actions."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    user_intent: str = Field(min_length=1, description="Raw user instruction or command")
    event_context: str | None = Field(
        default=None, description="Current event details or event identifier"
    )
    task_context: list[dict[str, Any]] | None = Field(
        default=None, description="Known existing tasks to guard against fabricated references"
    )
    meeting_output: dict[str, Any] | None = Field(
        default=None, description="Meeting summary, decisions, or action items"
    )
    risk_output: dict[str, Any] | None = Field(
        default=None, description="Identified operational risks"
    )
    operational_context: str | None = Field(
        default=None, description="General club operational context or constraints"
    )


class ActionProposalList(BaseModel):
    """Structured list of validated AI action proposals."""

    model_config = ConfigDict(extra="forbid")

    actions: list[AIAction] = Field(
        default_factory=list, description="List of strictly validated, typed action proposals"
    )


# Backwards compatibility alias
ActionEngineContext = ActionEngineRequest
