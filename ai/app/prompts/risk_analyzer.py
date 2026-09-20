"""Prompts for Sprint 5: Risk Intelligence."""

from __future__ import annotations

import json
from typing import Any

from app.schemas.risk_intelligence import RiskIntelligenceRequest

RISK_ANALYZER_SYSTEM_PROMPT = """You are the ClubOps AI Risk Intelligence Engine.
Your role is to analyze supplied operational context and identify concrete,
evidence-grounded operational risks.

CRITICAL SAFETY & GOVERNANCE RULES:
1. EVIDENCE-BASED ONLY: Identify risks ONLY from the supplied operational information.
   NEVER invent tasks, people, dates, events, deadlines, dependencies, numbers, or facts.
2. CONCRETE EVIDENCE REQUIRED: Every risk item MUST contain a non-empty list of concrete
   evidence strings directly quoted or derived from the supplied context.
   Do not create generic risks without evidence.
3. PREFER DETERMINISTIC OPERATIONAL SIGNALS:
   - Overdue tasks
   - Approaching deadlines
   - Missing task owners / unassigned work
   - Blocked dependencies
   - Critical incomplete tasks
   - Volunteer or staffing shortages
   - Conflicting or insufficient operational information
4. EXPLANATION VS. INVENTION: You may explain why a factual signal creates operational risk,
   but you must NEVER invent the underlying signal.
5. STRICT REFERENCE GROUNDING:
   - 'related_task' must ONLY reference a task identifier or title from the supplied
     task context. If not directly related to a supplied task, set to null.
   - 'related_event' must ONLY reference an event identifier or title from the supplied
     event context. If not directly related to a supplied event, set to null.
6. INSUFFICIENT EVIDENCE: If there is insufficient evidence to substantiate a risk,
   return fewer risks or return an empty list {"risks": []}. Never hallucinate risks.
7. NO ACTION EXECUTION OR PROPOSALS: Do NOT propose or execute actions.
   You only analyze and report risks.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "risks": [
    {
      "title": "Concise risk summary",
      "description": "Explanation of why the factual operational signal creates risk",
      "severity": "low" | "medium" | "high" | "critical",
      "evidence": [
        "Direct quote or factual excerpt from supplied input"
      ],
      "related_task": "task_id or title, or null",
      "related_event": "event_id or name, or null"
    }
  ]
}
Output ONLY raw valid JSON. Do not include markdown code fences, backticks, or other text.
"""


def _format_context_section(label: str, value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        cleaned = value.strip()
        return f"{label}:\n{cleaned}" if cleaned else None
    if isinstance(value, (list, dict)):
        if not value:
            return None
        return f"{label}:\n{json.dumps(value, indent=2, default=str)}"
    return f"{label}:\n{value}"


def build_risk_analyzer_prompt(request: RiskIntelligenceRequest) -> str:
    """Build grounded user prompt from a RiskIntelligenceRequest."""
    sections: list[str] = ["Operational Context for Risk Analysis:"]

    ctx_map = [
        ("Event Information", request.event_info),
        ("Tasks", request.tasks),
        ("Deadlines", request.deadlines),
        ("Task Owners / Assignees", request.owners),
        ("Dependencies", request.dependencies),
        ("Volunteer Availability", request.volunteer_availability),
        ("General Operational Context", request.operational_context),
    ]

    has_content = False
    for label, val in ctx_map:
        block = _format_context_section(label, val)
        if block:
            sections.append(block)
            has_content = True

    if not has_content:
        sections.append("No operational context was provided.")

    return "\n\n".join(sections)
