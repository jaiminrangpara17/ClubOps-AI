"""Deterministic text chunking for Knowledge Assistant documents."""

from __future__ import annotations

from typing import Any

from app.schemas.knowledge import KnowledgeChunk, KnowledgeDocument


def chunk_document(
    document: KnowledgeDocument,
    chunk_size: int = 500,
    overlap: int = 50,
) -> list[KnowledgeChunk]:
    """Deterministically chunk a KnowledgeDocument into KnowledgeChunk instances.

    Guarantees:
    - Deterministic output: Identical inputs produce identical chunk sequences.
    - Preserves document_id and attaches title/metadata to chunk metadata.
    - Never silently discards meaningful content.
    - Handles short documents (single chunk) and empty/whitespace content (returns empty list).
    - Lightweight, pure-Python implementation without external dependencies or LLMs.
    """
    if chunk_size < 1:
        raise ValueError("chunk_size must be at least 1.")
    if overlap < 0:
        raise ValueError("overlap must be non-negative.")
    if overlap >= chunk_size:
        raise ValueError("overlap must be strictly less than chunk_size.")

    content = document.content.strip()
    if not content:
        return []

    base_metadata: dict[str, Any] = dict(document.metadata or {})
    base_metadata["title"] = document.title

    if len(content) <= chunk_size:
        return [
            KnowledgeChunk(
                chunk_id=f"{document.document_id}-chunk-1",
                document_id=document.document_id,
                text=content,
                metadata=base_metadata,
            )
        ]

    step = max(1, chunk_size - overlap)
    chunks: list[KnowledgeChunk] = []
    start = 0
    chunk_index = 1

    while start < len(content):
        end = min(start + chunk_size, len(content))

        # Attempt to split on word or newline boundary if not at the document boundary
        if end < len(content):
            space_boundary = content.rfind(" ", start + (step // 2), end)
            newline_boundary = content.rfind("\n", start + (step // 2), end)
            boundary = max(space_boundary, newline_boundary)
            if boundary > start:
                end = boundary

        chunk_text = content[start:end].strip()
        if chunk_text:
            chunks.append(
                KnowledgeChunk(
                    chunk_id=f"{document.document_id}-chunk-{chunk_index}",
                    document_id=document.document_id,
                    text=chunk_text,
                    metadata=dict(base_metadata),
                )
            )
            chunk_index += 1

        if end >= len(content):
            break

        next_start = end - overlap
        if next_start <= start:
            next_start = start + step
        start = next_start

    return chunks
