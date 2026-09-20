from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from .common import Priority
from .risk import Risk


class MeetingActionItem(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=1)
    description: str | None = None
    owner_name: str | None = None
    deadline: date | None = None
    priority: Priority = Priority.MEDIUM
    dependencies: list[str] = Field(default_factory=list)


class MeetingResult(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    summary: str = Field(min_length=1)
    decisions: list[str] = Field(default_factory=list)
    action_items: list[MeetingActionItem] = Field(default_factory=list)
    risks: list[Risk] = Field(default_factory=list)
