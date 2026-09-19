# ClubOps AI Service

Internal AI service for ClubOps. Sprint 1 provides only the foundation:
configuration, a reusable LLM client, error handling, and a health endpoint.

Not in this sprint: event planner, meeting intelligence, risk intelligence,
action engine, RAG, announcements, daily briefing, agents, database access.

## Requirements

- Python 3.11+ (3.10 minimum)

## Installation

```bash
cd ai
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env               # then add your key

## Schemas & Validation (Sprint 2)

### Schemas
- `common`: Priority, RiskSeverity, TaskStatus, EventType, ActionType
- `task.Task`: title, description?, owner_name? (nullable), owner_id?, deadline? (nullable), priority, status, dependencies
- `event.Event`: event_name, description?, event_type?, start/end_date?, expected_participants?, teams[], tasks[Task], milestones[], risks[Risk]
- `meeting.MeetingResult`: summary, decisions[], action_items[MeetingActionItem], risks[]
- `risk.Risk`: title, description (AI explanation), severity, reason (factual signal), affected_tasks[], recommended_action?, is_ai_prediction
- `actions.AIAction`: discriminated union of 6 actions - only these allowed

### Supported AI Actions (whitelist)
`create_task | update_task | assign_task | update_task_status | create_announcement | create_event`
Arbitrary names like `delete_database` are rejected by `extra=forbid` + discriminator.

### Validation
`validate_ai_output(raw, Schema)` -> parses JSON string/dict/model, validates via Pydantic TypeAdapter, raises `MalformedAIOutputError` / `SchemaValidationError`.
`validate_ai_action(raw)` -> validates against AIAction union, raises `ActionValidationError`.

### Security
- Validation layer NEVER executes. Flow: AI -> Action object -> validator -> VALID/INVALID -> backend (future) executes.
- No DB, no backend calls in Sprint 2.
- Schemas allow null for unknown info - prevents hallucination (e.g., "someone should do it" -> owner_name=null, not invented name).
- Risk schema distinguishes factual signal (`reason`) from AI explanation (`description` + `is_ai_prediction=True`).