"""AI Announcement Generator service for drafting grounded club communications."""

from __future__ import annotations

from typing import Any

from app.core.llm import LLMService, get_llm_service
from app.prompts.announcement_generator import (
    ANNOUNCEMENT_GENERATOR_SYSTEM_PROMPT,
    build_announcement_prompt,
)
from app.schemas.communication import AnnouncementRequest, AnnouncementResult
from app.validators.communication_validator import validate_announcement_grounding
from app.validators.output_validator import validate_ai_output


class AnnouncementGeneratorService:
    """Orchestrates LLM generation and deterministic grounding validation for announcement drafts.

    Guarantees:
    1. Outputs strictly draft announcements for human review.
    2. NEVER publishes, broadcasts, or sends announcements automatically.
    3. Zero database access, zero action execution.
    4. Enforces deterministic grounding: rejects fabricated facts not present in the request.
    """

    def __init__(self, llm_service: LLMService | None = None) -> None:
        self._llm = llm_service

    def _get_llm(self) -> LLMService:
        if self._llm is None:
            self._llm = get_llm_service()
        return self._llm

    async def generate(
        self,
        request: AnnouncementRequest | dict[str, Any],
        *,
        temperature: float = 0.2,
    ) -> AnnouncementResult:
        """Generate a grounded announcement draft from supplied facts.

        Pipeline:
        request
        -> build prompt
        -> LLMService
        -> parse JSON & validate_ai_output()
        -> deterministic grounding validator (validate_announcement_grounding)
        -> AnnouncementResult
        """
        req_obj = (
            AnnouncementRequest.model_validate(request)
            if isinstance(request, dict)
            else request
        )

        prompt = build_announcement_prompt(req_obj)

        response = await self._get_llm().generate_response(
            prompt=prompt,
            system=ANNOUNCEMENT_GENERATOR_SYSTEM_PROMPT,
            temperature=temperature,
        )

        parsed = validate_ai_output(response.text, AnnouncementResult)
        return validate_announcement_grounding(parsed, request=req_obj)
