from abc import ABC, abstractmethod
import json
import os
from pathlib import Path
from typing import Any, Type, TypeVar
from dotenv import load_dotenv
from fastapi import HTTPException, status
import httpx
from pydantic import BaseModel, ValidationError

ENV_FILE = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(ENV_FILE)

T = TypeVar("T", bound=BaseModel)


class AIClient(ABC):
    @abstractmethod
    def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        """Generate a natural language text response."""
        pass

    @abstractmethod
    def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_model: Type[T],
    ) -> T:
        """Generate and validate a structured response against a Pydantic model."""
        pass


class OpenAIClient(AIClient):
    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str = "https://api.openai.com/v1",
        timeout: float = 30.0,
    ):
        self.api_key = api_key or os.getenv("AI_API_KEY")
        self.model = model or os.getenv("AI_MODEL", "gpt-4o-mini")
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _ensure_configured(self):
        if not self.api_key or not self.api_key.strip():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is currently unavailable or unconfigured",
            )

    def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        self._ensure_configured()
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(url, headers=headers, json=payload)
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="AI service request timed out",
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"AI service network failure: {str(exc)}",
            )

        if resp.status_code == 429:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="AI provider rate limit exceeded. Please try again later.",
            )
        if resp.status_code in (401, 403):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service authentication error with provider",
            )
        if resp.status_code >= 500:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Upstream AI provider error",
            )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI provider error ({resp.status_code})",
            )

        data = resp.json()
        try:
            return data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unexpected AI response format",
            )

    def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_model: Type[T],
    ) -> T:
        self._ensure_configured()
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": f"{system_prompt}\nYou MUST respond with valid JSON adhering to the expected schema.",
                },
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(url, headers=headers, json=payload)
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="AI service request timed out",
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"AI service network failure: {str(exc)}",
            )

        if resp.status_code == 429:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="AI provider rate limit exceeded. Please try again later.",
            )
        if resp.status_code in (401, 403):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service authentication error with provider",
            )
        if resp.status_code >= 500:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Upstream AI provider error",
            )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI provider error ({resp.status_code})",
            )

        data = resp.json()
        try:
            content_str = data["choices"][0]["message"]["content"]
            parsed_json = json.loads(content_str)
            return response_model.model_validate(parsed_json)
        except (KeyError, IndexError, json.JSONDecodeError, ValidationError) as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to validate AI structured response: {str(exc)}",
            )


class MockAIClient(AIClient):
    """Deterministic Mock AI Client for unit testing and offline development."""

    def __init__(
        self,
        custom_text_response: str | None = None,
        custom_structured_response: Any | None = None,
        simulate_rate_limit: bool = False,
        simulate_timeout: bool = False,
        simulate_unconfigured: bool = False,
        simulate_malformed: bool = False,
    ):
        self.custom_text_response = custom_text_response
        self.custom_structured_response = custom_structured_response
        self.simulate_rate_limit = simulate_rate_limit
        self.simulate_timeout = simulate_timeout
        self.simulate_unconfigured = simulate_unconfigured
        self.simulate_malformed = simulate_malformed

    def _check_simulated_errors(self):
        if self.simulate_unconfigured:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is currently unavailable or unconfigured",
            )
        if self.simulate_rate_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="AI provider rate limit exceeded. Please try again later.",
            )
        if self.simulate_timeout:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="AI service request timed out",
            )
        if self.simulate_malformed:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to validate AI structured response: Malformed output",
            )

    def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        self._check_simulated_errors()
        if self.custom_text_response is not None:
            return self.custom_text_response

        # Default intelligent response generation based on prompt context
        if "events" in user_prompt.lower() or "scheduled" in user_prompt.lower():
            return "Based on your club data, here are the upcoming and scheduled events."
        if "member" in user_prompt.lower():
            return "Based on your club records, here are the current member details."
        if "attendance" in user_prompt.lower():
            return "Attendance records indicate active participation across scheduled events."
        return "I have reviewed your club records and here is the operational summary."

    def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_model: Type[T],
    ) -> T:
        self._check_simulated_errors()
        if self.custom_structured_response is not None:
            if isinstance(self.custom_structured_response, response_model):
                return self.custom_structured_response
            if isinstance(self.custom_structured_response, dict):
                return response_model.model_validate(self.custom_structured_response)

        model_name = response_model.__name__

        if model_name == "EventPlanResponse":
            data = {
                "title": "Technology Workshop & Hackathon",
                "description": "An interactive hands-on workshop covering modern engineering practices.",
                "suggested_schedule": [
                    {"time": "09:00 - 10:00", "activity": "Registration & Keynote"},
                    {"time": "10:00 - 13:00", "activity": "Hands-on Coding Labs"},
                    {"time": "13:00 - 14:00", "activity": "Networking Lunch"},
                    {"time": "14:00 - 16:30", "activity": "Project Presentations & Wrap-up"},
                ],
                "audience": "Club members and aspiring developers (approx. 50 participants)",
                "tasks": [
                    "Book computer lab venue",
                    "Distribute workshop prerequisites to attendees",
                    "Order catering and refreshments",
                    "Prepare certificates of participation",
                ],
                "resources": [
                    "High-speed Wi-Fi and power strips",
                    "Projector and AV equipment",
                    "Name badges and handouts",
                ],
                "risks": [
                    "Wi-Fi connectivity drop during lab session",
                    "Last-minute participant drop-offs",
                ],
                "follow_up_actions": [
                    "Send feedback survey to all attendees",
                    "Publish workshop code repository",
                ],
            }
            return response_model.model_validate(data)

        if model_name == "ActionValidationResponse":
            data = {
                "valid": True,
                "reason": "The proposed action complies with club rules and timeline constraints.",
                "risk": None,
                "suggested_correction": None,
            }
            return response_model.model_validate(data)

        if model_name == "MeetingIntelligenceResponse":
            data = {
                "summary": "The executive committee discussed upcoming workshops, budget allocation, and volunteer recruitment.",
                "decisions": [
                    "Approved $500 budget for technology workshop catering.",
                    "Set event date for next Saturday at 10:00 AM.",
                ],
                "action_items": [
                    {
                        "title": "Finalize venue booking",
                        "description": "Reserve computer lab 3B with campus facilities.",
                        "owner": "Sarah Chen",
                        "due_date": "2026-10-01",
                        "priority": "high",
                        "source": "meeting transcript",
                    },
                    {
                        "title": "Send reminder email",
                        "description": "Draft and dispatch reminder to all active members.",
                        "owner": "Alex Rivera",
                        "due_date": "2026-10-03",
                        "priority": "medium",
                        "source": "meeting transcript",
                    },
                ],
                "risks": ["Potential room conflict with athletics department"],
                "follow_up": ["Review registration counts at Wednesday standup"],
            }
            return response_model.model_validate(data)

        if model_name == "AIInsightResponse":
            data = {
                "club_id": 1,
                "metrics": [],
                "insights": [
                    "Member attendance has increased by 15% across recent workshops.",
                    "3 inactive members have not attended the last 2 events.",
                ],
                "recommendations": [
                    "Schedule early morning reminder notices to improve turnout.",
                    "Conduct a 1-on-1 check-in with inactive members.",
                ],
            }
            return response_model.model_validate(data)

        # Generic fallback
        return response_model.model_validate({})


def get_ai_client() -> AIClient:
    """FastAPI dependency for obtaining the configured AI client."""
    api_key = os.getenv("AI_API_KEY")
    if not api_key or not api_key.strip():
        # Raise 503 if real client requested but unconfigured
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is currently unavailable or unconfigured",
        )
    return OpenAIClient(api_key=api_key)
