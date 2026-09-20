"""Comprehensive test suite for Sprint 8: AI Communication Services."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock

import pytest
from app.core.exceptions import (
    CommunicationValidationError,
    MalformedAIOutputError,
)
from app.core.llm import LLMResponse, LLMService
from app.schemas.communication import (
    AnnouncementRequest,
    AnnouncementResult,
    BriefingItem,
    BriefingRequest,
    DailyBriefing,
)
from app.services.announcement_generator import AnnouncementGeneratorService
from app.services.daily_briefing import DailyBriefingService
from app.validators.communication_validator import (
    is_communication_grounded,
    validate_announcement_grounding,
    validate_briefing_grounding,
)
from pydantic import ValidationError


class TestAnnouncementSchemas:
    """Schema validation tests for Announcement models."""

    def test_valid_announcement_request(self) -> None:
        req = AnnouncementRequest(
            purpose="Notify members about the annual general meeting.",
            audience="All club members",
            event_info="Annual General Meeting 2026",
            key_details=["Date: November 15", "Location: Hall B", "Free refreshments provided"],
            tone="enthusiastic",
        )
        assert req.purpose == "Notify members about the annual general meeting."
        assert req.audience == "All club members"
        assert req.event_info == "Annual General Meeting 2026"
        assert len(req.key_details) == 3
        assert req.tone == "enthusiastic"

    def test_optional_fields_default_to_none(self) -> None:
        req = AnnouncementRequest(purpose="General club reminder")
        assert req.audience is None
        assert req.event_info is None
        assert req.key_details is None
        assert req.tone is None

    def test_empty_purpose_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AnnouncementRequest(purpose="")

        with pytest.raises(ValidationError):
            AnnouncementRequest(purpose="   ")

    def test_extra_fields_rejected_on_announcement_request(self) -> None:
        with pytest.raises(ValidationError):
            AnnouncementRequest(
                purpose="Test",
                unknown_field="invalid",  # type: ignore[call-arg]
            )

    def test_valid_announcement_result(self) -> None:
        res = AnnouncementResult(
            title="AGM is Here!",
            body="Join us on November 15 in Hall B for our annual general meeting.",
            audience="All club members",
            grounded=True,
            used_facts=["Date: November 15", "Location: Hall B"],
        )
        assert res.title == "AGM is Here!"
        assert res.grounded is True
        assert len(res.used_facts) == 2

    def test_extra_fields_rejected_on_announcement_result(self) -> None:
        with pytest.raises(ValidationError):
            AnnouncementResult(
                title="T",
                body="B",
                grounded=True,
                extra_data="rejected",  # type: ignore[call-arg]
            )


class TestDailyBriefingSchemas:
    """Schema validation tests for Daily Briefing models."""

    def test_valid_briefing_request(self) -> None:
        req = BriefingRequest(
            date="2026-10-15",
            tasks=[{"id": "t-1", "title": "Setup AV gear"}],
            deadlines=[{"item": "Venue deposit cutoff", "due": "2026-10-16"}],
            risks=[{"risk": "Pending sound engineer confirmation"}],
            events=[{"name": "Autumn Tech Talk"}],
            meetings=[{"summary": "Core team sync"}],
            operational_context="Main hall opens at 8am.",
        )
        assert req.date == "2026-10-15"
        assert len(req.tasks) == 1
        assert len(req.deadlines) == 1
        assert len(req.risks) == 1
        assert len(req.events) == 1
        assert len(req.meetings) == 1
        assert req.operational_context == "Main hall opens at 8am."

    def test_briefing_request_optional_fields_default_to_none(self) -> None:
        req = BriefingRequest(date="2026-10-15")
        assert req.tasks is None
        assert req.deadlines is None
        assert req.risks is None
        assert req.events is None
        assert req.meetings is None
        assert req.operational_context is None

    def test_empty_date_rejected(self) -> None:
        with pytest.raises(ValidationError):
            BriefingRequest(date="")

    def test_extra_fields_rejected_on_briefing_request(self) -> None:
        with pytest.raises(ValidationError):
            BriefingRequest(
                date="2026-10-15",
                unrecognized="illegal",  # type: ignore[call-arg]
            )

    def test_valid_briefing_item_and_daily_briefing(self) -> None:
        item = BriefingItem(
            category="deadline",
            title="Venue Deposit Due Tomorrow",
            summary="Payment must be submitted to secure Hall B.",
            evidence=["Venue deposit cutoff: 2026-10-16"],
        )
        briefing = DailyBriefing(
            date="2026-10-15",
            summary="Operations are on track with one approaching payment cutoff.",
            items=[item],
            grounded=True,
        )
        assert briefing.date == "2026-10-15"
        assert briefing.grounded is True
        assert len(briefing.items) == 1
        assert briefing.items[0].category == "deadline"

    def test_invalid_category_rejected(self) -> None:
        with pytest.raises(ValidationError):
            BriefingItem(
                category="unsupported_category",  # type: ignore[arg-type]
                title="T",
                summary="S",
            )

    def test_extra_fields_rejected_on_daily_briefing(self) -> None:
        with pytest.raises(ValidationError):
            DailyBriefing(
                date="2026-10-15",
                summary="Summary",
                grounded=True,
                unknown_extra="disallowed",  # type: ignore[call-arg]
            )


class TestGroundingLogic:
    """Tests for the deterministic grounding helper is_communication_grounded."""

    @pytest.fixture
    def sample_context(self) -> tuple[str, set[str]]:
        corpus = (
            "autumn robotics hackathon main auditorium 2026 registration deadline "
            "october 20 catering provided by campus dining"
        )
        tokens = set(corpus.split())
        return corpus, tokens

    def test_one_generic_matching_word_is_insufficient(
        self, sample_context: tuple[str, set[str]]
    ) -> None:
        corpus, tokens = sample_context
        # Only the generic word 'event' or 'deadline'
        assert not is_communication_grounded("deadline", corpus, tokens)
        assert not is_communication_grounded("an important deadline", corpus, tokens)

    def test_two_meaningful_matching_terms_accepted(
        self, sample_context: tuple[str, set[str]]
    ) -> None:
        corpus, tokens = sample_context
        # 'robotics' and 'auditorium' are both in context and non-generic
        claim = "The robotics session will occur in the auditorium."
        assert is_communication_grounded(claim, corpus, tokens)

    def test_substantial_exact_phrase_accepted(
        self, sample_context: tuple[str, set[str]]
    ) -> None:
        corpus, tokens = sample_context
        phrase = "catering provided by campus dining"
        assert is_communication_grounded(phrase, corpus, tokens)

    def test_hallucinated_evidence_rejected(
        self, sample_context: tuple[str, set[str]]
    ) -> None:
        corpus, tokens = sample_context
        fake_claim = "Keynote speech by Elon Musk about Mars colony."
        assert not is_communication_grounded(fake_claim, corpus, tokens)


class TestAnnouncementValidation:
    """Tests for validate_announcement_grounding."""

    @pytest.fixture
    def valid_request(self) -> AnnouncementRequest:
        return AnnouncementRequest(
            purpose="Promote the upcoming coding tournament.",
            event_info="Winter CodeSprint 2026",
            key_details=[
                "Date: December 5 at 10:00 AM",
                "Venue: Science Building Lab 3",
                "Cash prizes for top 3 teams",
            ],
            audience="Computer Science Students",
        )

    def test_valid_supplied_facts_accepted(self, valid_request: AnnouncementRequest) -> None:
        result = AnnouncementResult(
            title="Winter CodeSprint 2026 Registration Open!",
            body="Join us on December 5 in Science Building Lab 3 for our coding tournament.",
            audience="Computer Science Students",
            grounded=True,
            used_facts=[
                "Winter CodeSprint 2026",
                "Date: December 5 at 10:00 AM",
                "Venue: Science Building Lab 3",
            ],
        )
        validated = validate_announcement_grounding(result, request=valid_request)
        assert validated.grounded is True
        assert len(validated.used_facts) == 3

    def test_fabricated_fact_rejected(self, valid_request: AnnouncementRequest) -> None:
        result = AnnouncementResult(
            title="Winter CodeSprint 2026",
            body="Free laptops for every attendee!",
            grounded=True,
            used_facts=["Free brand new MacBook Pro for all participants"],
        )
        with pytest.raises(CommunicationValidationError, match="Fabricated fact"):
            validate_announcement_grounding(result, request=valid_request)

    def test_grounded_true_without_facts_rejected(
        self, valid_request: AnnouncementRequest
    ) -> None:
        result = AnnouncementResult(
            title="Winter CodeSprint 2026",
            body="Tournament details.",
            grounded=True,
            used_facts=[],
        )
        with pytest.raises(CommunicationValidationError, match="contains no used_facts"):
            validate_announcement_grounding(result, request=valid_request)

    def test_empty_details_request_cannot_claim_grounded(self) -> None:
        request = AnnouncementRequest(purpose="Random vague announcement")
        result = AnnouncementResult(
            title="General Notice",
            body="Please be advised.",
            grounded=True,
            used_facts=[],
        )
        with pytest.raises(CommunicationValidationError, match="no factual details were supplied"):
            validate_announcement_grounding(result, request=request)


class TestDailyBriefingValidation:
    """Tests for validate_briefing_grounding."""

    @pytest.fixture
    def valid_briefing_request(self) -> BriefingRequest:
        return BriefingRequest(
            date="2026-11-01",
            tasks=[{"id": "t-1", "title": "Audio setup", "status": "PENDING"}],
            deadlines=[{"milestone": "Catering deposit cutoff", "due_date": "2026-11-03"}],
            risks=[{"title": "Volunteer shortage for security"}],
        )

    def test_valid_evidence_accepted(self, valid_briefing_request: BriefingRequest) -> None:
        briefing = DailyBriefing(
            date="2026-11-01",
            summary="Upcoming audio preparations and catering deadline.",
            items=[
                BriefingItem(
                    category="deadline",
                    title="Catering Deposit Approaching",
                    summary="Deposit cutoff is approaching on November 3.",
                    evidence=["Catering deposit cutoff due 2026-11-03"],
                ),
                BriefingItem(
                    category="task",
                    title="Audio Setup Pending",
                    summary="Audio setup task is currently pending.",
                    evidence=["Audio setup status PENDING"],
                ),
            ],
            grounded=True,
        )
        validated = validate_briefing_grounding(briefing, request=valid_briefing_request)
        assert validated.grounded is True
        assert len(validated.items) == 2

    def test_fabricated_evidence_rejected(
        self, valid_briefing_request: BriefingRequest
    ) -> None:
        briefing = DailyBriefing(
            date="2026-11-01",
            summary="Emergency evacuation planned.",
            items=[
                BriefingItem(
                    category="urgent",
                    title="Evacuation Drill",
                    summary="Campus wide fire drill at noon.",
                    evidence=["Campus wide fire drill mandated by state governor"],
                )
            ],
            grounded=True,
        )
        with pytest.raises(CommunicationValidationError, match="Fabricated evidence"):
            validate_briefing_grounding(briefing, request=valid_briefing_request)

    def test_grounded_true_requires_evidence(
        self, valid_briefing_request: BriefingRequest
    ) -> None:
        briefing = DailyBriefing(
            date="2026-11-01",
            summary="Summary without evidence.",
            items=[
                BriefingItem(
                    category="general",
                    title="Routine day",
                    summary="All normal.",
                    evidence=[],
                )
            ],
            grounded=True,
        )
        with pytest.raises(
            CommunicationValidationError, match="insufficient or no evidence"
        ):
            validate_briefing_grounding(briefing, request=valid_briefing_request)

    def test_insufficient_context_handled_safely_when_grounded_false(self) -> None:
        empty_req = BriefingRequest(date="2026-11-01")
        briefing = DailyBriefing(
            date="2026-11-01",
            summary="No scheduled tasks or deadlines for today.",
            items=[],
            grounded=False,
        )
        validated = validate_briefing_grounding(briefing, request=empty_req)
        assert validated.grounded is False
        assert len(validated.items) == 0


class TestAnnouncementGeneratorService:
    """Service-level tests for AnnouncementGeneratorService."""

    @pytest.mark.asyncio
    async def test_valid_llm_output_produces_announcement(self) -> None:
        mock_llm = AsyncMock(spec=LLMService)
        llm_payload = {
            "title": "Hackathon 2026 is Here!",
            "body": "Hackathon 2026 takes place in the Main Hall on Oct 10.",
            "audience": "Club Members",
            "grounded": True,
            "used_facts": ["Hackathon 2026", "Main Hall", "Oct 10"],
        }
        mock_llm.generate_response.return_value = LLMResponse(
            text=json.dumps(llm_payload),
            model="gpt-4o-mini",
        )

        service = AnnouncementGeneratorService(llm_service=mock_llm)
        request = AnnouncementRequest(
            purpose="Invite members to hackathon",
            event_info="Hackathon 2026",
            key_details=["Venue: Main Hall", "Date: Oct 10"],
            audience="Club Members",
        )

        result = await service.generate(request)
        assert isinstance(result, AnnouncementResult)
        assert result.grounded is True
        assert result.title == "Hackathon 2026 is Here!"
        assert len(result.used_facts) == 3
        mock_llm.generate_response.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_malformed_llm_output_rejected(self) -> None:
        mock_llm = AsyncMock(spec=LLMService)
        mock_llm.generate_response.return_value = LLMResponse(
            text="Here is your announcement: It's going to be great!",
            model="gpt-4o-mini",
        )

        service = AnnouncementGeneratorService(llm_service=mock_llm)
        request = AnnouncementRequest(
            purpose="Invite members",
            key_details=["Oct 10"],
        )

        with pytest.raises(MalformedAIOutputError):
            await service.generate(request)

    @pytest.mark.asyncio
    async def test_missing_event_information_does_not_get_invented(self) -> None:
        mock_llm = AsyncMock(spec=LLMService)
        # LLM invents a registration fee and room number absent from request
        llm_payload = {
            "title": "Hackathon Info",
            "body": "Tickets are $50 in Room 404.",
            "audience": None,
            "grounded": True,
            "used_facts": ["Tickets cost $50 in Room 404"],
        }
        mock_llm.generate_response.return_value = LLMResponse(
            text=json.dumps(llm_payload),
            model="gpt-4o-mini",
        )

        service = AnnouncementGeneratorService(llm_service=mock_llm)
        request = AnnouncementRequest(
            purpose="Inform members about hackathon",
            event_info="Hackathon",
            key_details=["Date: Oct 10"],
        )

        with pytest.raises(CommunicationValidationError, match="Fabricated fact"):
            await service.generate(request)

    @pytest.mark.asyncio
    async def test_tone_changes_wording_only(self) -> None:
        mock_llm = AsyncMock(spec=LLMService)
        llm_payload = {
            "title": "URGENT: Workshop Today!",
            "body": "Please attend the Python Workshop in Lab 2 today at 3pm immediately.",
            "audience": "Members",
            "grounded": True,
            "used_facts": ["Python Workshop", "Lab 2 at 3pm"],
        }
        mock_llm.generate_response.return_value = LLMResponse(
            text=json.dumps(llm_payload),
            model="gpt-4o-mini",
        )

        service = AnnouncementGeneratorService(llm_service=mock_llm)
        request = AnnouncementRequest(
            purpose="Notify workshop",
            event_info="Python Workshop",
            key_details=["Lab 2 at 3pm"],
            tone="urgent",
        )

        result = await service.generate(request)
        assert result.grounded is True
        assert "URGENT" in result.title

    @pytest.mark.asyncio
    async def test_service_does_not_execute_or_publish_anything(self) -> None:
        service = AnnouncementGeneratorService(llm_service=AsyncMock(spec=LLMService))
        public_methods = [m for m in dir(service) if not m.startswith("_")]
        assert "generate" in public_methods
        assert not any(
            "publish" in m or "send" in m or "execute" in m or "broadcast" in m
            for m in public_methods
        )


class TestDailyBriefingService:
    """Service-level tests for DailyBriefingService."""

    @pytest.mark.asyncio
    async def test_valid_llm_output_produces_daily_briefing(self) -> None:
        mock_llm = AsyncMock(spec=LLMService)
        llm_payload = {
            "date": "2026-10-20",
            "summary": "1 pending task and 1 upcoming deadline today.",
            "items": [
                {
                    "category": "task",
                    "title": "Review Catering Contract",
                    "summary": "Catering contract is ready for final review.",
                    "evidence": ["Review Catering Contract status PENDING"],
                }
            ],
            "grounded": True,
        }
        mock_llm.generate_response.return_value = LLMResponse(
            text=json.dumps(llm_payload),
            model="gpt-4o-mini",
        )

        service = DailyBriefingService(llm_service=mock_llm)
        request = BriefingRequest(
            date="2026-10-20",
            tasks=[{"title": "Review Catering Contract", "status": "PENDING"}],
        )

        result = await service.generate(request)
        assert isinstance(result, DailyBriefing)
        assert result.grounded is True
        assert len(result.items) == 1
        assert result.items[0].category == "task"

    @pytest.mark.asyncio
    async def test_briefing_malformed_llm_output_rejected(self) -> None:
        mock_llm = AsyncMock(spec=LLMService)
        mock_llm.generate_response.return_value = LLMResponse(
            text="Here is your daily briefing in plain text!",
            model="gpt-4o-mini",
        )

        service = DailyBriefingService(llm_service=mock_llm)
        request = BriefingRequest(date="2026-10-20")

        with pytest.raises(MalformedAIOutputError):
            await service.generate(request)

    @pytest.mark.asyncio
    async def test_briefing_service_never_executes_actions(self) -> None:
        service = DailyBriefingService(llm_service=AsyncMock(spec=LLMService))
        public_methods = [m for m in dir(service) if not m.startswith("_")]
        assert "generate" in public_methods
        assert not any(
            "execute" in m or "mutate" in m or "run" in m or "action" in m
            for m in public_methods
        )
