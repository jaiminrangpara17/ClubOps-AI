"""Schemas for the Sprint 6 Action Engine."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.actions import AIAction
from app.schemas.event import Event
from app.schemas.meeting import MeetingResult
from app.schemas.risk import Risk


class TaskContextItem(BaseModel):
    """Contextual reference to an existing task."""

    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    task_id: str = Field(min_length=1)
    title: str | None = None
    assignee: str | None = None
    status: str | None = None


class PersonContextItem(BaseModel):
    """Contextual reference to a known team member or assignee."""

    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    name: str = Field(min_length=1)
    user_id: str | None = None
    role: str | None = None


class ActionEngineContext(BaseModel):
    """Operational context provided to ground Action Engine proposals."""

    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    user_intent: str = Field(min_length=1, description="Raw user instruction or command")
    event_context: dict[str, Any] | Event | str | None = Field(
        default=None, description="Current event details or event identifier"
    )
    task_context: list[TaskContextItem | dict[str, Any] | str] | None = Field(
        default=None, description="Known existing tasks to guard against fabricated task references"
    )
    meeting_output: dict[str, Any] | MeetingResult | None = Field(
        default=None, description="Meeting summary, decisions, or action items"
    )
    risk_output: dict[str, Any] | Risk | list[dict[str, Any]] | list[Risk] | None = Field(
        default=None, description="Identified operational risks"
    )
    operational_context: dict[str, Any] | str | None = Field(
        default=None, description="General club operational context or constraints"
    )
    people_context: list[PersonContextItem | dict[str, Any] | str] | None = Field(
        default=None, description="Known team members to guard against fabricated assignees"
    )


class ActionProposal(BaseModel):
    """A proposed AI mutation. Strictly requires user confirmation and cannot execute directly."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    action: AIAction = Field(description="The strictly typed action proposal")
    reasoning: str | None = Field(
        default=None, description="Operational justification for proposing this action"
    )
    requires_confirmation: bool = Field(
        default=True, description="Mutations always require explicit user confirmation"
    )
    is_executed: bool = Field(
        default=False, description="Engine only proposes actions; never executes them"
    )


class ActionEngineResult(BaseModel):
    """Structured response containing validated action proposals."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    summary: str = Field(min_length=1, description="Summary of proposed operational actions")
    proposals: list[ActionProposal] = Field(
        default_factory=list, description="List of validated action proposals"
    )
    context_grounded: bool = Field(
        default=True, description="Whether proposals were successfully grounded against context"
    )
