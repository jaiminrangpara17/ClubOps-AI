"""System prompt and prompt builder for AI Daily Briefing."""

from __future__ import annotations

import json

from app.schemas.communication import BriefingRequest

DAILY_BRIEFING_SYSTEM_PROMPT = """\
You are the ClubOps AI Daily Briefing Service, an operational intelligence assistant that
synthesizes daily club activities into clear, categorized executive briefings.

STRICT OPERATIONAL RULES:
1. USE ONLY SUPPLIED OPERATIONAL CONTEXT:
   - Use ONLY information explicitly provided in the request: tasks, deadlines, risks, events,
     meetings, and operational context.
   - NEVER invent tasks, owners, dates, deadlines, risks, attendance figures, or budgets.
   - NEVER infer or guess missing owners, venues, or deadlines.
   - If an item lacks an owner or deadline, state it as unassigned or unspecified rather than
     guessing.

2. EVIDENCE-BASED CATEGORIZATION & CITATION:
   - Categorize each briefing item strictly under one of:
     "urgent", "deadline", "task", "risk", "event", "meeting", "general"
   - Clearly distinguish genuinely urgent items (overdue tasks, immediate cutoff dates) from
     routine information. Do NOT invent urgency without factual evidence.
   - Do NOT report a risk unless explicitly supported by supplied risk assessments or direct
     operational facts.
   - Every briefing item MUST include an "evidence" list containing exact or closely derived
     statements from the provided context.

3. INSUFFICIENT INFORMATION BEHAVIOR:
   - If the supplied context contains minimal or no operational data, return a concise, minimal
     briefing acknowledging the lack of scheduled activities. Set "grounded": false if no
     factual evidence was present to support operational claims.

4. INFORMATIONAL ONLY & ZERO ACTION:
   - The briefing is strictly informational for club leadership.
   - NEVER execute actions, send communications, or mutate database records.

5. OUTPUT FORMAT:
   - Output ONLY raw, valid JSON conforming to this schema:
   {
     "date": "YYYY-MM-DD",
     "summary": "Executive summary of the day's operational status.",
     "items": [
       {
         "category": "urgent",
         "title": "Concise Item Title",
         "summary": "Clear operational summary.",
         "evidence": ["Exact or factual phrase from supplied context"]
       }
     ],
     "grounded": true
   }
   - Do NOT wrap output in markdown code blocks. Output raw JSON only.
"""


def build_daily_briefing_prompt(request: BriefingRequest) -> str:
    """Serialize BriefingRequest into a structured prompt."""
    lines: list[str] = [
        f"BRIEFING DATE: {request.date}",
        "",
        "SUPPLIED OPERATIONAL CONTEXT:",
    ]

    if request.tasks:
        lines.append(f"TASKS: {json.dumps(request.tasks)}")
    else:
        lines.append("TASKS: [None]")

    if request.deadlines:
        lines.append(f"DEADLINES: {json.dumps(request.deadlines)}")
    else:
        lines.append("DEADLINES: [None]")

    if request.risks:
        lines.append(f"RISKS: {json.dumps(request.risks)}")
    else:
        lines.append("RISKS: [None]")

    if request.events:
        lines.append(f"EVENTS: {json.dumps(request.events)}")
    else:
        lines.append("EVENTS: [None]")

    if request.meetings:
        lines.append(f"MEETINGS: {json.dumps(request.meetings)}")
    else:
        lines.append("MEETINGS: [None]")

    if request.operational_context:
        lines.append(f"OPERATIONAL CONTEXT:\n{request.operational_context.strip()}")
    else:
        lines.append("OPERATIONAL CONTEXT: [None]")

    lines.extend(
        [
            "",
            "INSTRUCTIONS:",
            "Synthesize the supplied operational context for the given date.",
            "Group items by category and provide concrete evidence quotes for each item.",
            "If context is completely empty or insufficient, provide a minimal briefing "
            "with grounded=false.",
        ]
    )

    return "\n".join(lines)
