"""HTTP Client for communicating with the ClubOps AI microservice (Sprint 9).

Provides robust synchronous and asynchronous clients (AIServiceClient and AsyncAIServiceClient)
to be used by backend services, Celery tasks, or external callers to consume AI capabilities.
"""

from __future__ import annotations

import os
from types import TracebackType
from typing import Any, TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from app.core.exceptions import (
    AIClientConnectionError,
    AIClientError,
    AIClientTimeoutError,
    AIClientValidationError,
    redact_secrets,
)
from app.schemas.action_engine import ActionEngineRequest, ActionProposalList
from app.schemas.communication import (
    AnnouncementRequest,
    AnnouncementResult,
    BriefingRequest,
    DailyBriefing,
)
from app.schemas.event import Event, EventPlanRequest
from app.schemas.knowledge import KnowledgeAnswer, KnowledgeQueryRequest
from app.schemas.meeting import MeetingResult
from app.schemas.meeting_intelligence import MeetingIntelligenceRequest
from app.schemas.risk_intelligence import (
    RiskAnalysisResult,
    RiskIntelligenceRequest,
)

T = TypeVar("T", bound=BaseModel)

DEFAULT_AI_SERVICE_URL = "http://localhost:8001"
DEFAULT_TIMEOUT_SECONDS = 30.0


def _dump_payload(payload: BaseModel | dict[str, Any]) -> dict[str, Any]:
    """Ensure payload is serializable dictionary."""
    if isinstance(payload, BaseModel):
        return payload.model_dump(mode="json")
    if isinstance(payload, dict):
        return payload
    raise AIClientValidationError(
        f"Expected BaseModel or dict payload, got {type(payload).__name__}"
    )


def _handle_response_error(response: httpx.Response, endpoint: str) -> None:
    """Evaluate response status and raise typed client error if status code >= 400."""
    if response.is_success:
        return
    text = redact_secrets(response.text)
    if response.status_code == 422:
        raise AIClientValidationError(
            f"Validation error calling {endpoint} (HTTP 422): {text}",
            detail=text,
        )
    if response.status_code == 504:
        raise AIClientTimeoutError(
            f"AI service call {endpoint} timed out (HTTP 504): {text}",
            detail=text,
        )
    if response.status_code == 503:
        raise AIClientConnectionError(
            f"AI service call {endpoint} unavailable (HTTP 503): {text}",
            detail=text,
        )
    raise AIClientError(
        f"AI service call {endpoint} failed (HTTP {response.status_code}): {text}",
        detail=text,
    )


def _parse_model(model_cls: type[T], data: Any, endpoint: str) -> T:
    """Validate and parse raw JSON into expected Pydantic model."""
    try:
        return model_cls.model_validate(data)
    except ValidationError as exc:
        raise AIClientValidationError(
            f"Failed to parse AI service response from {endpoint} into {model_cls.__name__}: {exc}"
        ) from exc


class AIServiceClient:
    """Synchronous HTTP client for interacting with the ClubOps AI microservice."""

    def __init__(
        self,
        base_url: str | None = None,
        timeout: float | None = None,
        client: httpx.Client | None = None,
    ) -> None:
        self.base_url = (
            base_url
            or os.getenv("AI_SERVICE_URL")
            or DEFAULT_AI_SERVICE_URL
        ).rstrip("/")
        timeout_val = timeout or float(os.getenv("AI_SERVICE_TIMEOUT") or DEFAULT_TIMEOUT_SECONDS)
        self._client = client or httpx.Client(base_url=self.base_url, timeout=timeout_val)
        self._owns_client = client is None

    def close(self) -> None:
        """Close underlying HTTP client."""
        if self._owns_client:
            self._client.close()

    def __enter__(self) -> AIServiceClient:
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        self.close()

    def _post(self, path: str, json_data: Any) -> Any:
        url = f"{self.base_url}{path}"
        try:
            response = self._client.post(url, json=json_data)
        except httpx.TimeoutException as exc:
            raise AIClientTimeoutError(
                f"Request to {url} timed out: {exc}"
            ) from exc
        except (httpx.ConnectError, httpx.NetworkError) as exc:
            raise AIClientConnectionError(
                f"Failed to reach AI service at {url}: {exc}"
            ) from exc
        except httpx.HTTPError as exc:
            raise AIClientError(
                f"Unexpected transport failure calling {url}: {exc}"
            ) from exc

        _handle_response_error(response, path)
        return response.json()

    def health(self) -> dict[str, Any]:
        """Check AI service health."""
        url = f"{self.base_url}/health"
        try:
            response = self._client.get(url)
        except httpx.TimeoutException as exc:
            raise AIClientTimeoutError(f"Health check timed out: {exc}") from exc
        except (httpx.ConnectError, httpx.NetworkError) as exc:
            raise AIClientConnectionError(f"Health check failed to connect: {exc}") from exc
        except httpx.HTTPError as exc:
            raise AIClientError(f"Health check transport error: {exc}") from exc

        _handle_response_error(response, "/health")
        return response.json()

    def plan_event(self, request: EventPlanRequest | dict[str, Any]) -> Event:
        """Request structured event plan."""
        data = self._post("/events/plan", _dump_payload(request))
        return _parse_model(Event, data, "/events/plan")

    def analyze_meeting(
        self, request: MeetingIntelligenceRequest | dict[str, Any]
    ) -> MeetingResult:
        """Analyze meeting transcript for structured outcomes."""
        data = self._post("/meetings/analyze", _dump_payload(request))
        return _parse_model(MeetingResult, data, "/meetings/analyze")

    def analyze_risks(
        self, request: RiskIntelligenceRequest | dict[str, Any]
    ) -> RiskAnalysisResult:
        """Analyze operational context for grounded risks."""
        data = self._post("/risks/analyze", _dump_payload(request))
        return _parse_model(RiskAnalysisResult, data, "/risks/analyze")

    def propose_actions(
        self, request: ActionEngineRequest | dict[str, Any]
    ) -> ActionProposalList:
        """Propose safe, typed action candidates."""
        data = self._post("/actions/propose", _dump_payload(request))
        return _parse_model(ActionProposalList, data, "/actions/propose")

    def query_knowledge(
        self, request: KnowledgeQueryRequest | dict[str, Any]
    ) -> KnowledgeAnswer:
        """Query club knowledge with strict source grounding."""
        data = self._post("/knowledge/query", _dump_payload(request))
        return _parse_model(KnowledgeAnswer, data, "/knowledge/query")

    def generate_announcement(
        self, request: AnnouncementRequest | dict[str, Any]
    ) -> AnnouncementResult:
        """Generate grounded draft announcement."""
        data = self._post("/announcements/generate", _dump_payload(request))
        return _parse_model(AnnouncementResult, data, "/announcements/generate")

    def generate_daily_briefing(
        self, request: BriefingRequest | dict[str, Any]
    ) -> DailyBriefing:
        """Generate grounded daily briefing."""
        data = self._post("/briefings/generate", _dump_payload(request))
        return _parse_model(DailyBriefing, data, "/briefings/generate")

    def validate_action(self, raw_action: dict[str, Any]) -> dict[str, Any]:
        """Validate an action dictionary against permitted schemas."""
        return self._post("/actions/validate", raw_action)

    def validate_action_batch(self, raw_actions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Validate a list of action dictionaries against permitted schemas."""
        return self._post("/actions/validate-batch", raw_actions)


class AsyncAIServiceClient:
    """Asynchronous HTTP client for interacting with the ClubOps AI microservice."""

    def __init__(
        self,
        base_url: str | None = None,
        timeout: float | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.base_url = (
            base_url
            or os.getenv("AI_SERVICE_URL")
            or DEFAULT_AI_SERVICE_URL
        ).rstrip("/")
        timeout_val = timeout or float(os.getenv("AI_SERVICE_TIMEOUT") or DEFAULT_TIMEOUT_SECONDS)
        self._client = client or httpx.AsyncClient(base_url=self.base_url, timeout=timeout_val)
        self._owns_client = client is None

    async def aclose(self) -> None:
        """Close underlying async HTTP client."""
        if self._owns_client:
            await self._client.aclose()

    async def __aenter__(self) -> AsyncAIServiceClient:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        await self.aclose()

    async def _post(self, path: str, json_data: Any) -> Any:
        url = f"{self.base_url}{path}"
        try:
            response = await self._client.post(url, json=json_data)
        except httpx.TimeoutException as exc:
            raise AIClientTimeoutError(
                f"Request to {url} timed out: {exc}"
            ) from exc
        except (httpx.ConnectError, httpx.NetworkError) as exc:
            raise AIClientConnectionError(
                f"Failed to reach AI service at {url}: {exc}"
            ) from exc
        except httpx.HTTPError as exc:
            raise AIClientError(
                f"Unexpected transport failure calling {url}: {exc}"
            ) from exc

        _handle_response_error(response, path)
        return response.json()

    async def health(self) -> dict[str, Any]:
        """Check AI service health."""
        url = f"{self.base_url}/health"
        try:
            response = await self._client.get(url)
        except httpx.TimeoutException as exc:
            raise AIClientTimeoutError(f"Health check timed out: {exc}") from exc
        except (httpx.ConnectError, httpx.NetworkError) as exc:
            raise AIClientConnectionError(f"Health check failed to connect: {exc}") from exc
        except httpx.HTTPError as exc:
            raise AIClientError(f"Health check transport error: {exc}") from exc

        _handle_response_error(response, "/health")
        return response.json()

    async def plan_event(self, request: EventPlanRequest | dict[str, Any]) -> Event:
        """Request structured event plan."""
        data = await self._post("/events/plan", _dump_payload(request))
        return _parse_model(Event, data, "/events/plan")

    async def analyze_meeting(
        self, request: MeetingIntelligenceRequest | dict[str, Any]
    ) -> MeetingResult:
        """Analyze meeting transcript for structured outcomes."""
        data = await self._post("/meetings/analyze", _dump_payload(request))
        return _parse_model(MeetingResult, data, "/meetings/analyze")

    async def analyze_risks(
        self, request: RiskIntelligenceRequest | dict[str, Any]
    ) -> RiskAnalysisResult:
        """Analyze operational context for grounded risks."""
        data = await self._post("/risks/analyze", _dump_payload(request))
        return _parse_model(RiskAnalysisResult, data, "/risks/analyze")

    async def propose_actions(
        self, request: ActionEngineRequest | dict[str, Any]
    ) -> ActionProposalList:
        """Propose safe, typed action candidates."""
        data = await self._post("/actions/propose", _dump_payload(request))
        return _parse_model(ActionProposalList, data, "/actions/propose")

    async def query_knowledge(
        self, request: KnowledgeQueryRequest | dict[str, Any]
    ) -> KnowledgeAnswer:
        """Query club knowledge with strict source grounding."""
        data = await self._post("/knowledge/query", _dump_payload(request))
        return _parse_model(KnowledgeAnswer, data, "/knowledge/query")

    async def generate_announcement(
        self, request: AnnouncementRequest | dict[str, Any]
    ) -> AnnouncementResult:
        """Generate grounded draft announcement."""
        data = await self._post("/announcements/generate", _dump_payload(request))
        return _parse_model(AnnouncementResult, data, "/announcements/generate")

    async def generate_daily_briefing(
        self, request: BriefingRequest | dict[str, Any]
    ) -> DailyBriefing:
        """Generate grounded daily briefing."""
        data = await self._post("/briefings/generate", _dump_payload(request))
        return _parse_model(DailyBriefing, data, "/briefings/generate")

    async def validate_action(self, raw_action: dict[str, Any]) -> dict[str, Any]:
        """Validate an action dictionary against permitted schemas."""
        return await self._post("/actions/validate", raw_action)

    async def validate_action_batch(
        self, raw_actions: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Validate a list of action dictionaries against permitted schemas."""
        return await self._post("/actions/validate-batch", raw_actions)
