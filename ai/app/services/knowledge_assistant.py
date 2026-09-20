"""Knowledge Assistant service for strictly grounded RAG answers."""

from __future__ import annotations

from typing import Any

from app.core.llm import LLMService, get_llm_service
from app.knowledge.retriever import KnowledgeRetriever
from app.prompts.knowledge_assistant import (
    KNOWLEDGE_ASSISTANT_SYSTEM_PROMPT,
    build_knowledge_prompt,
)
from app.schemas.knowledge import KnowledgeAnswer, KnowledgeQueryRequest
from app.validators.knowledge_validator import validate_knowledge_answer
from app.validators.output_validator import validate_ai_output

INSUFFICIENT_KNOWLEDGE_MESSAGE = (
    "The available club knowledge is insufficient to answer this query."
)


class KnowledgeAssistantService:
    """Orchestrates RAG retrieval, LLM interaction, and deterministic source validation.

    Guarantees:
    1. NEVER answers from the LLM's general outside knowledge.
    2. Short-circuits on zero retrieval: If no relevant chunks exist, returns grounded=false
       and an insufficient-knowledge answer immediately WITHOUT invoking the LLM.
    3. Deterministic source validation: Every cited source must correspond to an actually
       retrieved chunk.
    4. Zero database access, zero backend mutations, zero action execution.
    """

    def __init__(
        self,
        retriever: KnowledgeRetriever | None = None,
        llm_service: LLMService | None = None,
    ) -> None:
        self._retriever = retriever
        self._llm = llm_service

    def _get_llm(self) -> LLMService:
        if self._llm is None:
            self._llm = get_llm_service()
        return self._llm

    async def answer(
        self,
        request: KnowledgeQueryRequest | dict[str, Any],
        retriever: KnowledgeRetriever | None = None,
        *,
        temperature: float = 0.0,
    ) -> KnowledgeAnswer:
        """Answer a query strictly from retrieved club knowledge.

        Pipeline:
        query
        -> retriever.search()
        -> retrieved chunks
        -> if no relevant chunks: return grounded=false (no LLM call)
        -> build grounded prompt
        -> existing LLM abstraction (LLMService)
        -> parse JSON via validate_ai_output()
        -> deterministic source validation (validate_knowledge_answer)
        -> KnowledgeAnswer
        """
        if isinstance(request, dict):
            req_obj = KnowledgeQueryRequest.model_validate(request)
        else:
            req_obj = request

        active_retriever = retriever or self._retriever
        chunks = (
            active_retriever.search(req_obj.query, top_k=req_obj.top_k)
            if active_retriever
            else []
        )

        # If retrieval found no relevant context, return immediately without calling LLM
        if not chunks:
            return KnowledgeAnswer(
                answer=INSUFFICIENT_KNOWLEDGE_MESSAGE,
                sources=[],
                grounded=False,
            )

        # Build grounded prompt containing ONLY retrieved chunks
        prompt = build_knowledge_prompt(query=req_obj.query, chunks=chunks)

        response = await self._get_llm().generate_response(
            prompt=prompt,
            system=KNOWLEDGE_ASSISTANT_SYSTEM_PROMPT,
            temperature=temperature,
        )

        parsed = validate_ai_output(response.text, KnowledgeAnswer)
        return validate_knowledge_answer(parsed, retrieved_chunks=chunks)
