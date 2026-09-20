"""Comprehensive test suite for Sprint 7: Knowledge Assistant / RAG."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock

import pytest
from app.core.exceptions import (
    KnowledgeValidationError,
    MalformedAIOutputError,
)
from app.core.llm import LLMResponse, LLMService
from app.knowledge.chunker import chunk_document
from app.knowledge.retriever import KnowledgeRetriever
from app.schemas.knowledge import (
    KnowledgeAnswer,
    KnowledgeChunk,
    KnowledgeDocument,
    KnowledgeQueryRequest,
    KnowledgeSource,
)
from app.services.knowledge_assistant import (
    INSUFFICIENT_KNOWLEDGE_MESSAGE,
    KnowledgeAssistantService,
)
from app.validators.knowledge_validator import validate_knowledge_answer
from pydantic import ValidationError


class TestKnowledgeSchemas:
    """Schema validation tests for Knowledge models."""

    def test_valid_document(self) -> None:
        doc = KnowledgeDocument(
            document_id="doc-101",
            title="Club Constitution",
            content="Article 1: The club shall be governed by an elected executive board.",
            metadata={"department": "Governance", "year": 2026},
        )
        assert doc.document_id == "doc-101"
        assert doc.title == "Club Constitution"
        assert "Article 1" in doc.content
        assert doc.metadata == {"department": "Governance", "year": 2026}

    def test_valid_chunk(self) -> None:
        chunk = KnowledgeChunk(
            chunk_id="chunk-1",
            document_id="doc-101",
            text="Article 1: Executive board.",
            metadata={"title": "Club Constitution"},
        )
        assert chunk.chunk_id == "chunk-1"
        assert chunk.document_id == "doc-101"
        assert chunk.text == "Article 1: Executive board."

    def test_valid_query(self) -> None:
        query = KnowledgeQueryRequest(query="What is the refund policy?", top_k=3)
        assert query.query == "What is the refund policy?"
        assert query.top_k == 3

    def test_empty_query_rejected(self) -> None:
        with pytest.raises(ValidationError):
            KnowledgeQueryRequest(query="")

        with pytest.raises(ValidationError):
            KnowledgeQueryRequest(query="   ")

    def test_invalid_top_k_rejected(self) -> None:
        with pytest.raises(ValidationError):
            KnowledgeQueryRequest(query="Valid query", top_k=0)

        with pytest.raises(ValidationError):
            KnowledgeQueryRequest(query="Valid query", top_k=-2)

    def test_extra_fields_rejected(self) -> None:
        with pytest.raises(ValidationError):
            KnowledgeDocument(
                document_id="d-1",
                title="T",
                content="C",
                unknown_extra_field="rejected",  # type: ignore[call-arg]
            )

        with pytest.raises(ValidationError):
            KnowledgeQueryRequest(
                query="Valid",
                unrecognized="illegal",  # type: ignore[call-arg]
            )

        with pytest.raises(ValidationError):
            KnowledgeAnswer(
                answer="A",
                grounded=True,
                extra_param="illegal",  # type: ignore[call-arg]
            )


class TestKnowledgeChunker:
    """Tests for deterministic text chunking."""

    def test_short_document(self) -> None:
        doc = KnowledgeDocument(
            document_id="doc-short",
            title="Short Policy",
            content="Venue bookings require 7 days advance notice.",
            metadata={"priority": "high"},
        )
        chunks = chunk_document(doc, chunk_size=200, overlap=20)
        assert len(chunks) == 1
        assert chunks[0].chunk_id == "doc-short-chunk-1"
        assert chunks[0].document_id == "doc-short"
        assert chunks[0].text == "Venue bookings require 7 days advance notice."
        assert chunks[0].metadata["title"] == "Short Policy"
        assert chunks[0].metadata["priority"] == "high"

    def test_long_document(self) -> None:
        paragraphs = [
            f"Section {i}: Important club rule number {i} regarding operational conduct."
            for i in range(1, 20)
        ]
        content = "\n\n".join(paragraphs)
        doc = KnowledgeDocument(
            document_id="doc-long",
            title="Comprehensive Handbook",
            content=content,
        )
        chunks = chunk_document(doc, chunk_size=250, overlap=50)
        assert len(chunks) > 1
        # Verify all chunks have non-empty text and correct document_id
        for chunk in chunks:
            assert chunk.document_id == "doc-long"
            assert len(chunk.text) > 0
            assert chunk.metadata["title"] == "Comprehensive Handbook"

    def test_overlap_behavior(self) -> None:
        text = (
            "Alpha Bravo Charlie Delta Echo Foxtrot Golf Hotel "
            "India Juliet Kilo Lima Mike November"
        )
        doc = KnowledgeDocument(document_id="doc-overlap", title="Phonetic", content=text)
        chunks = chunk_document(doc, chunk_size=35, overlap=10)
        assert len(chunks) >= 2
        # Check that adjacent chunks share overlapping terms
        c1_tokens = set(chunks[0].text.split())
        c2_tokens = set(chunks[1].text.split())
        assert len(c1_tokens.intersection(c2_tokens)) > 0

    def test_metadata_preserved(self) -> None:
        doc = KnowledgeDocument(
            document_id="doc-meta",
            title="Equipment Guidelines",
            content="Store audio cables in cabinet B.",
            metadata={"author": "Tech Lead", "version": 2},
        )
        chunks = chunk_document(doc)
        assert len(chunks) == 1
        assert chunks[0].metadata["author"] == "Tech Lead"
        assert chunks[0].metadata["version"] == 2
        assert chunks[0].metadata["title"] == "Equipment Guidelines"

    def test_document_id_preserved(self) -> None:
        doc = KnowledgeDocument(
            document_id="custom-uuid-42",
            title="Notice",
            content="All club members must sign the register.",
        )
        chunks = chunk_document(doc)
        assert chunks[0].document_id == "custom-uuid-42"
        assert chunks[0].chunk_id.startswith("custom-uuid-42")

    def test_empty_content_handled(self) -> None:
        doc_empty = KnowledgeDocument(document_id="d-empty", title="Empty", content="")
        assert chunk_document(doc_empty) == []

        doc_spaces = KnowledgeDocument(document_id="d-spaces", title="Spaces", content="   \n\t  ")
        assert chunk_document(doc_spaces) == []

    def test_deterministic_output(self) -> None:
        doc = KnowledgeDocument(
            document_id="doc-det",
            title="Deterministic Test",
            content=(
                "This is sentence one. This is sentence two. "
                "This is sentence three. This is sentence four."
            ),
        )
        run_1 = chunk_document(doc, chunk_size=40, overlap=10)
        run_2 = chunk_document(doc, chunk_size=40, overlap=10)
        assert [c.model_dump() for c in run_1] == [c.model_dump() for c in run_2]

    def test_invalid_chunk_arguments(self) -> None:
        doc = KnowledgeDocument(document_id="d", title="T", content="Content")
        with pytest.raises(ValueError, match="chunk_size must be at least 1"):
            chunk_document(doc, chunk_size=0)

        with pytest.raises(ValueError, match="overlap must be non-negative"):
            chunk_document(doc, chunk_size=100, overlap=-5)

        with pytest.raises(ValueError, match="strictly less than chunk_size"):
            chunk_document(doc, chunk_size=50, overlap=50)


class TestKnowledgeRetriever:
    """Tests for deterministic lexical retrieval."""

    @pytest.fixture
    def sample_chunks(self) -> list[KnowledgeChunk]:
        return [
            KnowledgeChunk(
                chunk_id="chunk-finance",
                document_id="doc-finance",
                text=(
                    "Reimbursement requests must be submitted within 14 days "
                    "with original receipts."
                ),
                metadata={"title": "Finance Policy"},
            ),
            KnowledgeChunk(
                chunk_id="chunk-venue",
                document_id="doc-venue",
                text=(
                    "Auditorium bookings require advisor approval and "
                    "security staff confirmation."
                ),
                metadata={"title": "Venue Booking"},
            ),
            KnowledgeChunk(
                chunk_id="chunk-tech",
                document_id="doc-tech",
                text="Microphones, projectors, and audio mixers are stored in room 204.",
                metadata={"title": "AV Tech Equipment"},
            ),
        ]

    def test_relevant_chunk_retrieved(self, sample_chunks: list[KnowledgeChunk]) -> None:
        retriever = KnowledgeRetriever(sample_chunks)
        results = retriever.search("How do I get reimbursement for receipts?", top_k=2)
        assert len(results) >= 1
        assert results[0].chunk_id == "chunk-finance"
        assert "Reimbursement" in results[0].text

    def test_irrelevant_chunk_excluded_or_ranked_lower(
        self, sample_chunks: list[KnowledgeChunk]
    ) -> None:
        retriever = KnowledgeRetriever(sample_chunks)
        results = retriever.search("auditorium booking advisor approval", top_k=3)
        assert len(results) >= 1
        assert results[0].chunk_id == "chunk-venue"
        # Finance chunk has zero overlap with auditorium/advisor/approval and should not be first
        if len(results) > 1:
            assert results[0].chunk_id != "chunk-finance"

    def test_case_normalization_works(self, sample_chunks: list[KnowledgeChunk]) -> None:
        retriever = KnowledgeRetriever(sample_chunks)
        res_lower = retriever.search("microphones and projectors", top_k=1)
        res_upper = retriever.search("MICROPHONES AND PROJECTORS", top_k=1)
        assert len(res_lower) == 1
        assert len(res_upper) == 1
        assert res_lower[0].chunk_id == res_upper[0].chunk_id == "chunk-tech"

    def test_top_k_respected(self, sample_chunks: list[KnowledgeChunk]) -> None:
        retriever = KnowledgeRetriever(sample_chunks)
        results = retriever.search("club policy receipts approval", top_k=1)
        assert len(results) <= 1

    def test_empty_result_when_no_evidence_exists(
        self, sample_chunks: list[KnowledgeChunk]
    ) -> None:
        retriever = KnowledgeRetriever(sample_chunks)
        results = retriever.search("quantum teleportation interstellar rocket", top_k=5)
        assert results == []

    def test_empty_retriever(self) -> None:
        retriever = KnowledgeRetriever()
        assert retriever.search("anything", top_k=5) == []

    def test_deterministic_ranking(self, sample_chunks: list[KnowledgeChunk]) -> None:
        retriever = KnowledgeRetriever(sample_chunks)
        res1 = [c.chunk_id for c in retriever.search("reimbursement receipts", top_k=3)]
        res2 = [c.chunk_id for c in retriever.search("reimbursement receipts", top_k=3)]
        assert res1 == res2


class TestKnowledgeValidator:
    """Tests for deterministic source validation and grounding checks."""

    @pytest.fixture
    def retrieved_chunks(self) -> list[KnowledgeChunk]:
        return [
            KnowledgeChunk(
                chunk_id="chunk-1",
                document_id="doc-rules",
                text="The annual general meeting must be held in November.",
                metadata={"title": "Club Bylaws"},
            ),
            KnowledgeChunk(
                chunk_id="chunk-2",
                document_id="doc-catering",
                text="Food orders require 48 hours notice before delivery.",
                metadata={"title": "Catering Guide"},
            ),
        ]

    def test_valid_source_accepted(self, retrieved_chunks: list[KnowledgeChunk]) -> None:
        answer = KnowledgeAnswer(
            answer="The annual general meeting must take place in November.",
            sources=[
                KnowledgeSource(
                    document_id="doc-rules",
                    title="Club Bylaws",
                    chunk_id="chunk-1",
                    text="The annual general meeting must be held in November.",
                )
            ],
            grounded=True,
        )
        validated = validate_knowledge_answer(answer, retrieved_chunks=retrieved_chunks)
        assert validated.grounded is True
        assert len(validated.sources) == 1

    def test_fabricated_chunk_id_rejected(self, retrieved_chunks: list[KnowledgeChunk]) -> None:
        answer = KnowledgeAnswer(
            answer="Meetings are held in November.",
            sources=[
                KnowledgeSource(
                    document_id="doc-rules",
                    title="Club Bylaws",
                    chunk_id="chunk-fabricated-999",
                    text="The annual general meeting must be held in November.",
                )
            ],
            grounded=True,
        )
        with pytest.raises(KnowledgeValidationError, match="Fabricated source chunk_id"):
            validate_knowledge_answer(answer, retrieved_chunks=retrieved_chunks)

    def test_fabricated_document_id_rejected(self, retrieved_chunks: list[KnowledgeChunk]) -> None:
        answer = KnowledgeAnswer(
            answer="Meetings are held in November.",
            sources=[
                KnowledgeSource(
                    document_id="doc-fake",
                    title="Club Bylaws",
                    chunk_id="chunk-1",
                    text="The annual general meeting must be held in November.",
                )
            ],
            grounded=True,
        )
        with pytest.raises(KnowledgeValidationError, match="Mismatched document_id"):
            validate_knowledge_answer(answer, retrieved_chunks=retrieved_chunks)

    def test_fabricated_title_rejected(self, retrieved_chunks: list[KnowledgeChunk]) -> None:
        answer = KnowledgeAnswer(
            answer="Meetings are held in November.",
            sources=[
                KnowledgeSource(
                    document_id="doc-rules",
                    title="Imaginary Handbook",
                    chunk_id="chunk-1",
                    text="The annual general meeting must be held in November.",
                )
            ],
            grounded=True,
        )
        with pytest.raises(KnowledgeValidationError, match="Mismatched title"):
            validate_knowledge_answer(answer, retrieved_chunks=retrieved_chunks)

    def test_fabricated_source_text_rejected(self, retrieved_chunks: list[KnowledgeChunk]) -> None:
        answer = KnowledgeAnswer(
            answer="Meetings are held in November.",
            sources=[
                KnowledgeSource(
                    document_id="doc-rules",
                    title="Club Bylaws",
                    chunk_id="chunk-1",
                    text="Every member gets a free luxury car and gold watch.",
                )
            ],
            grounded=True,
        )
        with pytest.raises(KnowledgeValidationError, match="Fabricated source text"):
            validate_knowledge_answer(answer, retrieved_chunks=retrieved_chunks)

    def test_grounded_true_without_sources_rejected(
        self, retrieved_chunks: list[KnowledgeChunk]
    ) -> None:
        answer = KnowledgeAnswer(
            answer="The meeting is in November.",
            sources=[],
            grounded=True,
        )
        with pytest.raises(
            KnowledgeValidationError, match="grounded=true but cites no retrieved sources"
        ):
            validate_knowledge_answer(answer, retrieved_chunks=retrieved_chunks)

    def test_grounded_false_without_insufficient_notice_rejected(
        self, retrieved_chunks: list[KnowledgeChunk]
    ) -> None:
        answer = KnowledgeAnswer(
            answer="The club was founded by Alexander the Great in 330 BC.",
            sources=[],
            grounded=False,
        )
        with pytest.raises(
            KnowledgeValidationError,
            match="does not indicate insufficient available club knowledge",
        ):
            validate_knowledge_answer(answer, retrieved_chunks=retrieved_chunks)

    def test_grounded_false_with_proper_insufficient_notice_accepted(
        self, retrieved_chunks: list[KnowledgeChunk]
    ) -> None:
        answer = KnowledgeAnswer(
            answer="The available club knowledge is insufficient to answer this query.",
            sources=[],
            grounded=False,
        )
        validated = validate_knowledge_answer(answer, retrieved_chunks=retrieved_chunks)
        assert validated.grounded is False
        assert validated.sources == []


class TestKnowledgeAssistantService:
    """Tests for KnowledgeAssistantService pipeline and anti-hallucination guarantees."""

    @pytest.mark.asyncio
    async def test_relevant_context_produces_grounded_answer(self) -> None:
        chunks = [
            KnowledgeChunk(
                chunk_id="chunk-10",
                document_id="doc-safety",
                text="First aid kits are located in the security office and student lounge.",
                metadata={"title": "Safety Procedures"},
            )
        ]
        retriever = KnowledgeRetriever(chunks)

        mock_llm = AsyncMock(spec=LLMService)
        llm_output = {
            "answer": "First aid kits are located in the security office and student lounge.",
            "sources": [
                {
                    "document_id": "doc-safety",
                    "title": "Safety Procedures",
                    "chunk_id": "chunk-10",
                    "text": "First aid kits are located in the security office and student lounge.",
                }
            ],
            "grounded": True,
        }
        mock_llm.generate_response.return_value = LLMResponse(
            text=json.dumps(llm_output),
            model="gpt-4o-mini",
        )

        service = KnowledgeAssistantService(retriever=retriever, llm_service=mock_llm)
        request = KnowledgeQueryRequest(query="Where are the first aid kits?", top_k=3)

        result = await service.answer(request)
        assert result.grounded is True
        assert len(result.sources) == 1
        assert result.sources[0].chunk_id == "chunk-10"
        assert "security office" in result.answer
        mock_llm.generate_response.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_no_relevant_context_produces_grounded_false_without_calling_llm(self) -> None:
        chunks = [
            KnowledgeChunk(
                chunk_id="chunk-chess",
                document_id="doc-chess",
                text="Chess club meets every Wednesday evening.",
                metadata={"title": "Chess Club"},
            )
        ]
        retriever = KnowledgeRetriever(chunks)

        mock_llm = AsyncMock(spec=LLMService)
        service = KnowledgeAssistantService(retriever=retriever, llm_service=mock_llm)

        # Query completely unrelated to chess
        request = KnowledgeQueryRequest(
            query="What is the budget for astronomy telescope?", top_k=3
        )

        result = await service.answer(request)
        assert result.grounded is False
        assert result.sources == []
        assert INSUFFICIENT_KNOWLEDGE_MESSAGE in result.answer
        # Anti-hallucination: LLM must NEVER be called when retrieval returns no context
        mock_llm.generate_response.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_llm_output_parsed_correctly(self) -> None:
        chunks = [
            KnowledgeChunk(
                chunk_id="c-1",
                document_id="d-1",
                text="Membership dues are $20 per semester.",
                metadata={"title": "Dues Policy"},
            )
        ]
        retriever = KnowledgeRetriever(chunks)

        mock_llm = AsyncMock(spec=LLMService)
        mock_llm.generate_response.return_value = LLMResponse(
            text=json.dumps(
                {
                    "answer": "Membership dues are $20 per semester.",
                    "sources": [
                        {
                            "document_id": "d-1",
                            "title": "Dues Policy",
                            "chunk_id": "c-1",
                            "text": "Membership dues are $20 per semester.",
                        }
                    ],
                    "grounded": True,
                }
            ),
            model="gpt-4o-mini",
        )

        service = KnowledgeAssistantService(retriever=retriever, llm_service=mock_llm)
        result = await service.answer(KnowledgeQueryRequest(query="How much are dues?"))
        assert isinstance(result, KnowledgeAnswer)
        assert result.grounded is True

    @pytest.mark.asyncio
    async def test_malformed_llm_output_rejected(self) -> None:
        chunks = [
            KnowledgeChunk(
                chunk_id="c-1",
                document_id="d-1",
                text="Elections take place in April.",
                metadata={"title": "Elections"},
            )
        ]
        retriever = KnowledgeRetriever(chunks)

        mock_llm = AsyncMock(spec=LLMService)
        mock_llm.generate_response.return_value = LLMResponse(
            text="Elections happen in April, but I'm not outputting JSON!",
            model="gpt-4o-mini",
        )

        service = KnowledgeAssistantService(retriever=retriever, llm_service=mock_llm)
        with pytest.raises(MalformedAIOutputError):
            await service.answer(KnowledgeQueryRequest(query="When are elections?"))

    @pytest.mark.asyncio
    async def test_fabricated_source_rejected_in_service(self) -> None:
        chunks = [
            KnowledgeChunk(
                chunk_id="c-real",
                document_id="d-real",
                text="The library opens at 8am.",
                metadata={"title": "Hours"},
            )
        ]
        retriever = KnowledgeRetriever(chunks)

        mock_llm = AsyncMock(spec=LLMService)
        # LLM attempts to cite an unretrieved chunk ID
        mock_llm.generate_response.return_value = LLMResponse(
            text=json.dumps(
                {
                    "answer": "Library opens at 8am.",
                    "sources": [
                        {
                            "document_id": "d-real",
                            "title": "Hours",
                            "chunk_id": "c-hallucinated-id",
                            "text": "The library opens at 8am.",
                        }
                    ],
                    "grounded": True,
                }
            ),
            model="gpt-4o-mini",
        )

        service = KnowledgeAssistantService(retriever=retriever, llm_service=mock_llm)
        with pytest.raises(KnowledgeValidationError, match="Fabricated source chunk_id"):
            await service.answer(KnowledgeQueryRequest(query="What time does library open?"))

    @pytest.mark.asyncio
    async def test_grounded_answer_requires_sources(self) -> None:
        chunks = [
            KnowledgeChunk(
                chunk_id="c-1",
                document_id="d-1",
                text="Keys must be returned by 5pm.",
                metadata={"title": "Keys"},
            )
        ]
        retriever = KnowledgeRetriever(chunks)

        mock_llm = AsyncMock(spec=LLMService)
        mock_llm.generate_response.return_value = LLMResponse(
            text=json.dumps(
                {
                    "answer": "Return keys by 5pm.",
                    "sources": [],
                    "grounded": True,
                }
            ),
            model="gpt-4o-mini",
        )

        service = KnowledgeAssistantService(retriever=retriever, llm_service=mock_llm)
        with pytest.raises(
            KnowledgeValidationError, match="grounded=true but cites no retrieved sources"
        ):
            await service.answer(KnowledgeQueryRequest(query="When to return keys?"))

    @pytest.mark.asyncio
    async def test_service_never_executes_actions(self) -> None:
        service = KnowledgeAssistantService(llm_service=AsyncMock(spec=LLMService))
        public_methods = [m for m in dir(service) if not m.startswith("_")]
        assert "answer" in public_methods
        assert not any(
            "execute" in m or "mutate" in m or "run" in m or "action" in m
            for m in public_methods
        )

    @pytest.mark.asyncio
    async def test_anti_hallucination_fact_absent_returns_insufficient(self) -> None:
        """Query asking for a fact absent from all documents results in insufficient knowledge."""
        doc = KnowledgeDocument(
            document_id="doc-wifi",
            title="WiFi Policy",
            content="Guest wifi network is CampusGuest. Password is not required.",
        )
        chunks = chunk_document(doc)
        retriever = KnowledgeRetriever(chunks)

        mock_llm = AsyncMock(spec=LLMService)
        service = KnowledgeAssistantService(retriever=retriever, llm_service=mock_llm)

        # Ask for something absent from doc (e.g. swimming pool hours)
        request = KnowledgeQueryRequest(query="What are the olympic swimming pool open hours?")
        result = await service.answer(request)

        assert result.grounded is False
        assert result.sources == []
        assert INSUFFICIENT_KNOWLEDGE_MESSAGE in result.answer
        mock_llm.generate_response.assert_not_awaited()
