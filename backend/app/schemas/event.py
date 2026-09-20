from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EventCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    starts_at: datetime
    club_id: int

    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    starts_at: datetime | None = None
    club_id: int | None = None

    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )


class EventResponse(BaseModel):
    id: int
    title: str
    description: str | None
    starts_at: datetime
    club_id: int

    model_config = ConfigDict(from_attributes=True)