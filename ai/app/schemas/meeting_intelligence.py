"""Input schema for Meeting Intelligence processing."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class MeetingIntelligenceRequest(BaseModel):
    """Raw meeting transcript + optional context for AI extraction."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    transcript: str = Field(min_length=1, description="Full meeting transcript")
    meeting_title: str | None = None
    meeting_date: str | None = None
    participants: list[str] | None = None
