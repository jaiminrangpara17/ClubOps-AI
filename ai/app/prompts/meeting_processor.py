"""Prompt construction for Meeting Intelligence."""

from __future__ import annotations

from app.schemas.meeting_intelligence import MeetingIntelligenceRequest


SYSTEM_PROMPT = """You are the ClubOps Meeting Intelligence processor. Your job is to extract structured, factual operational information from meeting transcripts.

STRICT RULES:
- Respond ONLY with a single JSON object matching the requested schema. No markdown, no prose, no explanations.
- NEVER invent owners, deadlines, dates, names, numbers, tasks, decisions, or risks.
- If information is not explicitly stated or reliably inferable, set the field to null.
- Only extract explicit action items. Do NOT convert suggestions, ideas, or general discussion into action items.
- Only create a risk if the transcript provides clear evidence or explicit mention of a threat/issue.
- Decisions must represent actual agreed-upon outcomes, not proposals or brainstorming.
- Preserve task dependencies only when explicitly stated.
- Priorities must be one of: LOW, MEDIUM, HIGH, CRITICAL. If unclear, use MEDIUM.
- Unknown values MUST remain null. Do not guess or fabricate."""


def build_meeting_prompt(request: MeetingIntelligenceRequest) -> str:
    metadata_parts: list[str] = []

    if request.meeting_title:
        metadata_parts.append(f"Meeting Title: {request.meeting_title}")

    if request.meeting_date:
        metadata_parts.append(f"Meeting Date: {request.meeting_date}")

    if request.participants:
        metadata_parts.append(f"Participants: {', '.join(request.participants)}")

    metadata = "\n".join(metadata_parts) + "\n" if metadata_parts else ""

    return f"""{metadata}TRANSCRIPT:
{request.transcript}

Extract the meeting summary, decisions, action items, and risks. Return valid JSON matching the schema."""
