# ClubOps AI Service

Intelligent operational backend service for ClubOps. Provides LLM integration, structured Event Planning, Sprint 6 Action Engine proposal generation, strictly validated action execution contracts, error handling, and security redaction.

## Features

- **LLM Engine**: Multi-provider LLM client (OpenAI, Groq, Google, OpenRouter) with retry, timeout, and secret masking.
- **Event Planner (`/events/plan`)**: Generates structured, schema-compliant event plans with tasks, milestones, and risk analysis from natural language.
- **Sprint 5 Risk Intelligence (`app/services/risk_intelligence.py`)**: Analyzes multi-faceted operational context (events, tasks, deadlines, owners, dependencies, staffing) and extracts strictly grounded, structured risks.
- **Sprint 6 Action Engine (`app/services/action_engine.py`)**: Analyzes user intent alongside multi-dimensional context (event, task, meeting, risk, operational, and people context) to produce grounded action proposals.
- **Sprint 7 Knowledge Assistant / RAG (`app/services/knowledge_assistant.py`)**: Answers queries strictly from retrieved club knowledge using deterministic chunking, BM25 lexical retrieval, and verified source grounding.
- **Sprint 8 AI Communication Services (`app/services/announcement_generator.py`, `app/services/daily_briefing.py`)**: Drafts strictly grounded club announcements and synthesizes operational context into categorized daily briefings without publishing or executing actions.
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

## Sprint 7 Knowledge Assistant / RAG

The Knowledge Assistant is a strictly grounded Retrieval-Augmented Generation (RAG) service (`app/services/knowledge_assistant.py`) designed to answer club questions exclusively using verified knowledge retrieved from club documents.

### Purpose
Club operations involve diverse guidelines, safety rules, bylaws, and logistics documents. The Knowledge Assistant answers queries strictly using retrieved evidence. If sufficient club knowledge is not available, it explicitly returns `grounded=false` with an insufficient information message, preventing hallucinations and outside knowledge leakage.

### Architecture & Pipeline

```
Club Documents (KnowledgeDocument)
       ↓
Deterministic Chunking (chunk_document)
       ↓
Indexed Chunks (KnowledgeChunk)
       ↓
Lexical Retrieval (KnowledgeRetriever - BM25)
       ↓
Top-K Relevant Chunks
       ↓
[Zero evidence? → grounded=false, NO LLM call]
       ↓
Strict Grounded Prompt (build_knowledge_prompt)
       ↓
LLM Abstraction (LLMService)
       ↓
Structured Output Validation (validate_ai_output)
       ↓
Deterministic Source Grounding (validate_knowledge_answer)
       ↓
KnowledgeAnswer (answer + verified sources + grounded flag)
```

### Lexical Retrieval (BM25)
For this hackathon release, retrieval is implemented using a pure-Python, deterministic Okapi/Lucene BM25 lexical ranking engine:
- Normalizes case and tokenizes text deterministically into word stems.
- Computes positive Inverse Document Frequency (IDF) and term frequency with saturation parameters ($k_1=1.5, b=0.75$).
- Breaks ties deterministically by chunk identifier.
- Returns an empty list (`[]`) when no query tokens match the indexed corpus, completely bypassing LLM execution.
- No heavy external vector database or multi-agent overhead.

### Source Grounding & Anti-Hallucination
Answers pass through a deterministic validator (`app/validators/knowledge_validator.py`):
1. **Source Grounding**: Every cited source must correspond to an actually retrieved chunk. Mismatched or fabricated `document_id`, `chunk_id`, or `title` triggers an immediate `KnowledgeValidationError`.
2. **Citation Veracity**: Cited text excerpts must exist within the matched chunk content (exact excerpt or >=60% token overlap). Fabricated text is rejected.
3. **Mandatory Citations**: When `grounded=true`, the `sources` list must not be empty.
4. **Insufficient Evidence Enforcement**: When `grounded=false`, the answer text must explicitly indicate insufficient available club knowledge.
5. **Zero Action Execution**: The service contains zero execution methods, never connects to databases directly, and never mutates state.

### Example Usage

```python
import asyncio
from app.schemas.knowledge import KnowledgeDocument, KnowledgeQueryRequest
from app.knowledge.chunker import chunk_document
from app.knowledge.retriever import KnowledgeRetriever
from app.services.knowledge_assistant import KnowledgeAssistantService

async def main():
    # 1. Ingest and chunk documents
    policy_doc = KnowledgeDocument(
        document_id="doc-reimburse",
        title="Reimbursement Policy",
        content="Reimbursement requests must be submitted within 14 days of purchase with itemized receipts.",
    )
    chunks = chunk_document(policy_doc, chunk_size=300, overlap=30)

    # 2. Index in deterministic lexical retriever
    retriever = KnowledgeRetriever(chunks)

    # 3. Query the Knowledge Assistant
    service = KnowledgeAssistantService(retriever=retriever)
    request = KnowledgeQueryRequest(query="How long do I have to submit reimbursement?", top_k=3)
    result = await service.answer(request)

    print(f"Grounded: {result.grounded}")
    print(f"Answer: {result.answer}")
    for source in result.sources:
        print(f"  Source [{source.chunk_id}] ({source.title}): {source.text}")

if __name__ == "__main__":
    asyncio.run(main())
```

## Sprint 8 AI Communication Services

Sprint 8 introduces two evidence-based communication intelligence engines:
1. **AI Announcement Generator (`app/services/announcement_generator.py`)**: Drafts professional announcements strictly from supplied facts without fabricating event details.
2. **AI Daily Briefing (`app/services/daily_briefing.py`)**: Synthesizes tasks, deadlines, risks, events, and meetings into categorized, evidence-grounded operational briefings.

### Zero-Mutation & Draft-Only Guarantee
> [!IMPORTANT]
> Both communication services are strictly read-only intelligence engines:
> - **Drafts Only**: Announcements are generated as proposals (`AnnouncementResult`) and are **never automatically sent or published**.
> - **No Action Execution**: Daily briefings are informational summaries for club leadership and **never execute actions or mutate databases**.

### Announcement Generator
Transforms supplied operational facts into clear, audience-tailored draft communications:
- **Input (`AnnouncementRequest`)**: `purpose`, `audience?`, `event_info?`, `key_details?`, `tone?`.
- **Output (`AnnouncementResult`)**: `title`, `body`, `audience?`, `grounded`, `used_facts`.
- **Anti-Fabrication**: Never invents dates, times, locations, ticket prices, deadlines, or registration links. Tone affects vocabulary and style only, never factual content.
- **Grounding Validation**: Every claim in `used_facts` must be verified against supplied facts (requiring at least two non-generic matching terms or a substantial matching phrase).

### Daily Briefing
Synthesizes multi-dimensional operational context for leadership:
- **Input (`BriefingRequest`)**: `date`, `tasks?`, `deadlines?`, `risks?`, `events?`, `meetings?`, `operational_context?`.
- **Output (`DailyBriefing`)**: `date`, `summary`, `items: list[BriefingItem]`, `grounded`.
- **Categories**: `urgent`, `deadline`, `task`, `risk`, `event`, `meeting`, `general`.
- **Evidence Verification**: Every briefing item includes an `evidence` list directly derived from supplied operational input. Fabricated evidence is rejected with `CommunicationValidationError`.

### Example Usage

```python
import asyncio
from app.schemas.communication import AnnouncementRequest, BriefingRequest
from app.services.announcement_generator import AnnouncementGeneratorService
from app.services.daily_briefing import DailyBriefingService

async def main():
    # 1. Generate an Announcement Draft
    announcement_svc = AnnouncementGeneratorService()
    ann_request = AnnouncementRequest(
        purpose="Invite members to robotics workshop",
        event_info="Robotics Automation 2026",
        key_details=["Date: Nov 12 at 2pm", "Venue: Engineering Lab 4", "Free admission"],
        tone="enthusiastic",
    )
    draft = await announcement_svc.generate(ann_request)
    print(f"Announcement Title: {draft.title}")
    print(f"Announcement Body:\n{draft.body}")
    print(f"Used Facts: {draft.used_facts}")

    # 2. Generate a Daily Operational Briefing
    briefing_svc = DailyBriefingService()
    brief_request = BriefingRequest(
        date="2026-11-10",
        tasks=[{"id": "t-1", "title": "Setup Lab 4 equipment", "status": "PENDING"}],
        deadlines=[{"milestone": "Catering order cutoff", "due": "2026-11-11"}],
    )
    briefing = await briefing_svc.generate(brief_request)
    print(f"Daily Briefing ({briefing.date}): {briefing.summary}")
    for item in briefing.items:
        print(f"  [{item.category.upper()}] {item.title}: {item.summary}")
        print(f"    Evidence: {item.evidence}")

if __name__ == "__main__":
    asyncio.run(main())
```

## Sprint 9: Backend Integration

Sprint 9 connects the AI microservice to the ClubOps backend architecture with strict boundary enforcement, human confirmation guarantees, and typed HTTP clients.

### Architecture & Boundaries

```
[ Frontend / User ]
       ↓ (HTTP)
[ ClubOps Backend (FastAPI + SQLAlchemy) ]
   ├── Authentication & Authorization (JWT)
   ├── Database Mutations (PostgreSQL / SQLite)
   └── AIServiceClient / AsyncAIServiceClient (HTTP)
              ↓
[ ClubOps AI Service (FastAPI Microservice :8001) ]
   ├── Event Planner (/events/plan)
   ├── Meeting Intelligence (/meetings/analyze)
   ├── Risk Intelligence (/risks/analyze)
   ├── Action Engine (/actions/propose)
   ├── Knowledge Assistant (/knowledge/query)
   ├── Communication Services (/announcements/generate, /briefings/generate)
   └── Action Whitelist Validation (/actions/validate, /actions/validate-batch)
```

### Critical Architectural Guarantees

1. **AI NEVER Mutates the Database**: The AI microservice has zero database connections, zero ORM models, and zero direct access to persistence layers. It produces strictly validated proposals and analytical results.
2. **Backend is the Authoritative Gatekeeper**: The ClubOps backend handles user authentication, role-based authorization, database transactions, and business invariants.
3. **Mandatory Human Confirmation**: Every proposed mutation requires explicit human approval (`confirmed=True`). Unconfirmed actions are deterministically rejected.
4. **Zero Fallback Mutations**: If an AI call times out, fails, or produces invalid output, the backend NEVER silently executes fallback database changes.

### HTTP Client Library (`app/client.py`)

The `app.client` module provides synchronous (`AIServiceClient`) and asynchronous (`AsyncAIServiceClient`) HTTP clients for backend routers, Celery tasks, or external consumers.

#### Synchronous Example

```python
from app.client import AIServiceClient
from app.schemas.action_engine import ActionEngineRequest

with AIServiceClient(base_url="http://localhost:8001") as client:
    # Health check
    health = client.health()
    print("AI status:", health["status"])

    # Propose actions
    proposals = client.propose_actions(
        ActionEngineRequest(user_intent="Create task for venue setup")
    )
    for action in proposals.actions:
        print(f"Proposed: {action.action}, requires confirmation: {action.requires_confirmation}")
```

#### Asynchronous Example

```python
import asyncio
from app.client import AsyncAIServiceClient
from app.schemas.knowledge import KnowledgeQueryRequest

async def query_ai():
    async with AsyncAIServiceClient(base_url="http://localhost:8001") as client:
        result = await client.query_knowledge(
            KnowledgeQueryRequest(query="What is the club reimbursement policy?")
        )
        print(f"Answer: {result.answer}")
        print(f"Grounded: {result.grounded}")

asyncio.run(query_ai())
```

### Action Execution Contract (`app/schemas/integration.py`)

When the backend is ready to execute an approved AIAction, it verifies the execution contract:

```python
from app.schemas.actions import CreateTaskAction, CreateTaskParameters
from app.schemas.integration import ActionExecutionRequest, verify_action_execution

# Validated proposal
action = CreateTaskAction(
    action="create_task",
    parameters=CreateTaskParameters(title="Book conference hall"),
    requires_confirmation=True,
)

# Contract verification before backend database mutation:
request = ActionExecutionRequest(
    action=action,
    confirmed=True,         # Explicit user confirmation
    user_id="user_abc123",  # Authenticated caller ID
)
verify_action_execution(request)  # Raises ActionValidationError if unconfirmed or unauthenticated
```

### Typed Error Hierarchy (`app/core/exceptions.py`)

Client calls map low-level transport and HTTP failures to typed exceptions:
- **`AIClientError`** (502): Generic AI microservice client communication error.
- **`AIClientTimeoutError`** (504): Request to AI service exceeded configured timeout.
- **`AIClientConnectionError`** (503): Could not connect to AI microservice.
- **`AIClientValidationError`** (422): AI response or request payload failed Pydantic validation.

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

| Method | Endpoint | Request Model | Response Model | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | _None_ | `dict` | Service health status check |
| `POST` | `/events/plan` | `EventPlanRequest` | `Event` | Generate structured event plan from prompt |
| `POST` | `/meetings/analyze` | `MeetingIntelligenceRequest` | `MeetingResult` | Extract decisions and action items from transcript |
| `POST` | `/risks/analyze` | `RiskIntelligenceRequest` | `RiskAnalysisResult` | Identify evidence-grounded operational risks |
| `POST` | `/actions/propose` | `ActionEngineRequest` | `ActionProposalList` | Generate safe, typed action proposals |
| `POST` | `/knowledge/query` | `KnowledgeQueryRequest` | `KnowledgeAnswer` | Grounded RAG queries with source citations |
| `POST` | `/announcements/generate` | `AnnouncementRequest` | `AnnouncementResult` | Draft grounded club announcements |
| `POST` | `/briefings/generate` | `BriefingRequest` | `DailyBriefing` | Synthesize categorized daily operational briefing |
| `POST` | `/actions/validate` | `dict` | `dict` | Validate single AI action payload |
| `POST` | `/actions/validate-batch` | `list[dict]` | `list[dict]` | Validate list of AI action payloads |

## Schemas & Validation

### Schemas (`app/schemas/`)
- `common`: `Priority`, `RiskSeverity`, `TaskStatus`, `EventType`, `ActionType`
- `task.Task`: `title`, `description?`, `owner_name?` (nullable), `owner_id?`, `deadline?` (nullable), `priority`, `status`, `dependencies`
- `event.Event`: `event_name`, `description?`, `event_type?`, `start_date?`, `end_date?`, `expected_participants?`, `teams[]`, `tasks[]`, `milestones[]`, `risks[]`
- `meeting.MeetingResult`: `summary`, `decisions[]`, `action_items[]`, `risks[]`
- `risk.Risk`: `title`, `description` (AI explanation), `severity`, `reason` (factual signal), `affected_tasks[]`, `recommended_action?`, `is_ai_prediction`
- `actions.AIAction`: Discriminated union of 6 permitted actions
- `action_engine`: `ActionEngineRequest`, `ActionProposalList`
- `knowledge`: `KnowledgeDocument`, `KnowledgeChunk`, `KnowledgeQueryRequest`, `KnowledgeSource`, `KnowledgeAnswer`
- `communication`: `AnnouncementRequest`, `AnnouncementResult`, `BriefingRequest`, `BriefingItem`, `DailyBriefing`
- `integration`: `ActionExecutionRequest`, `ActionExecutionResponse`, `ExecutionStatus`, `verify_action_execution`

### Supported AI Actions (Whitelist)
`create_task` | `update_task` | `assign_task` | `update_task_status` | `create_announcement` | `create_event`

Arbitrary commands (e.g. `delete_database`) are rejected automatically by `extra="forbid"` and the discriminator.

## Testing

```bash
pytest -q
ruff check app tests
```