"""Event Planner service combining LLMService and Event schema validation."""

from __future__ import annotations

from app.core.llm import LLMService, get_llm_service
from app.prompts.event_planner import EVENT_PLANNER_SYSTEM_PROMPT, build_event_planner_prompt
from app.schemas.event import Event
from app.validators.output_validator import validate_ai_output


class EventPlannerService:
    """Orchestrates LLM interaction and validation for event planning."""

    def __init__(self, llm_service: LLMService | None = None) -> None:
        self._llm = llm_service or get_llm_service()

    async def generate_plan(
        self,
        prompt: str,
        *,
        event_type: str | None = None,
        target_date: str | None = None,
        expected_attendees: int | None = None,
        temperature: float = 0.2,
    ) -> Event:
        user_content = build_event_planner_prompt(
            prompt,
            event_type=event_type,
            target_date=target_date,
            expected_attendees=expected_attendees,
        )

        response = await self._llm.generate_response(
            prompt=user_content,
            system=EVENT_PLANNER_SYSTEM_PROMPT,
            temperature=temperature,
        )

        return validate_ai_output(response.text, Event)
