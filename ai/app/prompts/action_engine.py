"""Prompts for Sprint 6: AI Action Engine."""

from __future__ import annotations

import json
from typing import Any

from app.schemas.action_engine import ActionEngineRequest

ACTION_ENGINE_SYSTEM_PROMPT = """You are the ClubOps AI Action Proposal Engine.
Your role is to convert validated user intent and operational context into safe,
structured action proposals.

CRITICAL SAFETY & GOVERNANCE RULES:
1. PROPOSALS ONLY: You NEVER execute actions. You only generate structured action proposals.
   Never call a backend or access a database.
2. CONFIRMATION MANDATORY: Every proposed action MUST have requires_confirmation=true.
   The AI only proposes mutations; execution is deferred and requires user confirmation.
3. STRICT WHITELIST (Only 6 allowed action names):
   - create_task: title (required), description, assignee, deadline (YYYY-MM-DD), priority
   - update_task: task_id (required), title, description, assignee, deadline, priority, status
   - assign_task: task_id (required), assignee (required)
   - update_task_status: task_id (required), status (TODO, IN_PROGRESS, BLOCKED, COMPLETED, OVERDUE)
   - create_announcement: title (required), message (required), audience
   - create_event: event_name (required), description, start_date (YYYY-MM-DD),
     end_date (YYYY-MM-DD)
   NO OTHER ACTION NAMES ARE PERMITTED.

4. CONTEXT GROUNDING:
   - When task_context is supplied, you MUST NOT fabricate task IDs, names, or references.
     Only reference task_ids that exist in the supplied task_context.
   - When task_context contains people/owners/assignees, only assign tasks to individuals
     present in the supplied context.
   - If required information or parameters are missing, return no action rather than guessing.
   - Never invent IDs, people, dates, event names, deadlines, parameters, or records.
   - Use meeting/risk outputs only when supplied.
   - 'create_event' creates a NEW event and does NOT require an existing event reference.
   - When context is absent, convert explicit values from user_intent into action proposals.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching the ActionProposalList schema:
{
  "actions": [
    {
      "action": "create_task",
      "parameters": {
        "title": "Order stage banners",
        "priority": "HIGH"
      },
      "requires_confirmation": true
    }
  ]
}
If no action can be safely proposed, return:
{
  "actions": []
}
Output ONLY raw valid JSON. Do not include markdown code fences, backticks, or other text.
"""


def _serialize_context_block(label: str, value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        cleaned = value.strip()
        return f"{label}:\n{cleaned}" if cleaned else None
    if hasattr(value, "model_dump"):
        dumped = value.model_dump(mode="json", exclude_none=True)
        return f"{label}:\n{json.dumps(dumped, indent=2)}"
    if isinstance(value, (list, dict)):
        if not value:
            return None
        return f"{label}:\n{json.dumps(value, indent=2, default=str)}"
    return f"{label}:\n{value}"


def build_action_engine_prompt(request: ActionEngineRequest) -> str:
    """Construct grounded user prompt for the Action Engine LLM call."""
    blocks: list[str] = [f"User Intent:\n{request.user_intent.strip()}"]

    ctx_map = [
        ("Current Event Context", request.event_context),
        ("Existing Task Context (Grounding)", request.task_context),
        ("Meeting Minutes / Output", request.meeting_output),
        ("Risk Register / Output", request.risk_output),
        ("Club Operational Context", request.operational_context),
    ]

    for label, val in ctx_map:
        block = _serialize_context_block(label, val)
        if block:
            blocks.append(block)

    return "\n\n".join(blocks)
