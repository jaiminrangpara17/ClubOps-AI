"""Pydantic schemas for Sprint 8: AI Communication Services."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

BriefingCategory = Literal[
    "urgent",
    "deadline",
    "task",
    "risk",
    "event",
    "meeting",
    "general",
]


class AnnouncementRequest(BaseModel):
    """Input payload for generating a club announcement draft."""

    purpose: str = Field(..., min_length=1, description="Primary purpose of the announcement.")
    audience: str | None = Field(
        default=None, description="Intended target audience (e.g., all members, volunteers)."
    )
    event_info: str | None = Field(
        default=None, description="Associated event name or context if applicable."
    )
    key_details: list[str] | None = Field(
        default=None, description="Factual details, dates, or logistical points to communicate."
    )
    tone: str | None = Field(
        default=None, description="Desired communication tone (e.g., enthusiastic, formal, urgent)."
    )

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class AnnouncementResult(BaseModel):
    """Structured announcement draft grounded in verified operational facts."""

    title: str = Field(..., min_length=1, description="Concise, attention-grabbing title.")
    body: str = Field(..., min_length=1, description="Structured announcement body text.")
    audience: str | None = Field(default=None, description="Target audience.")
    grounded: bool = Field(
        ..., description="Whether the announcement is strictly grounded in supplied facts."
    )
    used_facts: list[str] = Field(
        default_factory=list,
        description="List of factual claims from the context utilized in the draft.",
    )

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class BriefingRequest(BaseModel):
    """Input operational context for generating an AI Daily Briefing."""

    date: str = Field(..., min_length=1, description="Date of the briefing (e.g., YYYY-MM-DD).")
    tasks: list[dict[str, Any]] | None = Field(
        default=None, description="Current operational tasks and statuses."
    )
    deadlines: list[dict[str, Any]] | None = Field(
        default=None, description="Upcoming deadlines and cutoff milestones."
    )
    risks: list[dict[str, Any]] | None = Field(
        default=None, description="Known operational risks or vulnerabilities."
    )
    events: list[dict[str, Any]] | None = Field(
        default=None, description="Scheduled events and details."
    )
    meetings: list[dict[str, Any]] | None = Field(
        default=None, description="Recent or upcoming meetings and action items."
    )
    operational_context: str | None = Field(
        default=None, description="Additional operational notes or club announcements."
    )

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class BriefingItem(BaseModel):
    """A single categorized item within the daily operational briefing."""

    category: BriefingCategory = Field(..., description="Operational category of the item.")
    title: str = Field(..., min_length=1, description="Concise headline for the item.")
    summary: str = Field(
        ..., min_length=1, description="Operational explanation or summary of the item."
    )
    evidence: list[str] = Field(
        default_factory=list,
        description="Factual evidence excerpts directly derived from supplied input.",
    )

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class DailyBriefing(BaseModel):
    """Synthesized daily operational briefing."""

    date: str = Field(..., min_length=1, description="Date for which the briefing applies.")
    summary: str = Field(
        ..., min_length=1, description="High-level executive summary of daily operations."
    )
    items: list[BriefingItem] = Field(
        default_factory=list, description="Categorized briefing items."
    )
    grounded: bool = Field(
        ..., description="Whether the briefing is supported by supplied operational context."
    )

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
