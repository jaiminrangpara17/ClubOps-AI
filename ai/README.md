# ClubOps AI Service

Intelligent operational backend service for ClubOps. Provides LLM integration, structured Event Planning, strictly validated action execution contracts, error handling, and security redaction.

## Features

- **LLM Engine**: Multi-provider LLM client (OpenAI, Groq, Google, OpenRouter) with retry, timeout, and secret masking.
- **Event Planner (`/events/plan`)**: Generates structured, schema-compliant event plans with tasks, milestones, and risk analysis from natural language.
- **Action Validation (`/actions/validate`)**: Enforces whitelist discrimination on AI-generated actions (`create_task`, `update_task`, `assign_task`, `update_task_status`, `create_announcement`, `create_event`).
- **Hallucination-Resistant Schemas**: Pydantic models forbidding extra fields (`extra="forbid"`) and supporting nullable fields for unverified facts.

## Requirements

- Python 3.11+ (3.10 minimum)

## Installation

```bash
cd ai
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env               # Add your LLM provider key
```

## Running the Service

```bash
uvicorn app.main:app --reload --port 8001
```

Interactive API documentation available at `http://localhost:8001/docs`.

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status check |
| `POST` | `/events/plan` | Generate a structured Event plan from prompt |
| `POST` | `/actions/validate` | Validate single AI action payload |
| `POST` | `/actions/validate-batch` | Validate list of AI action payloads |

## Schemas & Validation

### Schemas (`app/schemas/`)
- `common`: `Priority`, `RiskSeverity`, `TaskStatus`, `EventType`, `ActionType`
- `task.Task`: `title`, `description?`, `owner_name?` (nullable), `owner_id?`, `deadline?` (nullable), `priority`, `status`, `dependencies`
- `event.Event`: `event_name`, `description?`, `event_type?`, `start_date?`, `end_date?`, `expected_participants?`, `teams[]`, `tasks[]`, `milestones[]`, `risks[]`
- `meeting.MeetingResult`: `summary`, `decisions[]`, `action_items[]`, `risks[]`
- `risk.Risk`: `title`, `description` (AI explanation), `severity`, `reason` (factual signal), `affected_tasks[]`, `recommended_action?`, `is_ai_prediction`
- `actions.AIAction`: Discriminated union of 6 permitted actions

### Supported AI Actions (Whitelist)
`create_task` | `update_task` | `assign_task` | `update_task_status` | `create_announcement` | `create_event`

Arbitrary commands (e.g. `delete_database`) are rejected automatically by `extra="forbid"` and the discriminator.

## Testing

```bash
pytest
ruff check app tests
```