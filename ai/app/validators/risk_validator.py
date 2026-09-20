"""Deterministic grounding validator for Sprint 5: Risk Intelligence."""

from __future__ import annotations

import re
from typing import Any

from app.core.exceptions import RiskValidationError
from app.schemas.risk_intelligence import (
    RiskAnalysisResult,
    RiskIntelligenceRequest,
    RiskItem,
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
    "deadline",
    "deadlines",
    "task",
    "tasks",
    "event",
    "events",
    "risk",
    "risks",
}


def normalize_text(text: str) -> str:
    """Normalize text by lowercasing, replacing punctuation with spaces, and collapsing spaces."""
    if not text:
        return ""
    lowered = text.lower()
    cleaned = re.sub(r"[^\w\s]", " ", lowered)
    return re.sub(r"\s+", " ", cleaned).strip()


def _extract_strings_from_structure(val: Any) -> list[str]:
    """Recursively extract string values from nested dicts, lists, or primitive types."""
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
            results.extend(_extract_strings_from_structure(v))
    elif isinstance(val, (list, tuple, set)):
        for item in val:
            results.extend(_extract_strings_from_structure(item))
    else:
        results.append(str(val))
    return results


def extract_context_corpus(request: RiskIntelligenceRequest) -> tuple[str, set[str]]:
    """Extract full normalized text corpus and token set from a RiskIntelligenceRequest."""
    parts: list[str] = []

    if request.event_info:
        parts.append(request.event_info)
    if request.tasks:
        parts.extend(_extract_strings_from_structure(request.tasks))
    if request.deadlines:
        parts.extend(_extract_strings_from_structure(request.deadlines))
    if request.owners:
        parts.extend(_extract_strings_from_structure(request.owners))
    if request.dependencies:
        parts.extend(_extract_strings_from_structure(request.dependencies))
    if request.volunteer_availability:
        parts.append(request.volunteer_availability)
    if request.operational_context:
        parts.append(request.operational_context)

    combined = " ".join(parts)
    norm_corpus = normalize_text(combined)
    tokens = set(norm_corpus.split())
    return norm_corpus, tokens


def extract_known_tasks(tasks: list[dict[str, Any]] | None) -> set[str] | None:
    """Extract normalized set of valid task identifiers and titles from task context."""
    if tasks is None:
        return None
    known: set[str] = set()
    for item in tasks:
        if isinstance(item, dict):
            for k in ("id", "task_id", "title", "name"):
                v = item.get(k)
                if v is not None:
                    norm = normalize_text(str(v))
                    if norm:
                        known.add(norm)
                        # Also add raw string lowered
                        known.add(str(v).strip().lower())
        elif isinstance(item, str):
            norm = normalize_text(item)
            if norm:
                known.add(norm)
                known.add(item.strip().lower())
    return known


def is_evidence_grounded(
    evidence_str: str,
    context_corpus: str,
    context_tokens: set[str],
) -> bool:
    """Determine if a single piece of evidence is grounded in the operational context.

    Grounding rules:
    - Normalize text case and whitespace.
    - Ignore generic stopwords.
    - Evidence must contain either:
      a) at least TWO distinct meaningful terms that can be found in supplied context, OR
      b) a substantial matching phrase from supplied context.
    - A single generic word ('deadline', 'task', 'event', 'risk') is NOT enough.
    """
    if not evidence_str or not evidence_str.strip():
        return False

    ev_norm = normalize_text(evidence_str)
    if not ev_norm:
        return False

    ev_tokens = ev_norm.split()

    # Filter out stopwords
    meaningful_in_ev = [t for t in ev_tokens if t not in STOPWORDS]
    if not meaningful_in_ev:
        return False

    # Check for single generic word match
    matching_tokens = {t for t in meaningful_in_ev if t in context_tokens}
    if not matching_tokens:
        return False

    if matching_tokens.issubset(GENERIC_WORDS) and len(matching_tokens) <= 1:
        return False

    # Condition a: At least TWO distinct meaningful terms found in context
    meaningful_non_generic = [t for t in meaningful_in_ev if t not in GENERIC_WORDS]
    matching_meaningful_terms = {t for t in meaningful_non_generic if t in context_tokens}
    if len(matching_meaningful_terms) >= 2:
        return True

    # Condition b: Substantial matching phrase from supplied context
    # (contiguous substring of >= 3 words or >= 15 chars, containing non-generic term)
    if ev_norm in context_corpus:
        has_non_generic = any(t not in GENERIC_WORDS and t not in STOPWORDS for t in ev_tokens)
        if (len(ev_tokens) >= 3 or len(ev_norm) >= 15) and has_non_generic:
            return True

    # Also check if a sub-phrase of >= 3 consecutive words in evidence appears in context
    if len(ev_tokens) >= 3:
        for i in range(len(ev_tokens) - 2):
            for j in range(i + 3, len(ev_tokens) + 1):
                sub_phrase = " ".join(ev_tokens[i:j])
                if sub_phrase in context_corpus:
                    sub_meaningful = [
                        t for t in ev_tokens[i:j] if t not in STOPWORDS and t not in GENERIC_WORDS
                    ]
                    if len(sub_meaningful) >= 1:
                        return True

    return False


def validate_risk_item(
    risk: RiskItem,
    request: RiskIntelligenceRequest,
) -> RiskItem:
    """Validate a single RiskItem for deterministic grounding and non-fabrication."""
    # 1. Evidence validation
    if not risk.evidence:
        msg = f"Risk '{risk.title}' contains empty evidence. Evidence is required."
        raise RiskValidationError(msg, detail=msg)

    context_corpus, context_tokens = extract_context_corpus(request)

    for ev in risk.evidence:
        if not is_evidence_grounded(ev, context_corpus, context_tokens):
            msg = f"Evidence '{ev}' for risk '{risk.title}' is not grounded in supplied context."
            raise RiskValidationError(msg, detail=msg)

    # 2. Related task grounding
    known_tasks = extract_known_tasks(request.tasks)
    if known_tasks is not None and risk.related_task:
        target_norm = normalize_text(risk.related_task)
        target_clean = risk.related_task.strip().lower()
        matched = (
            target_norm in known_tasks
            or target_clean in known_tasks
            or any(target_norm in k or k in target_norm for k in known_tasks if k)
        )
        if not matched:
            msg = (
                f"Fabricated task reference '{risk.related_task}': "
                f"task does not exist in supplied task context."
            )
            raise RiskValidationError(msg, detail=msg)

    # 3. Related event grounding
    if request.event_info is not None and request.event_info.strip() and risk.related_event:
        event_norm = normalize_text(request.event_info)
        target_event_norm = normalize_text(risk.related_event)
        target_event_clean = risk.related_event.strip().lower()
        matched = (
            target_event_norm in event_norm
            or target_event_clean in request.event_info.lower()
        )
        if not matched:
            msg = (
                f"Fabricated event reference '{risk.related_event}': "
                f"event does not exist in supplied event context."
            )
            raise RiskValidationError(msg, detail=msg)

    return risk


def validate_risk_grounding(
    result: RiskAnalysisResult | dict[str, Any] | str,
    request: RiskIntelligenceRequest,
) -> RiskAnalysisResult:
    """Deterministically validate all risks in result against supplied request context."""
    if isinstance(result, (str, dict)):
        parsed = validate_ai_output(result, RiskAnalysisResult)
    elif isinstance(result, RiskAnalysisResult):
        parsed = result
    else:
        msg = f"Unsupported result type for risk grounding: {type(result)}"
        raise RiskValidationError(msg, detail=msg)

    validated_risks = [validate_risk_item(item, request) for item in parsed.risks]
    return RiskAnalysisResult(risks=validated_risks)
