"""Action Engine service for generating safe, grounded action proposals."""

from __future__ import annotations

from typing import Any

from app.core.exceptions import ActionValidationError, SchemaValidationError
from app.core.llm import LLMService, get_llm_service
from app.prompts.action_engine import (
    ACTION_ENGINE_SYSTEM_PROMPT,
    build_action_engine_prompt,
)
from app.schemas.action_engine import ActionEngineRequest, ActionProposalList
from app.validators.action_engine_validator import validate_action_proposals
from app.validators.output_validator import validate_ai_output


class ActionEngineService:
    """Orchestrates LLM interaction and deterministic safety validation for action proposals.

    Guarantees:
    1. NEVER executes actions; only proposes structured mutations.
    2. Enforces requires_confirmation=True on every mutation.
    3. Rejects fabricated task references and assignees when grounding context is supplied.
    4. Zero database or backend connectivity.
    """

    def __init__(self, llm_service: LLMService | None = None) -> None:
        self._llm = llm_service or get_llm_service()

    async def propose_actions(
        self,
        request: ActionEngineRequest | dict[str, Any],
        *,
        temperature: float = 0.1,
    ) -> ActionProposalList:
        """Convert validated user intent and context into safe, structured action proposals.

        Pipeline:
        request
        -> build prompt
        -> existing LLM abstraction
        -> parse JSON & validate_ai_output()
        -> deterministic Action Engine validator
        -> typed ActionProposalList
        """
        if isinstance(request, dict):
            req_obj = ActionEngineRequest.model_validate(request)
        else:
            req_obj = request

        user_content = build_action_engine_prompt(req_obj)

        response = await self._llm.generate_response(
            prompt=user_content,
            system=ACTION_ENGINE_SYSTEM_PROMPT,
            temperature=temperature,
        )

        try:
            parsed = validate_ai_output(response.text, ActionProposalList)
        except SchemaValidationError as exc:
            raise ActionValidationError(detail=exc.detail) from None

        return validate_action_proposals(parsed, request=req_obj)

