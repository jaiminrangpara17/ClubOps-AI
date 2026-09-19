import json
from typing import Any, TypeVar

from pydantic import BaseModel, TypeAdapter, ValidationError

from app.core.exceptions import MalformedAIOutputError, SchemaValidationError, redact_secrets

T = TypeVar("T")


def _summarise(exc: ValidationError) -> str:
    return "; ".join(
        f"{'.'.join(str(p) for p in e['loc']) or 'root'}: {e['msg']}" for e in exc.errors()
    )


def validate_ai_output(raw_output: Any, expected_schema: type[T]) -> T:
    if raw_output is None:
        raise MalformedAIOutputError("AI output is None/empty.")
    if isinstance(raw_output, str):
        s = raw_output.strip()
        if not s:
            raise MalformedAIOutputError("Empty string.")
        try:
            raw_output = json.loads(s)
        except json.JSONDecodeError as e:
            raise MalformedAIOutputError(f"Malformed JSON: {e.msg}") from None
    if isinstance(raw_output, BaseModel):
        if isinstance(raw_output, expected_schema):
            return raw_output  # type: ignore
        raw_output = raw_output.model_dump()
    try:
        return TypeAdapter(expected_schema).validate_python(raw_output)
    except ValidationError as exc:
        raise SchemaValidationError(detail=redact_secrets(_summarise(exc))) from None
