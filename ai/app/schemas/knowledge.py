"""Pydantic schemas for Sprint 7: Knowledge Assistant / RAG."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class KnowledgeDocument(BaseModel):
    """Raw input document representing a club operational record, guide, or policy."""

    document_id: str = Field(..., min_length=1, description="Unique identifier for the document.")
    title: str = Field(..., min_length=1, description="Descriptive title of the document.")
    content: str = Field(..., description="Full text content of the document.")
    metadata: dict[str, Any] | None = Field(
        default=None, description="Optional metadata key-value pairs."
    )

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class KnowledgeChunk(BaseModel):
    """Deterministic chunk of a KnowledgeDocument for indexing and retrieval."""

    chunk_id: str = Field(..., min_length=1, description="Unique identifier for the chunk.")
    document_id: str = Field(
        ..., min_length=1, description="Identifier of the source document."
    )
    text: str = Field(..., min_length=1, description="Chunk text content.")
    metadata: dict[str, Any] | None = Field(
        default=None, description="Metadata preserved or derived from source document."
    )

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class KnowledgeQueryRequest(BaseModel):
    """Query request for the Knowledge Assistant."""

    query: str = Field(..., min_length=1, description="User query or question to be answered.")
    top_k: int = Field(
        default=5, ge=1, description="Maximum number of relevant chunks to retrieve."
    )

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class KnowledgeSource(BaseModel):
    """Retrieved chunk citation supporting a factual answer."""

    document_id: str = Field(..., min_length=1, description="Identifier of the cited document.")
    title: str = Field(..., min_length=1, description="Title of the cited document.")
    chunk_id: str = Field(..., min_length=1, description="Identifier of the cited chunk.")
    text: str = Field(..., min_length=1, description="Source excerpt or context text.")

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class KnowledgeAnswer(BaseModel):
    """Grounded answer from the Knowledge Assistant with verified sources."""

    answer: str = Field(..., description="Answer text grounded in retrieved context.")
    sources: list[KnowledgeSource] = Field(
        default_factory=list, description="Verified citations from retrieved chunks."
    )
    grounded: bool = Field(
        ..., description="Whether the answer is grounded in retrieved club knowledge."
    )

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
