from datetime import date
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from .common import EventType
from .risk import Risk
from .task import Task


class Milestone(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str
    description: str | None = None
    due_date: date | None = None


class Event(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    event_name: str = Field(min_length=1)
    description: str | None = None
    event_type: EventType | None = None
    start_date: date | None = None
    end_date: date | None = None
    expected_participants: int | None = Field(default=None, ge=0)
    teams: list[str] = Field(default_factory=list)
    tasks: list[Task] = Field(default_factory=list)
    milestones: list[Milestone] = Field(default_factory=list)
    risks: list[Risk] = Field(default_factory=list)

    @model_validator(mode="after")
    def _check_dates(self) -> Self:
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be >= start_date")
        return self


class EventPlanRequest(BaseModel):
    """Payload for generating an AI event plan."""

    prompt: str = Field(min_length=3, description="User prompt describing event requirements")
    event_type: EventType | None = Field(default=None, description="Preferred event category")
    target_date: str | None = Field(default=None, description="Target start date or date range")
    expected_attendees: int | None = Field(
        default=None, ge=0, description="Estimated participant count"
    )
    temperature: float = Field(
        default=0.2, ge=0.0, le=1.0, description="Sampling temperature"
    )
