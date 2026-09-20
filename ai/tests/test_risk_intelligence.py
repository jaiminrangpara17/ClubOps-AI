"""Comprehensive test suite for Sprint 5: Risk Intelligence."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock

import pytest
from app.core.exceptions import MalformedAIOutputError, RiskValidationError
from app.core.llm import LLMResponse, LLMService
from app.schemas.risk_intelligence import (
    RiskAnalysisResult,
    RiskIntelligenceRequest,
    RiskItem,
)
from app.services.risk_intelligence import RiskIntelligenceService
from app.validators.risk_validator import (
    validate_risk_grounding,
    validate_risk_item,
)
from pydantic import ValidationError


class TestRiskIntelligenceSchema:
    def test_valid_request(self) -> None:
        """Verify that a fully populated request is parsed validly."""
        req = RiskIntelligenceRequest(
            event_info="Annual Tech Symposium 2026",
            tasks=[{"id": "t-1", "title": "Book Venue", "status": "IN_PROGRESS"}],
            deadlines=[{"milestone": "Venue deposit", "due_date": "2026-04-01"}],
            owners=[{"name": "Alice", "role": "Logistics Lead"}],
            dependencies=[{"task_id": "t-2", "depends_on": "t-1"}],
            volunteer_availability="Only 3 volunteers confirmed for Saturday shift",
            operational_context="Venue requires full payment 14 days before event",
        )
        assert req.event_info == "Annual Tech Symposium 2026"
        assert len(req.tasks) == 1
        assert req.tasks[0]["id"] == "t-1"
        assert req.volunteer_availability == "Only 3 volunteers confirmed for Saturday shift"

    def test_optional_null_fields(self) -> None:
        """Verify that all fields in RiskIntelligenceRequest are optional and default to None."""
        req = RiskIntelligenceRequest()
        assert req.event_info is None
        assert req.tasks is None
        assert req.deadlines is None
        assert req.owners is None
        assert req.dependencies is None
        assert req.volunteer_availability is None
        assert req.operational_context is None

        # Explicit None is also valid
        req_explicit_none = RiskIntelligenceRequest(
            event_info=None,
            tasks=None,
            deadlines=None,
            owners=None,
            dependencies=None,
            volunteer_availability=None,
            operational_context=None,
        )
        assert req_explicit_none.event_info is None

    def test_extra_fields_rejected_request(self) -> None:
        """Verify that unknown fields are strictly forbidden on RiskIntelligenceRequest."""
        with pytest.raises(ValidationError):
            RiskIntelligenceRequest.model_validate(
                {"event_info": "Gala", "unauthorized_field": "injected"}
            )

    def test_valid_risk_item(self) -> None:
        """Verify that a valid RiskItem can be instantiated with valid severity."""
        item = RiskItem(
            title="Venue deposit overdue",
            description="The venue may be lost if deposit is not paid.",
            severity="high",
            evidence=["Venue requires full payment 14 days before event"],
            related_task="t-1",
            related_event="Annual Tech Symposium 2026",
        )
        assert item.title == "Venue deposit overdue"
        assert item.severity == "high"
        assert len(item.evidence) == 1
        assert item.related_task == "t-1"

    def test_extra_fields_rejected_risk_item(self) -> None:
        """Verify that extra fields are forbidden on RiskItem."""
        with pytest.raises(ValidationError):
            RiskItem.model_validate(
                {
                    "title": "Missing lead",
                    "description": "No one assigned to catering",
                    "severity": "medium",
                    "evidence": ["No catering lead"],
                    "arbitrary_output_field": 123,
                }
            )

    def test_invalid_severity_rejected(self) -> None:
        """Verify that invalid severity levels are rejected by schema."""
        for bad_sev in ["apocalyptic", "urgent", "catastrophic", "LOW", ""]:
            with pytest.raises(ValidationError):
                RiskItem(
                    title="Risk title",
                    description="Risk desc",
                    severity=bad_sev,  # type: ignore
                    evidence=["Some factual evidence"],
                )

    def test_required_fields_enforced(self) -> None:
        """Verify that required fields on RiskItem cannot be omitted."""
        with pytest.raises(ValidationError):
            # Missing description and severity
            RiskItem.model_validate(
                {"title": "Only title", "evidence": ["Some evidence"]}
            )

    def test_risk_analysis_result_schema(self) -> None:
        """Verify RiskAnalysisResult schema and extra field forbid."""
        res = RiskAnalysisResult(risks=[])
        assert len(res.risks) == 0

        with pytest.raises(ValidationError):
            RiskAnalysisResult.model_validate({"risks": [], "hacked": True})


class TestRiskGroundingValidator:
    def test_evidence_with_only_one_generic_matching_word_is_rejected(self) -> None:
        """Verify that evidence with only one generic word ('deadline') is rejected."""
        request = RiskIntelligenceRequest(
            operational_context="The project has a strict deadline for submission."
        )
        risk = RiskItem(
            title="Approaching date",
            description="Operational risk due to timeline",
            severity="medium",
            evidence=["deadline"],  # Only one generic word
        )

        with pytest.raises(RiskValidationError, match="not grounded in supplied context"):
            validate_risk_item(risk, request)

        # Also test with stopword + generic word: "The deadline"
        risk_stopword_generic = RiskItem(
            title="Approaching date",
            description="Operational risk due to timeline",
            severity="medium",
            evidence=["The deadline"],
        )
        with pytest.raises(RiskValidationError, match="not grounded in supplied context"):
            validate_risk_item(risk_stopword_generic, request)

    def test_evidence_with_two_meaningful_matching_terms_is_accepted(self) -> None:
        """Verify that evidence containing at least two distinct meaningful terms is accepted."""
        request = RiskIntelligenceRequest(
            operational_context="The catering vendor sent an invoice and payment is overdue."
        )
        risk = RiskItem(
            title="Vendor payment issue",
            description="The catering vendor may refuse service if invoice is unpaid",
            severity="high",
            evidence=["catering payment"],  # "catering" and "payment" both exist in context
        )

        validated = validate_risk_item(risk, request)
        assert validated.title == "Vendor payment issue"

    def test_substantial_exact_phrase_is_accepted(self) -> None:
        """Verify that a substantial matching phrase from context is accepted."""
        request = RiskIntelligenceRequest(
            operational_context=(
                "Sound equipment delivery is delayed by 3 days due to transit breakdown."
            )
        )
        risk = RiskItem(
            title="Audio equipment delay",
            description="Event stage cannot be set up on time",
            severity="critical",
            evidence=["Sound equipment delivery is delayed"],
        )

        validated = validate_risk_item(risk, request)
        assert validated.severity == "critical"

    def test_hallucinated_evidence_is_rejected(self) -> None:
        """Verify that completely hallucinated evidence is rejected."""
        request = RiskIntelligenceRequest(
            operational_context="Catering is confirmed for 100 people at the main hall."
        )
        risk = RiskItem(
            title="DJ missing",
            description="No DJ available for afterparty",
            severity="high",
            evidence=["DJ cancelled due to sudden illness"],  # Not in context
        )

        with pytest.raises(RiskValidationError, match="not grounded in supplied context"):
            validate_risk_item(risk, request)

    def test_fabricated_related_task_is_rejected(self) -> None:
        """Verify that non-existent task reference is rejected when task context exists."""
        request = RiskIntelligenceRequest(
            tasks=[{"id": "t-101", "title": "Set up registration desk"}],
            operational_context="Registration desk setup is behind schedule.",
        )
        risk = RiskItem(
            title="Registration delay",
            description="Attendees will wait in long lines",
            severity="medium",
            evidence=["Registration desk setup is behind schedule"],
            related_task="t-999",  # Fabricated task id
        )

        with pytest.raises(RiskValidationError, match="Fabricated task reference 't-999'"):
            validate_risk_item(risk, request)

    def test_valid_related_task_is_accepted(self) -> None:
        """Verify that referencing an existing task from task context is accepted."""
        request = RiskIntelligenceRequest(
            tasks=[{"id": "t-101", "title": "Set up registration desk"}],
            operational_context="Registration desk setup is behind schedule.",
        )
        risk = RiskItem(
            title="Registration delay",
            description="Attendees will wait in long lines",
            severity="medium",
            evidence=["Registration desk setup is behind schedule"],
            related_task="t-101",
        )

        validated = validate_risk_item(risk, request)
        assert validated.related_task == "t-101"

    def test_fabricated_related_event_is_rejected(self) -> None:
        """Verify that ungrounded event reference is rejected when event context exists."""
        request = RiskIntelligenceRequest(
            event_info="Annual Tech Symposium 2026",
            operational_context=(
                "Keynote speaker has not confirmed attendance for Annual Tech Symposium."
            ),
        )
        risk = RiskItem(
            title="Speaker missing",
            description="Keynote speech cannot proceed without confirmed speaker",
            severity="high",
            evidence=["Keynote speaker has not confirmed attendance"],
            related_event="Charity Gala",  # Fabricated event
        )

        with pytest.raises(RiskValidationError, match="Fabricated event reference 'Charity Gala'"):
            validate_risk_item(risk, request)

    def test_valid_related_event_is_accepted(self) -> None:
        """Verify that referencing the supplied event is accepted."""
        request = RiskIntelligenceRequest(
            event_info="Annual Tech Symposium 2026",
            operational_context=(
                "Keynote speaker has not confirmed attendance for Annual Tech Symposium 2026."
            ),
        )
        risk = RiskItem(
            title="Speaker missing",
            description="Keynote speech cannot proceed without confirmed speaker",
            severity="high",
            evidence=["Keynote speaker has not confirmed attendance"],
            related_event="Annual Tech Symposium 2026",
        )

        validated = validate_risk_item(risk, request)
        assert validated.related_event == "Annual Tech Symposium 2026"

    def test_empty_or_insufficient_evidence_does_not_pass(self) -> None:
        """Verify that empty or whitespace-only evidence raises validation errors."""
        request = RiskIntelligenceRequest(
            operational_context="Venue security requires background checks."
        )

        # Empty evidence list
        risk_empty = RiskItem(
            title="Security requirement",
            description="Guard staff must pass background checks",
            severity="medium",
            evidence=[],
        )
        with pytest.raises(RiskValidationError, match="contains empty evidence"):
            validate_risk_item(risk_empty, request)

        # Whitespace-only evidence
        risk_whitespace = RiskItem(
            title="Security requirement",
            description="Guard staff must pass background checks",
            severity="medium",
            evidence=["   "],
        )
        with pytest.raises(RiskValidationError, match="not grounded"):
            validate_risk_item(risk_whitespace, request)

        # Stopwords only
        risk_stopwords = RiskItem(
            title="Security requirement",
            description="Guard staff must pass background checks",
            severity="medium",
            evidence=["the and of with on"],
        )
        with pytest.raises(RiskValidationError, match="not grounded"):
            validate_risk_item(risk_stopwords, request)

    def test_case_and_formatting_insensitivity(self) -> None:
        """Verify that casing differences do not cause false rejections."""
        request = RiskIntelligenceRequest(
            operational_context="LIGHTING RIG RENTAL IS NOT CONFIRMED BY SUPPLIER",
            tasks=[{"id": "TASK-50", "title": "Lighting Rig Rental"}],
        )
        risk = RiskItem(
            title="Lighting rig uncertainty",
            description="Stage lighting may not be available",
            severity="high",
            evidence=["lighting rig rental is not confirmed"],
            related_task="task-50",
        )

        validated = validate_risk_item(risk, request)
        assert validated.title == "Lighting rig uncertainty"

    def test_grounding_not_required_when_context_absent(self) -> None:
        """Verify that absent context fields (tasks=None, event_info=None) do not reject risks."""
        request = RiskIntelligenceRequest(
            operational_context="Volunteer shortage noted across all stations.",
            tasks=None,
            event_info=None,
        )
        risk = RiskItem(
            title="Volunteer shortage",
            description="Stations will be unmanned",
            severity="high",
            evidence=["Volunteer shortage noted across all stations"],
            related_task=None,
            related_event=None,
        )

        result = validate_risk_grounding(RiskAnalysisResult(risks=[risk]), request)
        assert len(result.risks) == 1


class TestRiskIntelligenceService:
    @pytest.mark.asyncio
    async def test_valid_structured_llm_output(self) -> None:
        """Verify that valid structured LLM output is parsed and grounded end-to-end."""
        mock_llm = AsyncMock(spec=LLMService)
        llm_payload = {
            "risks": [
                {
                    "title": "Audio delivery delay",
                    "description": "Sound equipment delay will impact event start time.",
                    "severity": "high",
                    "evidence": ["Sound equipment delivery is delayed by 3 days"],
                    "related_task": "t-10",
                    "related_event": "Hackathon 2026",
                }
            ]
        }
        mock_llm.generate_response.return_value = LLMResponse(
            text=json.dumps(llm_payload),
            model="gpt-4o-mini",
        )

        service = RiskIntelligenceService(llm_service=mock_llm)
        request = RiskIntelligenceRequest(
            event_info="Hackathon 2026",
            tasks=[{"id": "t-10", "title": "Audio setup"}],
            operational_context=(
                "Sound equipment delivery is delayed by 3 days due to shipping issues."
            ),
        )

        result = await service.analyze_risks(request)
        assert isinstance(result, RiskAnalysisResult)
        assert len(result.risks) == 1
        assert result.risks[0].title == "Audio delivery delay"
        assert result.risks[0].severity == "high"
        assert result.risks[0].related_task == "t-10"

    @pytest.mark.asyncio
    async def test_malformed_llm_output_rejected(self) -> None:
        """Verify that non-JSON output from LLM raises MalformedAIOutputError."""
        mock_llm = AsyncMock(spec=LLMService)
        mock_llm.generate_response.return_value = LLMResponse(
            text="Here are the risks: 1. Vendor is late. 2. Weather is bad.",
            model="gpt-4o-mini",
        )

        service = RiskIntelligenceService(llm_service=mock_llm)
        request = RiskIntelligenceRequest(operational_context="Vendor is late.")

        with pytest.raises(MalformedAIOutputError):
            await service.analyze_risks(request)

    @pytest.mark.asyncio
    async def test_validation_failure_handled_correctly(self) -> None:
        """Verify that hallucinated evidence returned by LLM triggers RiskValidationError."""
        mock_llm = AsyncMock(spec=LLMService)
        llm_payload = {
            "risks": [
                {
                    "title": "Hallucinated risk",
                    "description": "Risk made up out of thin air",
                    "severity": "low",
                    "evidence": ["Alien spaceship landed on the football field"],
                    "related_task": None,
                    "related_event": None,
                }
            ]
        }
        mock_llm.generate_response.return_value = LLMResponse(
            text=json.dumps(llm_payload),
            model="gpt-4o-mini",
        )

        service = RiskIntelligenceService(llm_service=mock_llm)
        request = RiskIntelligenceRequest(
            operational_context="Football tournament scheduled for 2pm Saturday."
        )

        with pytest.raises(RiskValidationError, match="not grounded in supplied context"):
            await service.analyze_risks(request)

    @pytest.mark.asyncio
    async def test_service_does_not_execute_actions(self) -> None:
        """Verify that RiskIntelligenceService only returns result and executes zero actions."""
        service = RiskIntelligenceService(llm_service=AsyncMock(spec=LLMService))

        # Check methods on service
        method_names = [m for m in dir(service) if not m.startswith("_")]
        assert "analyze_risks" in method_names
        # Service has no mutation or execution methods
        assert not any("execute" in m or "mutate" in m or "write" in m for m in method_names)

    @pytest.mark.asyncio
    async def test_service_uses_existing_llm_abstraction(self) -> None:
        """Verify that RiskIntelligenceService calls LLMService.generate_response."""
        mock_llm = AsyncMock(spec=LLMService)
        mock_llm.generate_response.return_value = LLMResponse(
            text=json.dumps({"risks": []}),
            model="gpt-4o-mini",
        )

        service = RiskIntelligenceService(llm_service=mock_llm)
        request = RiskIntelligenceRequest(operational_context="All quiet.")

        result = await service.analyze_risks(request)
        assert isinstance(result, RiskAnalysisResult)
        assert len(result.risks) == 0
        mock_llm.generate_response.assert_awaited_once()
