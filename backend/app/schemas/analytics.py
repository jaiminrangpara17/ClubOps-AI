"""Pydantic schemas for the /analytics endpoints."""
from __future__ import annotations

from pydantic import BaseModel, Field


class ClubSummary(BaseModel):
    club_id: int
    club_name: str
    total_members: int
    total_events: int
    average_attendance_rate: float = Field(
        description="Fraction of member-event slots that were marked present (0.0–1.0)"
    )


class OverviewAnalytics(BaseModel):
    total_clubs: int
    total_members: int
    total_events: int
    total_attendance_records: int
    overall_attendance_rate: float = Field(
        description="Overall attendance rate across all clubs (0.0–1.0)"
    )
    clubs: list[ClubSummary]


class EventAttendanceSummary(BaseModel):
    event_id: int
    event_title: str
    total_records: int
    present_count: int
    attendance_rate: float


class ClubAnalytics(BaseModel):
    club_id: int
    club_name: str
    total_members: int
    total_events: int
    average_attendance_rate: float
    events: list[EventAttendanceSummary]
