"""Deterministic lexical retrieval for Knowledge Assistant."""

from __future__ import annotations

import math
import re
from collections import Counter

from app.schemas.knowledge import KnowledgeChunk

_WORD_PATTERN = re.compile(r"\b[a-zA-Z0-9_\-]+\b")


def _tokenize(text: str) -> list[str]:
    """Normalize case and tokenize text into lowercase word terms."""
    return [match.group(0).lower() for match in _WORD_PATTERN.finditer(text)]


class KnowledgeRetriever:
    """Deterministic lexical retriever using BM25 ranking over KnowledgeChunk collections.

    Guarantees:
    - Normalizes case and tokenizes text meaningfully.
    - Deterministic relevance scoring and tie-breaking.
    - Never fabricates chunks: returns only actually indexed KnowledgeChunk instances.
    - Returns an empty list when no relevant evidence is found.
    - Pure Python implementation with zero heavy external vector DB dependencies.
    """

    def __init__(self, chunks: list[KnowledgeChunk] | None = None) -> None:
        self._chunks: list[KnowledgeChunk] = []
        self._doc_tokens: list[list[str]] = []
        self._doc_freqs: dict[str, int] = {}
        self._avg_doc_len: float = 0.0
        self._k1: float = 1.5
        self._b: float = 0.75

        if chunks:
            self.index(chunks)

    def index(self, chunks: list[KnowledgeChunk]) -> None:
        """Index a list of KnowledgeChunk instances for lexical retrieval."""
        self._chunks = list(chunks)
        self._doc_tokens = [_tokenize(chunk.text) for chunk in self._chunks]

        # Calculate document frequencies
        doc_freqs: Counter[str] = Counter()
        total_len = 0
        for tokens in self._doc_tokens:
            total_len += len(tokens)
            unique_terms = set(tokens)
            doc_freqs.update(unique_terms)

        self._doc_freqs = dict(doc_freqs)
        self._avg_doc_len = (total_len / len(self._chunks)) if self._chunks else 0.0

    def search(self, query: str, top_k: int = 5) -> list[KnowledgeChunk]:
        """Retrieve up to top_k relevant chunks for the given query.

        Returns an empty list if query has no matching tokens or no chunks are indexed.
        """
        if top_k < 1:
            raise ValueError("top_k must be at least 1.")

        if not self._chunks:
            return []

        query_tokens = _tokenize(query)
        if not query_tokens:
            return []

        num_docs = len(self._chunks)
        scores: list[tuple[float, str, KnowledgeChunk]] = []

        for idx, chunk in enumerate(self._chunks):
            tokens = self._doc_tokens[idx]
            doc_len = len(tokens)
            if doc_len == 0:
                continue

            term_counts = Counter(tokens)
            score = 0.0

            for q_term in query_tokens:
                if q_term not in term_counts:
                    continue

                tf = term_counts[q_term]
                df = self._doc_freqs.get(q_term, 0)
                # Lucene/Okapi BM25 positive IDF formula
                idf = math.log(1.0 + (num_docs - df + 0.5) / (df + 0.5))
                len_norm = doc_len / (self._avg_doc_len or 1.0)
                denom = tf + self._k1 * (1.0 - self._b + self._b * len_norm)
                score += idf * ((tf * (self._k1 + 1.0)) / (denom or 1.0))

            if score > 0.0:
                # Store (-score, chunk_id, chunk) for deterministic descending sort
                scores.append((-score, chunk.chunk_id, chunk))

        if not scores:
            return []

        scores.sort(key=lambda item: (item[0], item[1]))
        return [item[2] for item in scores[:top_k]]
