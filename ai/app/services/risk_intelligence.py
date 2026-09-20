"""Risk Intelligence service for identifying grounded operational risks."""

from __future__ import annotations

from typing import Any

from app.core.llm import LLMService, get_llm_service
from app.prompts.risk_analyzer import (
    RISK_ANALYZER_SYSTEM_PROMPT,
    build_risk_analyzer_prompt,
)
from app.schemas.risk_intelligence import (
    RiskAnalysisResult,
    RiskIntelligenceRequest,
)
from app.validators.output_validator import validate_ai_output
from app.validators.risk_validator import validate_risk_grounding


class RiskIntelligenceService:
    """Orchestrates LLM risk analysis with strict deterministic evidence grounding.

    Guarantees:
    1. The AI NEVER executes actions or proposes mutations.
    2. Reuses existing LLM abstraction (LLMService) without bypassing it.
    3. Does not access any external database or backend services.
    4. Rejects ungrounded, hallucinated, or fabricated risks deterministically.
    """

    def __init__(self, llm_service: LLMService | None = None) -> None:
        self._llm = llm_service or get_llm_service()

    async def analyze_risks(
        self,
        request: RiskIntelligenceRequest | dict[str, Any],
        *,
        temperature: float = 0.1,
    ) -> RiskAnalysisResult:
        """Analyze operational context and return validated, grounded risks.

        Pipeline:
        request
        -> build prompt
        -> existing LLM abstraction
        -> parse JSON & validate_ai_output()
        -> deterministic risk grounding validation
        -> Pydantic RiskAnalysisResult
        """
        if isinstance(request, dict):
            req_obj = RiskIntelligenceRequest.model_validate(request)
        else:
            req_obj = request

        user_prompt = build_risk_analyzer_prompt(req_obj)

        response = await self._llm.generate_response(
            prompt=user_prompt,
            system=RISK_ANALYZER_SYSTEM_PROMPT,
            temperature=temperature,
        )

        # 1. Parse JSON & validate schema against RiskAnalysisResult
        parsed_result = validate_ai_output(response.text, RiskAnalysisResult)

        # 2. Deterministic risk grounding validation
        return validate_risk_grounding(parsed_result, req_obj)
