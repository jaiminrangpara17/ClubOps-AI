"""Deterministic validator for Knowledge Assistant answers and source grounding."""

from __future__ import annotations

import re
from collections.abc import Sequence
from typing import Any

from app.core.exceptions import KnowledgeValidationError
from app.schemas.knowledge import KnowledgeAnswer, KnowledgeChunk
from app.validators.output_validator import validate_ai_output

_WORD_PATTERN = re.compile(r"\b[a-zA-Z0-9_\-]+\b")

_INSUFFICIENT_MARKERS = (
    "insufficient",
    "not found",
    "not available",
    "no information",
    "not mention",
    "cannot answer",
    "unable to answer",
    "not provide",
    "unspecified",
    "unknown",
    "not contain",
    "no club knowledge",
    "insufficient knowledge",
    "insufficient evidence",
)


def _normalize(text: str) -> str:
    """Normalize text by collapsing whitespace and lowercasing."""
    return " ".join(text.strip().lower().split())


def _tokenize(text: str) -> set[str]:
    """Extract set of lowercase alphanumeric tokens."""
    return {m.group(0).lower() for m in _WORD_PATTERN.finditer(text)}


def validate_knowledge_answer(
    answer: KnowledgeAnswer | dict[str, Any] | str,
    retrieved_chunks: Sequence[KnowledgeChunk],
) -> KnowledgeAnswer:
    """Validate that a KnowledgeAnswer is strictly grounded in retrieved chunks.

    Guarantees:
    1. Source Grounding: Every cited source must correspond to an actually retrieved chunk.
    2. Rejects fabricated document_id, chunk_id, title, or source text.
    3. If grounded=true, sources must not be empty and must all be verified.
    4. If grounded=false, answer text must indicate insufficient club knowledge.
    5. Purely deterministic validation with zero LLM calls.
    """
    if isinstance(answer, (dict, str)):
        parsed_answer = validate_ai_output(answer, KnowledgeAnswer)
    elif isinstance(answer, KnowledgeAnswer):
        parsed_answer = answer
    else:
        raise KnowledgeValidationError(
            f"Expected KnowledgeAnswer or dict/str, got {type(answer).__name__}"
        )

    retrieved_map: dict[str, KnowledgeChunk] = {
        chunk.chunk_id: chunk for chunk in retrieved_chunks
    }

    # Validate each cited source against actually retrieved chunks
    for source in parsed_answer.sources:
        if source.chunk_id not in retrieved_map:
            raise KnowledgeValidationError(
                f"Fabricated source chunk_id '{source.chunk_id}'. "
                "Chunk was not in retrieved context."
            )

        matched_chunk = retrieved_map[source.chunk_id]

        # Verify document_id matches
        if source.document_id.strip() != matched_chunk.document_id.strip():
            raise KnowledgeValidationError(
                f"Mismatched document_id '{source.document_id}' for chunk '{source.chunk_id}' "
                f"(expected '{matched_chunk.document_id}')."
            )

        # Verify title matches if present in chunk metadata
        expected_title = (matched_chunk.metadata or {}).get("title")
        if expected_title and source.title.strip().lower() != expected_title.strip().lower():
            raise KnowledgeValidationError(
                f"Mismatched title '{source.title}' for chunk '{source.chunk_id}' "
                f"(expected '{expected_title}')."
            )

        # Verify source text is present in the chunk text
        norm_source = _normalize(source.text)
        norm_chunk = _normalize(matched_chunk.text)

        if norm_source not in norm_chunk:
            # Check token overlap: must share at least 60% of source tokens with chunk
            source_tokens = _tokenize(source.text)
            chunk_tokens = _tokenize(matched_chunk.text)
            overlap = source_tokens.intersection(chunk_tokens)
            if not source_tokens or (len(overlap) / len(source_tokens)) < 0.6:
                raise KnowledgeValidationError(
                    f"Fabricated source text in citation for chunk '{source.chunk_id}'. "
                    f"Excerpt does not match the retrieved chunk content."
                )

    # Validate grounding status
    if parsed_answer.grounded:
        if not parsed_answer.sources:
            raise KnowledgeValidationError(
                "Answer is marked as grounded=true but cites no retrieved sources."
            )
    else:
        answer_lower = parsed_answer.answer.lower()
        if not any(marker in answer_lower for marker in _INSUFFICIENT_MARKERS):
            raise KnowledgeValidationError(
                "Answer is marked as grounded=false but does not indicate "
                "insufficient available club knowledge."
            )

    return parsed_answer
