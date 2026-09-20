from datetime import date

import pytest
from app.schemas.actions import (
    SUPPORTED_ACTIONS,
    AIAction,
    CreateTaskAction,
)
from app.schemas.common import EventType, Priority, RiskSeverity, TaskStatus
from app.schemas.event import Event, Milestone
from app.schemas.meeting import MeetingActionItem, MeetingResult
from app.schemas.risk import Risk
from app.schemas.task import Task
from pydantic import TypeAdapter, ValidationError


class TestTaskSchema:
    def test_valid_task_minimal(self) -> None:
        task = Task(title="Set up stage")
        assert task.title == "Set up stage"
        assert task.priority == Priority.MEDIUM
        assert task.status == TaskStatus.TODO
        assert task.owner_name is None
        assert task.owner_id is None
        assert task.deadline is None
        assert task.dependencies == []

    def test_valid_task_full(self) -> None:
        task = Task(
            title="Design banner",
            description="High-res print banner for club fest",
            owner_name="Alice",
            owner_id="usr-123",
            deadline=date(2026, 10, 15),
            priority=Priority.HIGH,
            status=TaskStatus.IN_PROGRESS,
            dependencies=["Task 1"],
        )
        assert task.owner_name == "Alice"
        assert task.deadline == date(2026, 10, 15)

    def test_task_extra_fields_forbidden(self) -> None:
        with pytest.raises(ValidationError):
            Task.model_validate({"title": "Test", "extra_field": "disallowed"})

    def test_task_empty_title_fails(self) -> None:
        with pytest.raises(ValidationError):
            Task(title="")


class TestEventSchema:
    def test_valid_event_minimal(self) -> None:
        event = Event(event_name="Hackathon 2026")
        assert event.event_name == "Hackathon 2026"
        assert event.tasks == []
        assert event.milestones == []
        assert event.risks == []

    def test_valid_event_with_dates(self) -> None:
        event = Event(
            event_name="Workshop",
            event_type=EventType.WORKSHOP,
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 2),
            expected_participants=50,
            tasks=[Task(title="Book room")],
            milestones=[Milestone(title="Registrations open", due_date=date(2026, 10, 20))],
            risks=[Risk(title="Low attendance", severity=RiskSeverity.MEDIUM)],
        )
        assert event.event_type == EventType.WORKSHOP
        assert len(event.tasks) == 1
        assert len(event.milestones) == 1
        assert len(event.risks) == 1

    def test_event_invalid_date_range_fails(self) -> None:
        with pytest.raises(ValidationError, match="end_date must be >= start_date"):
            Event(
                event_name="Workshop",
                start_date=date(2026, 11, 5),
                end_date=date(2026, 11, 2),
            )

    def test_event_negative_participants_fails(self) -> None:
        with pytest.raises(ValidationError):
            Event(event_name="Seminar", expected_participants=-5)


class TestMeetingSchema:
    def test_valid_meeting_result(self) -> None:
        meeting = MeetingResult(
            summary="Kickoff sync for annual showcase",
            decisions=["Approved budget", "Selected date"],
            action_items=[
                MeetingActionItem(
                    title="Send sponsor emails",
                    owner_name="Bob",
                    deadline=date(2026, 9, 30),
                    priority=Priority.HIGH,
                )
            ],
            risks=[
                Risk(
                    title="Budget overrun",
                    severity=RiskSeverity.HIGH,
                    reason="Venue quote higher than anticipated",
                )
            ],
        )
        assert len(meeting.decisions) == 2
        assert len(meeting.action_items) == 1
        assert meeting.action_items[0].priority == Priority.HIGH


class TestRiskSchema:
    def test_valid_risk(self) -> None:
        risk = Risk(
            title="Speaker cancellation",
            description="Keynote speaker mentioned conflicting travel",
            severity=RiskSeverity.HIGH,
            reason="Flight schedule change communicated by coordinator",
            affected_tasks=["Confirm keynote"],
            recommended_action="Reach out to backup speaker",
        )
        assert risk.severity == RiskSeverity.HIGH
        assert risk.is_ai_prediction is True

    def test_risk_missing_severity_fails(self) -> None:
        with pytest.raises(ValidationError):
            Risk(title="Missing severity")


class TestActionSchemas:
    def test_supported_actions_list(self) -> None:
        expected = [
            "create_task",
            "update_task",
            "assign_task",
            "update_task_status",
            "create_announcement",
            "create_event",
        ]
        assert set(SUPPORTED_ACTIONS) == set(expected)

    def test_action_discriminator_create_task(self) -> None:
        adapter = TypeAdapter(AIAction)
        data = {
            "action": "create_task",
            "parameters": {"title": "Prepare slides"},
            "requires_confirmation": True,
        }
        action = adapter.validate_python(data)
        assert isinstance(action, CreateTaskAction)
        assert action.parameters.title == "Prepare slides"
        assert action.requires_confirmation is True

    def test_action_discriminator_unknown_action_fails(self) -> None:
        adapter = TypeAdapter(AIAction)
        data = {
            "action": "delete_database",
            "parameters": {},
        }
        with pytest.raises(ValidationError):
            adapter.validate_python(data)
