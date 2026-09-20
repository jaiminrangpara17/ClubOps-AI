import json

import pytest
from app.core.exceptions import (
    ActionValidationError,
    MalformedAIOutputError,
    SchemaValidationError,
)
from app.schemas.actions import CreateTaskAction
from app.validators.action_validator import validate_ai_action, validate_ai_actions
from app.validators.output_validator import validate_ai_output
from pydantic import BaseModel


class SampleOutput(BaseModel):
    summary: str
    count: int


class TestOutputValidator:
    def test_validate_from_dict(self) -> None:
        data = {"summary": "Great session", "count": 10}
        result = validate_ai_output(data, SampleOutput)
        assert isinstance(result, SampleOutput)
        assert result.summary == "Great session"
        assert result.count == 10

    def test_validate_from_json_string(self) -> None:
        raw_json = '{"summary": "Parsed from string", "count": 42}'
        result = validate_ai_output(raw_json, SampleOutput)
        assert result.count == 42

    def test_validate_from_existing_model(self) -> None:
        model = SampleOutput(summary="Existing", count=1)
        result = validate_ai_output(model, SampleOutput)
        assert result == model

    def test_validate_none_raises_malformed(self) -> None:
        with pytest.raises(MalformedAIOutputError, match="AI output is None/empty"):
            validate_ai_output(None, SampleOutput)

    def test_validate_empty_string_raises_malformed(self) -> None:
        with pytest.raises(MalformedAIOutputError, match="Empty string"):
            validate_ai_output("   ", SampleOutput)

    def test_validate_invalid_json_raises_malformed(self) -> None:
        with pytest.raises(MalformedAIOutputError, match="Malformed JSON"):
            validate_ai_output("{invalid json}", SampleOutput)

    def test_validate_schema_mismatch_raises_schema_validation_error(self) -> None:
        with pytest.raises(SchemaValidationError):
            validate_ai_output({"summary": "Missing count"}, SampleOutput)


class TestActionValidator:
    def test_valid_create_task_action(self) -> None:
        payload = {
            "action": "create_task",
            "parameters": {"title": "Build UI component"},
            "requires_confirmation": True,
        }
        action = validate_ai_action(payload)
        assert isinstance(action, CreateTaskAction)
        assert action.parameters.title == "Build UI component"

    def test_valid_action_from_json_string(self) -> None:
        payload = json.dumps(
            {
                "action": "create_task",
                "parameters": {"title": "Review PR"},
            }
        )
        action = validate_ai_action(payload)
        assert action.parameters.title == "Review PR"

    def test_invalid_action_name_raises_action_validation_error(self) -> None:
        payload = {
            "action": "drop_tables",
            "parameters": {},
        }
        with pytest.raises(ActionValidationError):
            validate_ai_action(payload)

    def test_malformed_json_raises_malformed_error(self) -> None:
        with pytest.raises(MalformedAIOutputError):
            validate_ai_action("not a json string")

    def test_valid_multiple_actions(self) -> None:
        payload = [
            {
                "action": "create_task",
                "parameters": {"title": "Task A"},
            },
            {
                "action": "update_task_status",
                "parameters": {"task_id": "123", "status": "COMPLETED"},
            },
        ]
        actions = validate_ai_actions(payload)
        assert len(actions) == 2
        assert actions[0].action == "create_task"
        assert actions[1].action == "update_task_status"

    def test_multiple_actions_with_invalid_item_raises_action_validation_error(self) -> None:
        payload = [
            {
                "action": "create_task",
                "parameters": {"title": "Task A"},
            },
            {
                "action": "unknown_action",
                "parameters": {},
            },
        ]
        with pytest.raises(ActionValidationError):
            validate_ai_actions(payload)
