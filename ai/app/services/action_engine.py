"""Action Engine service for generating safe, grounded action proposals."""

from __future__ import annotations

from typing import Any

from app.core.llm import LLMService, get_llm_service
from app.prompts.action_engine import (
    ACTION_ENGINE_SYSTEM_PROMPT,
    build_action_engine_prompt,
)
from app.schemas.action_engine import (
    ActionEngineContext,
    ActionEngineResult,
    ActionProposal,
)
from app.validators.action_engine_validator import (
    validate_action_engine_result,
    validate_action_proposal,
)


class ActionEngineService:
    """Orchestrates LLM interaction and deterministic safety validation for action proposals.

    Guarantees:
    1. NEVER executes actions; only proposes structured mutations.
    2. Enforces requires_confirmation=True on every mutation.
    3. Rejects fabricated task references and assignees when grounding context is supplied.
    """

    def __init__(self, llm_service: LLMService | None = None) -> None:
        self._llm = llm_service or get_llm_service()

    async def propose_actions(
        self,
        context: ActionEngineContext | dict[str, Any],
        *,
        temperature: float = 0.1,
    ) -> ActionEngineResult:
        """Analyze intent and operational context to produce validated action proposals."""
        if isinstance(context, dict):
            ctx_obj = ActionEngineContext.model_validate(context)
        else:
            ctx_obj = context

        user_content = build_action_engine_prompt(ctx_obj)

        response = await self._llm.generate_response(
            prompt=user_content,
            system=ACTION_ENGINE_SYSTEM_PROMPT,
            temperature=temperature,
        )

        return validate_action_engine_result(response.text, context=ctx_obj)

    def validate_proposal(
        self,
        proposal: ActionProposal | dict[str, Any],
        context: ActionEngineContext | None = None,
    ) -> ActionProposal:
        """Validate a single proposal deterministically without LLM invocation."""
        return validate_action_proposal(proposal, context=context)
