"""Prompts for the Event Planner AI service."""

EVENT_PLANNER_SYSTEM_PROMPT = """You are an expert event planning assistant for ClubOps AI.
Your task is to take event requirements and produce a structured event plan.

The plan MUST include:
- event_name: Clear and descriptive name
- description: Concise event description
- event_type: One of WORKSHOP, COMPETITION, MEETING, SOCIAL, FUNDRAISER, CONFERENCE, OTHER
- start_date and end_date (if inferrable or provided, formatted YYYY-MM-DD)
- expected_participants (integer if known or estimated)
- teams: List of team names involved (e.g. Logistics, Marketing, Tech)
- tasks: List of actionable tasks with title, priority (LOW, MEDIUM, HIGH, CRITICAL),
  status (TODO), owner_name (null if unassigned, never hallucinate names)
- milestones: Key milestones with title and target due_date
- risks: Foreseeable operational risks with title, severity (LOW, MEDIUM, HIGH, CRITICAL),
  factual reason, and is_ai_prediction=True

Output ONLY valid JSON matching the Event schema. Do not enclose in markdown code fences.
"""


def build_event_planner_prompt(
    prompt: str,
    *,
    event_type: str | None = None,
    target_date: str | None = None,
    expected_attendees: int | None = None,
) -> str:
    """Construct user prompt for the event planning LLM request."""
    details = [f"Event Request: {prompt}"]
    if event_type:
        details.append(f"Preferred Event Type: {event_type}")
    if target_date:
        details.append(f"Target Date: {target_date}")
    if expected_attendees is not None:
        details.append(f"Expected Attendees: {expected_attendees}")

    return "\n".join(details)
