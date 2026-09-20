"""Schemas for Sprint 5: Risk Intelligence."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

RiskSeverityLevel = Literal["low", "medium", "high", "critical"]


class RiskIntelligenceRequest(BaseModel):
    """Operational context provided to analyze potential operational risks."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    event_info: str | None = Field(
        default=None, description="Event name, overview, schedule or description"
    )
    tasks: list[dict[str, Any]] | None = Field(
        default=None, description="Known operational tasks with status, owners, or IDs"
    )
    deadlines: list[dict[str, Any]] | None = Field(
        default=None, description="Milestones, due dates, or operational cutoff deadlines"
    )
    owners: list[dict[str, Any]] | None = Field(
        default=None, description="Task assignees, leads, and roles"
    )
    dependencies: list[dict[str, Any]] | None = Field(
        default=None, description="Task or milestone dependency mappings"
    )
    volunteer_availability: str | None = Field(
        default=None, description="Volunteer capacity, shifts, or staffing levels"
    )
    operational_context: str | None = Field(
        default=None, description="General operational notes, venue constraints, or background"
    )


class RiskItem(BaseModel):
    """A structured, evidence-grounded operational risk."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=1, description="Concise summary of the risk")
    description: str = Field(
        min_length=1, description="Operational explanation of why this creates risk"
    )
    severity: RiskSeverityLevel = Field(
        description="Severity level: low, medium, high, or critical"
    )
    evidence: list[str] = Field(
        description="Concrete factual evidence excerpts from supplied context"
    )
    related_task: str | None = Field(
        default=None, description="Associated task identifier or title if task context exists"
    )
    related_event: str | None = Field(
        default=None, description="Associated event name or reference if event context exists"
    )


class RiskAnalysisResult(BaseModel):
    """Validated collection of structured operational risks."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    risks: list[RiskItem] = Field(
        default_factory=list, description="List of grounded, structured risk items"
    )
