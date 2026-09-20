"""Meeting Intelligence service (Sprint 4)."""

from __future__ import annotations

import logging
from typing import Any

from app.core.config import Settings, get_settings
from app.core.llm import get_llm_service
from app.prompts.meeting_processor import SYSTEM_PROMPT, build_meeting_prompt
from app.schemas.meeting import MeetingResult
from app.schemas.meeting_intelligence import MeetingIntelligenceRequest
from app.validators.output_validator import validate_ai_output

logger = logging.getLogger(__name__)


class MeetingIntelligenceService:
    """Extract structured meeting intelligence from raw transcripts."""

    def __init__(
        self,
        llm_service: Any = None,
        settings: Settings | None = None,
    ) -> None:
        self._llm = llm_service or get_llm_service()
        self._settings = settings or get_settings()

    async def process_transcript(
        self,
        request: MeetingIntelligenceRequest,
    ) -> MeetingResult:
        prompt = build_meeting_prompt(request)

        llm_response = await self._llm.generate_response(
            system=SYSTEM_PROMPT,
            prompt=prompt,
            temperature=self._settings.llm_temperature,
            max_output_tokens=self._settings.llm_max_output_tokens,
        )

        return validate_ai_output(llm_response.text, MeetingResult)


meeting_intelligence: MeetingIntelligenceService | None = None


def get_meeting_intelligence() -> MeetingIntelligenceService:
    global meeting_intelligence
    if meeting_intelligence is None:
        meeting_intelligence = MeetingIntelligenceService()
    return meeting_intelligence


async def close_meeting_intelligence() -> None:
    global meeting_intelligence
    if meeting_intelligence is not None and meeting_intelligence._llm is not None:
        await meeting_intelligence._llm.aclose()

