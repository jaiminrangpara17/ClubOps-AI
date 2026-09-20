# ClubOps AI Service

Intelligent operational backend service for ClubOps. Provides LLM integration, structured Event Planning, Sprint 6 Action Engine proposal generation, strictly validated action execution contracts, error handling, and security redaction.

## Features

- **LLM Engine**: Multi-provider LLM client (OpenAI, Groq, Google, OpenRouter) with retry, timeout, and secret masking.
- **Event Planner (`/events/plan`)**: Generates structured, schema-compliant event plans with tasks, milestones, and risk analysis from natural language.
- **Sprint 5 Risk Intelligence (`app/services/risk_intelligence.py`)**: Analyzes multi-faceted operational context (events, tasks, deadlines, owners, dependencies, staffing) and extracts strictly grounded, structured risks.
- **Sprint 6 Action Engine (`app/services/action_engine.py`)**: Analyzes user intent alongside multi-dimensional context (event, task, meeting, risk, operational, and people context) to produce grounded action proposals.
- **Action Validation (`/actions/validate`)**: Enforces whitelist discrimination on AI-generated actions (`create_task`, `update_task`, `assign_task`, `update_task_status`, `create_announcement`, `create_event`).
- **Hallucination-Resistant Schemas**: Pydantic models forbidding extra fields (`extra="forbid"`) and supporting nullable fields for unverified facts.

## Sprint 5 Risk Intelligence

The Risk Intelligence service analyzes structured and current operational context and returns validated, structured risks without hallucinating facts or executing actions.

### Purpose
The primary purpose of Risk Intelligence is early detection of operational vulnerabilities (bottlenecks, deadlines, unassigned tasks, volunteer deficits) across club activities while strictly ensuring that AI reasoning is verified against provided evidence.

### Zero-Mutation & No Action Execution
> [!IMPORTANT]
> The Risk Intelligence service **NEVER executes actions** and never mutates data. It is an analytical, read-only engine that outputs validated risk assessments.

### Request & Response Structure
- **`RiskIntelligenceRequest` (`app/schemas/risk_intelligence.py`)**:
  - `event_info: str | None`
  - `tasks: list[dict] | None`
  - `deadlines: list[dict] | None`
  - `owners: list[dict] | None`
  - `dependencies: list[dict] | None`
  - `volunteer_availability: str | None`
  - `operational_context: str | None`
- **`RiskItem`**:
  - `title: str`: Concise title
  - `description: str`: Operational explanation of the risk
  - `severity: Literal["low", "medium", "high", "critical"]`
  - `evidence: list[str]`: Concrete excerpts quoted or directly derived from supplied input
  - `related_task: str | None`: Verified task identifier or title (if task context supplied)
  - `related_event: str | None`: Verified event reference (if event context supplied)
- **`RiskAnalysisResult`**:
  - `risks: list[RiskItem]`: Collection of deterministically grounded risks

All models enforce `extra="forbid"` and strip whitespace.

### Deterministic Operational Signals
The risk analyzer is prompted to prioritize factual operational signals:
- Overdue tasks
- Approaching deadlines
- Missing task owners / unassigned work
- Blocked task dependencies
- Critical incomplete tasks
- Volunteer and staffing shortages
- Conflicting or insufficient operational constraints

### Evidence-Grounding Rules
Risk outputs pass through a deterministic grounding validator (`app/validators/risk_validator.py`):
1. **Case & Whitespace Normalization**: Matching is case- and whitespace-insensitive.
2. **Stopwords Exclusion**: Common stopwords (`the`, `a`, `an`, `is`, `are`, `and`, `or`, `to`, `of`, `for`, `with`, `on`, `in`, etc.) are stripped.
3. **Meaningful Terms / Substantial Phrase**: Evidence must contain either:
   - At least **two** distinct meaningful (non-stopword, non-generic) terms present in the context, OR
   - A **substantial matching phrase** (3+ consecutive words or 15+ characters) appearing verbatim in the context.
4. **Generic Words Filter**: Single words like `"deadline"`, `"task"`, `"event"`, or `"risk"` are insufficient for grounding and are rejected.
5. **Anti-Fabrication for References**:
   - `related_task` must match a task in the provided task context when task context exists.
   - `related_event` must match event details in event context when event context exists.
   - Absent context fields do not trigger false rejections.

### Example Usage

```python
import asyncio
from app.schemas.risk_intelligence import RiskIntelligenceRequest
from app.services.risk_intelligence import RiskIntelligenceService

async def main():
    service = RiskIntelligenceService()
    request = RiskIntelligenceRequest(
        event_info="Autumn Hackathon 2026",
        tasks=[
            {"id": "t-1", "title": "Reserve main lab", "status": "COMPLETED"},
            {"id": "t-2", "title": "Order catering", "status": "TODO"},
        ],
        deadlines=[{"milestone": "Catering cutoff", "due_date": "2026-10-10"}],
        operational_context="Catering order requires 5 days advance deposit. Current date is 2 days before cutoff.",
    )
    result = await service.analyze_risks(request)
    for risk in result.risks:
        print(f"[{risk.severity.upper()}] {risk.title}: {risk.description}")
        print(f"  Evidence: {risk.evidence}")

if __name__ == "__main__":
    asyncio.run(main())
```

## Sprint 6 AI Action Engine

The Action Engine converts validated user intent and operational context into safe, structured action proposals without directly modifying databases or executing mutations.

### Purpose
The Action Engine acts as an intelligent proposal layer. It translates natural language operational instructions alongside multi-dimensional context (event, tasks, meeting notes, risk registers) into schema-validated action proposals.

### Zero Direct Mutation & Deferred Execution
> [!IMPORTANT]
> The AI **NEVER directly modifies the database or backend**. It only produces validated action proposals.
> **Backend integration and actual execution are deferred to Sprint 9**, strictly requiring user review and confirmation before execution.

### Allowed Actions (Whitelist)
The Action Engine strictly permits only six action types:
- `create_task`: `title` (required), `description`, `assignee`, `deadline`, `priority`
- `update_task`: `task_id` (required), `title`, `description`, `assignee`, `deadline`, `priority`, `status`
- `assign_task`: `task_id` (required), `assignee` (required)
- `update_task_status`: `task_id` (required), `status` (`TODO`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `OVERDUE`)
- `create_announcement`: `title` (required), `message` (required), `audience`
- `create_event`: `event_name` (required), `description`, `start_date`, `end_date`

Any other action names (e.g. `delete_database`, `drop_tables`) are rejected automatically.

### Action Proposal Structure
- **`ActionEngineRequest` (`app/schemas/action_engine.py`)**:
  - `user_intent: str` (required)
  - `event_context: str | None`
  - `task_context: list[dict] | None`
  - `meeting_output: dict | None`
  - `risk_output: dict | None`
  - `operational_context: str | None`
- **`ActionProposalList`**:
  - `actions: list[AIAction]`: List of typed action proposals conforming to Sprint 2 `AIAction` schemas.

### Confirmation Requirement
Every action proposal enforces:
```json
"requires_confirmation": true
```
Even if the LLM produces `false`, the deterministic validator overrides it to `true`. The AI only proposes actions; it cannot authorize execution.

### Deterministic Context Grounding
1. **Task Grounding**: When `task_context` is supplied, proposals referencing non-existent task IDs or titles are rejected (`Fabricated task reference`).
2. **People Grounding**: When people or assignees exist in `task_context`, assigning tasks to unknown individuals is rejected (`Fabricated assignee`).
3. **Explicit Intent Grounding**: When grounding context is intentionally omitted, explicit identifiers provided in `user_intent` are accepted without hallucinating extra details.
4. **Event Independence**: `create_event` creates new events and does not require prior event references.
5. **Deterministic Validation**: All checks use normalized string matching (lowercase, whitespace normalization) to avoid false rejections due to casing/whitespace differences.

### Example Action Proposal

```python
import asyncio
from app.schemas.action_engine import ActionEngineRequest
from app.services.action_engine import ActionEngineService

async def main():
    service = ActionEngineService()
    request = ActionEngineRequest(
        user_intent="Assign task t-101 to Alice and set status to IN_PROGRESS",
        task_context=[
            {"task_id": "t-101", "title": "Reserve venue hall", "assignee": "Alice"}
        ],
    )
    proposals = await service.propose_actions(request)
    for action in proposals.actions:
        print(f"Action: {action.action}, requires_confirmation: {action.requires_confirmation}")
        print(f"Parameters: {action.parameters.model_dump()}")

if __name__ == "__main__":
    asyncio.run(main())
```


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
- `action_engine`: `ActionEngineContext`, `ActionProposal`, `ActionEngineResult`, `TaskContextItem`, `PersonContextItem`

### Supported AI Actions (Whitelist)
`create_task` | `update_task` | `assign_task` | `update_task_status` | `create_announcement` | `create_event`

Arbitrary commands (e.g. `delete_database`) are rejected automatically by `extra="forbid"` and the discriminator.

## Testing

```bash
pytest -q
ruff check app tests
```