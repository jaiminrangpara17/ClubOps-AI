"""AI Daily Briefing service for synthesizing operational context into categorized briefings."""

from __future__ import annotations

from typing import Any

from app.core.llm import LLMService, get_llm_service
from app.prompts.daily_briefing import (
    DAILY_BRIEFING_SYSTEM_PROMPT,
    build_daily_briefing_prompt,
)
from app.schemas.communication import BriefingRequest, DailyBriefing
from app.validators.communication_validator import validate_briefing_grounding
from app.validators.output_validator import validate_ai_output


class DailyBriefingService:
    """Orchestrates LLM generation and deterministic grounding validation for Daily Briefings.

    Guarantees:
    1. Outputs synthesized, categorized briefings for leadership review.
    2. Zero database access, zero action execution.
    3. Strictly verifies evidence quotes against supplied operational context.
    4. Safely returns minimal ungrounded briefings when context is absent or insufficient.
    """

    def __init__(self, llm_service: LLMService | None = None) -> None:
        self._llm = llm_service

    def _get_llm(self) -> LLMService:
        if self._llm is None:
            self._llm = get_llm_service()
        return self._llm

    async def generate(
        self,
        request: BriefingRequest | dict[str, Any],
        *,
        temperature: float = 0.1,
    ) -> DailyBriefing:
        """Generate a grounded operational daily briefing from supplied context.

        Pipeline:
        request
        -> build prompt
        -> LLMService
        -> parse JSON & validate_ai_output()
        -> deterministic grounding validator (validate_briefing_grounding)
        -> DailyBriefing
        """
        req_obj = (
            BriefingRequest.model_validate(request)
            if isinstance(request, dict)
            else request
        )

        prompt = build_daily_briefing_prompt(req_obj)

        response = await self._get_llm().generate_response(
            prompt=prompt,
            system=DAILY_BRIEFING_SYSTEM_PROMPT,
            temperature=temperature,
        )

        parsed = validate_ai_output(response.text, DailyBriefing)
        return validate_briefing_grounding(parsed, request=req_obj)
