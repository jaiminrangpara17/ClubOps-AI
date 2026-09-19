from __future__ import annotations

from enum import StrEnum


class Priority(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RiskSeverity(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TaskStatus(StrEnum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    BLOCKED = "BLOCKED"
    COMPLETED = "COMPLETED"
    OVERDUE = "OVERDUE"


class EventType(StrEnum):
    WORKSHOP = "WORKSHOP"
    COMPETITION = "COMPETITION"
    MEETING = "MEETING"
    SOCIAL = "SOCIAL"
    FUNDRAISER = "FUNDRAISER"
    CONFERENCE = "CONFERENCE"
    OTHER = "OTHER"


class ActionType(StrEnum):
    CREATE_TASK = "create_task"
    UPDATE_TASK = "update_task"
    ASSIGN_TASK = "assign_task"
    UPDATE_TASK_STATUS = "update_task_status"
    CREATE_ANNOUNCEMENT = "create_announcement"
    CREATE_EVENT = "create_event"

