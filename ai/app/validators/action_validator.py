from typing import Any

from app.core.exceptions import ActionValidationError, MalformedAIOutputError, SchemaValidationError
from app.schemas.actions import AIAction

from .output_validator import validate_ai_output


def validate_ai_action(raw: Any) -> AIAction:
    try:
        return validate_ai_output(raw, AIAction)
    except MalformedAIOutputError:
        raise
    except SchemaValidationError as e:
        raise ActionValidationError(detail=e.detail) from None


def validate_ai_actions(raw: Any) -> list[AIAction]:
    try:
        return validate_ai_output(raw, list[AIAction])
    except MalformedAIOutputError:
        raise
    except SchemaValidationError as e:
        raise ActionValidationError(detail=e.detail) from None
