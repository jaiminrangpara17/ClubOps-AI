"""Deterministic grounding validator for Sprint 8: AI Communication Services."""

from __future__ import annotations

import re
from typing import Any

from app.core.exceptions import CommunicationValidationError
from app.schemas.communication import (
    AnnouncementRequest,
    AnnouncementResult,
    BriefingRequest,
    DailyBriefing,
)
from app.validators.output_validator import validate_ai_output

STOPWORDS: set[str] = {
    "the",
    "a",
    "an",
    "is",
    "are",
    "and",
    "or",
    "to",
    "of",
    "for",
    "with",
    "on",
    "in",
    "at",
    "by",
    "from",
    "it",
    "this",
    "that",
    "was",
    "were",
    "be",
    "been",
    "as",
}

GENERIC_WORDS: set[str] = {
    "announcement",
    "announcements",
    "briefing",
    "briefings",
    "event",
    "events",
    "task",
    "tasks",
    "risk",
    "risks",
    "deadline",
    "deadlines",
    "meeting",
    "meetings",
    "update",
    "updates",
    "club",
    "clubs",
    "member",
    "members",
    "notice",
    "notices",
    "general",
    "urgent",
}


def normalize_text(text: str) -> str:
    """Normalize text by lowercasing, replacing punctuation with spaces, and collapsing spaces."""
    if not text:
        return ""
    lowered = text.lower()
    cleaned = re.sub(r"[^\w\s]", " ", lowered)
    return re.sub(r"\s+", " ", cleaned).strip()


def _extract_strings(val: Any) -> list[str]:
    """Recursively extract string values from nested dicts, lists, or primitives."""
    results: list[str] = []
    if val is None:
        return results
    if isinstance(val, str):
        cleaned = val.strip()
        if cleaned:
            results.append(cleaned)
    elif isinstance(val, dict):
        for k, v in val.items():
            results.append(str(k))
            results.extend(_extract_strings(v))
    elif isinstance(val, (list, tuple, set)):
        for item in val:
            results.extend(_extract_strings(item))
    else:
        results.append(str(val))
    return results


def extract_announcement_corpus(
    request: AnnouncementRequest,
) -> tuple[str, set[str], bool]:
    """Extract normalized text corpus, token set, and factual presence flag from request."""
    parts: list[str] = []

    if request.purpose:
        parts.append(request.purpose)
    if request.event_info:
        parts.append(request.event_info)
    if request.key_details:
        parts.extend(request.key_details)
    if request.audience:
        parts.append(request.audience)

    combined = " ".join(parts)
    norm_corpus = normalize_text(combined)
    tokens = set(norm_corpus.split())
    has_factual_details = bool(request.event_info or request.key_details)
    return norm_corpus, tokens, has_factual_details


def extract_briefing_corpus(request: BriefingRequest) -> tuple[str, set[str], bool]:
    """Extract normalized text corpus and token set from a BriefingRequest."""
    parts: list[str] = []

    if request.date:
        parts.append(request.date)
    if request.tasks:
        parts.extend(_extract_strings(request.tasks))
    if request.deadlines:
        parts.extend(_extract_strings(request.deadlines))
    if request.risks:
        parts.extend(_extract_strings(request.risks))
    if request.events:
        parts.extend(_extract_strings(request.events))
    if request.meetings:
        parts.extend(_extract_strings(request.meetings))
    if request.operational_context:
        parts.append(request.operational_context)

    has_context = bool(
        request.tasks
        or request.deadlines
        or request.risks
        or request.events
        or request.meetings
        or request.operational_context
    )

    combined = " ".join(parts)
    norm_corpus = normalize_text(combined)
    tokens = set(norm_corpus.split())
    return norm_corpus, tokens, has_context


def is_communication_grounded(
    claim_str: str,
    context_corpus: str,
    context_tokens: set[str],
) -> bool:
    """Determine if a claim or evidence string is grounded in the supplied context.

    Grounding rules:
    - Normalize casing and whitespace.
    - Exclude common stopwords.
    - A single generic word ('announcement', 'event', 'task', etc.) is NOT sufficient.
    - Must satisfy either:
      a) At least TWO distinct meaningful (non-generic) terms found in context, OR
      b) A substantial matching phrase (>=3 consecutive words or >=15 chars with non-generic term)
         from context.
    """
    if not claim_str or not claim_str.strip():
        return False

    claim_norm = normalize_text(claim_str)
    if not claim_norm:
        return False

    claim_tokens = claim_norm.split()
    meaningful = [t for t in claim_tokens if t not in STOPWORDS]
    if not meaningful:
        return False

    matching_tokens = {t for t in meaningful if t in context_tokens}
    if not matching_tokens:
        return False

    # Reject if only one generic token matches
    if matching_tokens.issubset(GENERIC_WORDS) and len(matching_tokens) <= 1:
        return False

    # Condition a: at least TWO distinct meaningful, non-generic terms
    meaningful_non_generic = [t for t in meaningful if t not in GENERIC_WORDS]
    matching_meaningful = {t for t in meaningful_non_generic if t in context_tokens}
    if len(matching_meaningful) >= 2:
        return True

    # Condition b: substantial matching phrase appearing verbatim in context
    if claim_norm in context_corpus:
        has_non_generic = any(t not in GENERIC_WORDS and t not in STOPWORDS for t in claim_tokens)
        if (len(claim_tokens) >= 3 or len(claim_norm) >= 15) and has_non_generic:
            return True

    # Check for contiguous sub-phrase of 3+ words
    if len(claim_tokens) >= 3:
        for i in range(len(claim_tokens) - 2):
            for j in range(i + 3, len(claim_tokens) + 1):
                sub = " ".join(claim_tokens[i:j])
                if sub in context_corpus:
                    sub_meaningful = [
                        t
                        for t in claim_tokens[i:j]
                        if t not in STOPWORDS and t not in GENERIC_WORDS
                    ]
                    if sub_meaningful:
                        return True

    return False


def validate_announcement_grounding(
    result: AnnouncementResult | dict[str, Any] | str,
    request: AnnouncementRequest,
) -> AnnouncementResult:
    """Validate that an AnnouncementResult is grounded in supplied request facts."""
    if isinstance(result, (dict, str)):
        parsed = validate_ai_output(result, AnnouncementResult)
    elif isinstance(result, AnnouncementResult):
        parsed = result
    else:
        raise CommunicationValidationError(
            f"Expected AnnouncementResult or dict/str, got {type(result).__name__}"
        )

    corpus, tokens, has_facts = extract_announcement_corpus(request)

    # If no factual details were supplied, the result must not claim grounded=True
    if not has_facts:
        if parsed.grounded:
            raise CommunicationValidationError(
                "Announcement is marked as grounded=true but no factual details were supplied."
            )
        for fact in parsed.used_facts:
            if not is_communication_grounded(fact, corpus, tokens):
                raise CommunicationValidationError(
                    f"Fabricated fact in announcement: '{fact}'. Not grounded in supplied context."
                )
        return parsed

    # Validate each used_fact
    for fact in parsed.used_facts:
        if not is_communication_grounded(fact, corpus, tokens):
            raise CommunicationValidationError(
                f"Fabricated fact in announcement: '{fact}'. Not grounded in supplied context."
            )

    if parsed.grounded and not parsed.used_facts:
        raise CommunicationValidationError(
            "Announcement is marked as grounded=true but contains no used_facts citations."
        )

    return parsed


def validate_briefing_grounding(
    result: DailyBriefing | dict[str, Any] | str,
    request: BriefingRequest,
) -> DailyBriefing:
    """Validate that a DailyBriefing is strictly grounded in supplied operational context."""
    if isinstance(result, (dict, str)):
        parsed = validate_ai_output(result, DailyBriefing)
    elif isinstance(result, DailyBriefing):
        parsed = result
    else:
        raise CommunicationValidationError(
            f"Expected DailyBriefing or dict/str, got {type(result).__name__}"
        )

    corpus, tokens, has_context = extract_briefing_corpus(request)

    # Validate evidence strings across all briefing items
    for item in parsed.items:
        for ev in item.evidence:
            if not is_communication_grounded(ev, corpus, tokens):
                raise CommunicationValidationError(
                    f"Fabricated evidence in briefing item '{item.title}': '{ev}'. "
                    "Evidence is not grounded in supplied context."
                )

    if parsed.grounded:
        has_evidence = any(bool(item.evidence) for item in parsed.items)
        if not has_context or not parsed.items or not has_evidence:
            raise CommunicationValidationError(
                "Daily briefing is marked as grounded=true but contains "
                "insufficient or no evidence."
            )

    return parsed
