# ⚙️ 1. ClubOps AI — Intelligent Event & Club Operations Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/tests-144%20passed-brightgreen)](#18-running-tests)
[![Submission Status](https://img.shields.io/badge/submission-frozen%20%26%20verified-success)](#submission-package-artifacts)
[![Release](https://img.shields.io/badge/release-v1.0.0--final-blue)](https://github.com/jaiminrangpara17/ClubOps-AI/releases/tag/v1.0.0-final)


The **ClubOps AI Backend** is a production-hardened RESTful API built with FastAPI, PostgreSQL 16, and SQLAlchemy 2.0. It provides unified operational management for university and community organizations, featuring JWT authentication, role-based access control, club/member/event lifecycles, real-time attendance analytics, and a grounded AI intelligence engine.

---

## 📋 Table of Contents
1. [ClubOps AI](#1-clubops-ai--intelligent-event--club-operations-platform)
2. [Problem Statement](#2-problem-statement)
3. [Solution](#3-solution)
4. [Key Features](#4-key-features)
5. [Architecture](#5-architecture)
6. [Tech Stack](#6-tech-stack)
7. [System Workflow](#7-system-workflow)
8. [AI Features](#8-ai-features)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Database Design](#10-database-design)
11. [API Overview](#11-api-overview)
12. [Frontend](#12-frontend)
13. [Setup Instructions](#13-setup-instructions)
14. [Environment Variables](#14-environment-variables)
15. [Docker Setup](#15-docker-setup)
16. [Database Migration](#16-database-migration)
17. [Running the Application](#17-running-the-application)
18. [Running Tests](#18-running-tests)
19. [Demo Instructions](#19-demo-instructions)
20. [Troubleshooting](#20-troubleshooting)
21. [Team / Contributors](#21-team--contributors)
22. [Future Scope](#22-future-scope)

---

## 2. Problem Statement
Student and community club leaders consistently face operational fragmentation:
- **Fragmented Data**: Rosters are maintained in spreadsheets, event chats are scattered across messaging apps, and attendance is taken on paper forms.
- **Lost Meeting Knowledge**: Key takeaways, decisions, and assigned responsibilities fade away in unreviewed meeting notes.
- **Opaque Attendance Visibility**: Attendance records are rarely synthesized into engagement or member retention metrics.
- **Action Item Leakage**: Post-meeting tasks lack follow-through and operational validation.
- **Lack of Centralized Operational Intelligence**: Organizers lack an accessible assistant that can answer operational queries using factual club history.

---

## 3. Solution
ClubOps AI replaces disjointed tools with one continuous operational pipeline:
```text
Club ➔ Members ➔ Events ➔ Attendance ➔ Analytics ➔ AI Copilot ➔ Meeting Intelligence ➔ Action Engine
```
Every operational action feeds directly into platform intelligence: attendance marked in an event immediately updates analytical dashboards and is accessible by the grounded AI Copilot to answer organizer questions accurately.

---

## 4. Key Features
| Domain | Capabilities |
|---|---|
| **Authentication** | User registration, Argon2 salted password hashing, JWT Bearer tokens, profile management. |
| **Clubs** | Full CRUD lifecycle, unique club namespace validation, creation timestamps. |
| **Members** | Club roster management, unique email validation, cascade protection. |
| **Events** | Scheduling, start/end timestamps, club scoping, participant tracking. |
| **Attendance** | Per-event check-ins (`present`/`absent`), idempotent updates, composite key uniqueness. |
| **Analytics** | Real-time database aggregations (attendance rates, member trends, event volume). Zero fabricated data. |
| **AI Copilot** | Natural-language Q&A strictly grounded in verified database records. |
| **Meeting Intelligence** | Transcripts parsed into executive summaries, recorded decisions, and assigned action items. |
| **Action Engine** | Validates proposed operations against business rules (e.g. valid future dates, existing clubs). |
| **Health Probes** | Liveness probe (`/health`) and Kubernetes-style database readiness probe (`/health/ready`). |

---

## 5. Architecture
The platform implements a clean 3-tier REST architecture:
```text
                    ┌─────────────────────────┐
                    │       User / Demo       │
                    └────────────┬────────────┘
                                 │ HTTP / JSON
                                 ▼
                    ┌─────────────────────────┐
                    │   React Frontend (Vite) │
                    │   Dashboard / AI Views  │
                    └────────────┬────────────┘
                                 │ Bearer JWT / CORS
                                 ▼
┌──────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (8000)                    │
│                                                              │
│  Middleware  → Security Headers, Access Logging, CORS       │
│  Routers     → Auth, Users, Clubs, Members, Events,         │
│                Attendance, Analytics, AI, Health             │
│  Security    → Argon2 Hashing, JWT RBAC Dependencies         │
│  Services    → AI Service, Grounding Engine, Action Engine  │
└──────────────┬───────────────────────────────┬───────────────┘
               │ SQLAlchemy 2.0                │ httpx (REST)
               ▼                               ▼
      ┌────────────────┐             ┌──────────────────┐
      │  PostgreSQL 16 │             │   AI Provider    │
      │  Alembic Head  │             │ OpenAI-Compatible│
      │ (port 55432)   │             │   gpt-4o-mini    │
      └────────────────┘             └──────────────────┘
```

---

## 6. Tech Stack
| Component | Technology | Version | Description |
|---|---|---|---|
| **Language** | Python | 3.11+ / 3.14 | Modern async Python |
| **Web Framework** | FastAPI | 0.141+ | High-performance ASGI framework |
| **ASGI Server** | Uvicorn | 0.41+ | Production ASGI server |
| **Database** | PostgreSQL | 16-alpine | ACID relational database |
| **ORM** | SQLAlchemy | 2.0+ | Object-relational mapping |
| **Migrations** | Alembic | 1.20+ | Database versioning & DDL |
| **Validation** | Pydantic | 2.12+ | Request/response data validation |
| **Password Hashing**| pwdlib (Argon2) | 0.3+ | Salted password protection |
| **Auth Tokens** | python-jose | 3.5+ | JWT HS256 token encoding/decoding |
| **Test Runner** | pytest | 9.1+ | 144 automated tests |

---

## 7. System Workflow
1. **Club Setup**: Executive registers and creates a Club entity.
2. **Roster Building**: Members are registered or imported to the club roster.
3. **Event Scheduling**: Events are scheduled with dates, venues, and descriptions.
4. **Attendance Marking**: During or after the event, member attendance is marked.
5. **Real-time Analytics**: Attendance rates and engagement metrics are updated dynamically from raw SQL records.
6. **AI Grounding**: Organizers query the AI Copilot, which retrieves relevant SQL rows and generates accurate answers.
7. **Meeting Follow-up**: Meeting transcripts are ingested to extract decisions and actionable tasks.

---

## 8. AI Features
- **Grounding Engine**: Injects verified SQL records into system prompts to prevent hallucinations.
- **Event Planner**: Produces structured JSON event plans containing agendas, staffing requirements, risks, and follow-ups.
- **Meeting Intelligence**: Parses raw text transcripts into structured summaries, key decisions, and assigned action items.
- **Action Validation**: Combines deterministic rules with AI operational feedback to identify planning errors.
- **Graceful Failure**: If the external AI service times out or lacks an API key, the system returns HTTP 503 without crashing. Non-AI routes remain 100% operational.

---

## 9. Authentication & Authorization
- **Argon2 Password Hashing**: Passwords are never stored in plaintext.
- **JWT Tokens**: HS256 tokens expire after 30 minutes (configurable via `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`).
- **Role-Based Access Control (RBAC)**:
  - `admin`: Full administrative control across the system.
  - `manager`: Club-level management, events, attendance, and AI planners.
  - `member`: Read-only access to own clubs and attendance records.
  - `anonymous`: Access restricted to `/health` and authentication endpoints.

---

## 10. Database Design
PostgreSQL relational schema managed via Alembic:
```text
Club (1) ────────── (N) Member (1) ────────── (N) Attendance
  │                                                    │
  └────────────── (N) Event  (1) ──────────────────────┘
```
- **Users**: `id`, `username`, `email`, `hashed_password`, `role`, `is_active`, `created_at`
- **Clubs**: `id`, `name` (unique), `description`, `created_at`, `updated_at`
- **Members**: `id`, `club_id` (FK), `name`, `email`, `joined_at`
- **Events**: `id`, `club_id` (FK), `title`, `description`, `starts_at`, `ends_at`, `created_at`
- **Attendance**: `id`, `member_id` (FK), `event_id` (FK), `present` (bool), `marked_at` (composite unique key on `member_id, event_id`)

---

## 11. API Overview
Interactive Swagger UI available at `http://localhost:8000/docs`:
| Tag | Key Endpoints | Description |
|---|---|---|
| **auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | Authentication & token issuance |
| **users** | `GET /users/me`, `PATCH /users/me` | Current user profile management |
| **clubs** | `GET/POST /clubs`, `GET/PUT/DELETE /clubs/{id}` | Club lifecycle management |
| **members** | `GET/POST /members`, `GET/PUT/DELETE /members/{id}` | Member roster management |
| **events** | `GET/POST /events`, `GET/PUT/DELETE /events/{id}` | Event scheduling |
| **attendance** | `GET/POST /attendance`, `GET/PUT/DELETE /attendance/{id}`| Attendance records |
| **analytics** | `GET /analytics/overview`, `GET /analytics/clubs/{id}` | Real operational metrics |
| **ai** | `POST /ai/copilot`, `POST /ai/planner`, `POST /ai/meetings/analyze` | Grounded AI & meeting tools |
| **ops** | `GET /health`, `GET /health/ready` | Liveness and DB readiness checks |

---

## 12. Frontend
The backend powers the React 19 + TypeScript + Vite frontend client:
- **CORS Configured**: Configured via `CORS_ORIGINS` to allow `http://localhost:5173` and `http://127.0.0.1:5173`.
- **Stateless API Consumption**: Frontend stores JWT in local session storage and sends `Authorization: Bearer <token>` headers.
- **Contract Stability**: Fully typed responses using Pydantic v2 schemas.

---

## 13. Setup Instructions
Reproducible setup from a clean terminal:
```powershell
# 1. Clone repository
git clone https://github.com/jaiminrangpara17/ClubOps-AI.git
cd ClubOps-AI/backend

# 2. Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 3. Install pinned dependencies
pip install -r requirements.txt

# 4. Configure environment
copy .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secret
```

---

## 14. Environment Variables
Reference configuration (`backend/.env.example`):
```env
POSTGRES_DB=clubops_ai
POSTGRES_USER=clubops
POSTGRES_PASSWORD=change_me_strong_password
POSTGRES_PORT=5432

DATABASE_URL=postgresql+psycopg://clubops:change_me_strong_password@localhost:5432/clubops_ai

JWT_SECRET_KEY=change-me-to-a-long-random-hex-string
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000

AI_API_KEY=
AI_MODEL=gpt-4o-mini
```

---

## 15. Docker Setup
Run PostgreSQL 16 Alpine container:
```powershell
# From root repository
docker compose up -d

# Verify container is running and healthy
docker compose ps
```

---

## 16. Database Migration
Apply migrations to bring PostgreSQL to the latest schema:
```powershell
alembic upgrade head
alembic current
# Output should show: ef3755e0a2a7 (head)
```

---

## 17. Running the Application
### Production ASGI Runner (Recommended):
FastAPI deployment guidelines recommend avoiding `--reload` in production:
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Development Mode:
```powershell
uvicorn app.main:app --reload --port 8000
```

---

## 18. Running Tests
Run the automated pytest regression suite:
```powershell
python -m pytest tests -v --tb=short
```
**Test Results**: **144 passed**, 0 failed, 0 errors in ~32 seconds. See [`docs/submission/TEST_RESULTS.txt`](docs/submission/TEST_RESULTS.txt).

---

## 19. Demo Instructions
Seed the database with repeatable demo data:
```powershell
python scripts/seed_demo.py
```
### Demo Credentials:
- **Admin**: `admin` / `AdminPass123!`
- **Manager**: `manager` / `ManagerPass123!`
- **Member**: `member1` / `MemberPass123!`

Follow the detailed 7-scene presentation walkthrough in [`docs/submission/DEMO_SCRIPT_AND_BACKUP.md`](docs/submission/DEMO_SCRIPT_AND_BACKUP.md).

---

## 20. Troubleshooting
- **Database Connection Failed**: Ensure Docker PostgreSQL is running on the port specified in `.env`.
- **Alembic Drift Detected**: Run `alembic upgrade head` to align revisions.
- **AI Endpoints Return 503**: Expected behavior when running without `AI_API_KEY`. Add a valid key in `.env` to enable live LLM inference.
- **Port 8000 in Use**: Free the port using `taskkill /PID <pid> /F`.

---

## 21. Team / Contributors
- **ClubOps AI Development Team**
- **Repository**: [https://github.com/jaiminrangpara17/ClubOps-AI](https://github.com/jaiminrangpara17/ClubOps-AI)
- **Branch**: `submission-final`

---

## 22. Future Scope
- **QR Code Check-ins**: Mobile check-in scanning for instant attendance logging.
- **Calendar Integrations**: Two-way synchronization with Google Calendar and Outlook.
- **Multi-Tenant Budgeting**: Club funding, budget allocation, and expense tracking.
- **Automated Announcements**: Push notifications and email reminders for upcoming events.

---

## 📦 Submission Package Artifacts
Detailed submission artifacts are maintained in `docs/submission/`:
- [`PROJECT_SUMMARY.md`](docs/submission/PROJECT_SUMMARY.md) — Comprehensive executive summary & problem-solution mapping.
- [`ARCHITECTURE_AND_DATABASE.md`](docs/submission/ARCHITECTURE_AND_DATABASE.md) — System architecture & ER database diagrams.
- [`FEATURE_MATRIX.md`](docs/submission/FEATURE_MATRIX.md) — Verified platform capability matrix.
- [`DEMO_SCRIPT_AND_BACKUP.md`](docs/submission/DEMO_SCRIPT_AND_BACKUP.md) — 7-scene presentation script and fallback contingency plans.
- [`PRESENTATION_STRUCTURE.md`](docs/submission/PRESENTATION_STRUCTURE.md) — 13-slide evaluation presentation deck structure.
- [`TEST_RESULTS.txt`](docs/submission/TEST_RESULTS.txt) — Official pytest runner log showing 144 passed tests.
- [`FINAL_CHECKLIST.md`](docs/submission/FINAL_CHECKLIST.md) — 18-item pre-submission checklist and freeze declaration.

---

*ClubOps AI — Feature complete, frozen, and submission-ready.*