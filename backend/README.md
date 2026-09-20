# ⚙️ ClubOps AI — Backend API Service

[![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/tests-144%20passed-brightgreen)](#testing)

The **ClubOps AI Backend** is a production-style RESTful API built with FastAPI and PostgreSQL. It provides authentication, role-based authorization, club/member/event/attendance management, an analytics layer, and an AI Copilot powered by an OpenAI-compatible provider.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Features](#-features)
3. [Architecture](#-architecture)
4. [Technology Stack](#-technology-stack)
5. [Requirements](#-requirements)
6. [Installation](#-installation)
7. [Environment Configuration](#-environment-configuration)
8. [Docker Setup](#-docker-setup)
9. [Database Setup & Migrations](#-database-setup--migrations)
10. [Backend Startup](#-backend-startup)
11. [Frontend Startup](#-frontend-startup)
12. [Testing](#-testing)
13. [API Documentation](#-api-documentation)
14. [Authentication](#-authentication)
15. [AI Configuration](#-ai-configuration)
16. [Demo Data & Credentials](#-demo-data--credentials)
17. [Demo Flow](#-demo-flow)
18. [Troubleshooting](#-troubleshooting)
19. [Security Notes](#-security-notes)

---

## 🏗 Project Overview

ClubOps AI is a full-stack club management platform for university and community clubs. The backend exposes a secure REST API that the React frontend consumes. An optional AI layer provides a natural-language copilot, event planner, and meeting intelligence features.

```
ClubOps-AI/
├── backend/          ← This service (FastAPI + PostgreSQL)
├── frontend/         ← React 19 + Vite + TypeScript (see root README)
├── ai/               ← Standalone AI microservice
├── docker-compose.yml
└── README.md
```

---

## ✨ Features

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | JWT-based authentication |
| **Users** | `GET/PATCH /users/me` | Profile management |
| **Clubs** | Full CRUD | Club lifecycle management |
| **Members** | Full CRUD | Club roster management |
| **Events** | Full CRUD | Event scheduling |
| **Attendance** | Full CRUD | Per-event attendance records |
| **Analytics** | `GET /analytics/overview`, `GET /analytics/clubs/{id}` | Aggregated attendance metrics |
| **AI Copilot** | `POST /ai/copilot` | Natural-language Q&A grounded in real data |
| **AI Planner** | `POST /ai/planner` | Structured event plan generation |
| **AI Insights** | `GET /ai/insights` | Operational recommendations |
| **Meeting Intelligence** | `POST /ai/meetings/analyze` | Transcript → summary + action items |
| **Action Validation** | `POST /ai/actions/validate` | Deterministic + AI rule checking |
| **Health** | `GET /health`, `GET /health/ready` | Liveness + DB readiness probes |

---

## 🏛 Architecture

```
┌──────────────────────────────────────┐
│          React Frontend (Vite)       │
│     http://localhost:5173            │
└──────────────┬───────────────────────┘
               │ HTTP / Bearer JWT
┌──────────────▼───────────────────────┐
│      FastAPI Backend (Uvicorn)       │
│      http://localhost:8000           │
│                                      │
│  Routers  → auth, clubs, members,   │
│             events, attendance,      │
│             analytics, ai, users     │
│                                      │
│  Security → JWT, RBAC (admin /       │
│             manager / member)        │
│                                      │
│  Middleware → CORS, Security         │
│               Headers, Access Log   │
└──────────────┬───────────────────────┘
               │ SQLAlchemy 2.0
┌──────────────▼───────────────────────┐
│       PostgreSQL 16 (Docker)         │
│       port 5432                      │
│       Schema managed by Alembic      │
└──────────────────────────────────────┘
               │ httpx
┌──────────────▼───────────────────────┐
│  OpenAI-compatible AI Provider       │
│  (optional — app works without it)   │
└──────────────────────────────────────┘
```

---

## 🛠 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | FastAPI | 0.141+ |
| **ASGI Server** | Uvicorn | 0.53+ |
| **ORM** | SQLAlchemy | 2.0+ |
| **Migrations** | Alembic | 1.20+ |
| **Database** | PostgreSQL | 16 |
| **DB Driver** | psycopg (v3) | 3.3+ |
| **Auth** | PyJWT + pwdlib (Argon2) | — |
| **Validation** | Pydantic v2 | 2.13+ |
| **HTTP Client** | httpx | 0.28+ |
| **Testing** | pytest | 9.1+ |
| **Config** | python-dotenv | 1.2+ |

---

## 📋 Requirements

- **Python** 3.11 or later (tested on 3.14)
- **Docker Desktop** (for PostgreSQL via docker-compose)
- **Node.js** 18+ (for the frontend only)
- A shell with PowerShell or bash

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/jaiminrangpara17/ClubOps-AI.git
cd ClubOps-AI
```

### 2. Create and activate a virtual environment

```bash
# macOS / Linux
python -m venv .venv
source .venv/bin/activate

# Windows PowerShell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### 3. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

## ⚙️ Environment Configuration

Copy the example environment file and fill in your values:

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Then edit `backend/.env`:

```dotenv
# PostgreSQL
POSTGRES_DB=clubops_ai
POSTGRES_USER=clubops
POSTGRES_PASSWORD=your_strong_password_here
POSTGRES_PORT=5432

# Connection string (must match the values above)
DATABASE_URL=postgresql+psycopg://clubops:your_strong_password_here@localhost:5432/clubops_ai

# JWT — generate with: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=your-64-char-hex-secret-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# AI (optional — leave empty to disable AI features)
AI_API_KEY=
AI_MODEL=gpt-4o-mini
```

> **Important**: Never commit `.env`. It is in `.gitignore` and must remain there.

---

## 🐳 Docker Setup

PostgreSQL is managed via Docker Compose from the **repository root**:

```bash
# From the repo root (not backend/)
docker compose up -d
```

Verify the database is healthy:

```bash
docker compose ps
```

Expected output:
```
NAME                STATUS          PORTS
clubops-postgres    Up (healthy)    0.0.0.0:5432->5432/tcp
```

Stop PostgreSQL:

```bash
docker compose down
```

> **Note**: `POSTGRES_PASSWORD` in your `.env` must match what docker-compose uses. The docker-compose reads from the same `.env` file at the repository root — copy your backend `.env` values there or keep a single `.env` at the root.

---

## 🗄 Database Setup & Migrations

From the `backend/` directory, with the virtual environment active:

### Run all migrations

```bash
alembic upgrade head
```

### Verify current migration state

```bash
alembic current
# Expected: ef3755e0a2a7 (head)
```

### Check for schema drift

```bash
alembic check
# Expected: No new upgrade operations detected.
```

### Migration history

| Revision | Description |
|----------|-------------|
| `69f12bff9124` | Create initial ClubOps tables (clubs, members, events, attendance) |
| `762307c126bf` | Add unique constraint to club name |
| `ef3755e0a2a7` | Create users table with RBAC |

---

## 🖥 Backend Startup

### Development (with hot-reload)

```bash
# From backend/
uvicorn app.main:app --reload --port 8000
```

### Production (no --reload)

```bash
# From backend/
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
```

The API will be available at `http://localhost:8000`.

---

## 🌐 Frontend Startup

From the **repository root**:

```bash
# Install dependencies (first time only)
npm install

# Copy and configure environment
Copy-Item .env.example .env.local     # Windows
# cp .env.example .env.local          # macOS/Linux

# Edit .env.local:
# VITE_API_BASE_URL=http://localhost:8000
# VITE_API_MODE=api

# Start development server
npm run dev
```

Frontend available at `http://localhost:5173`.

### Production build

```bash
npm run build
# Output: dist/ directory
```

---

## 🧪 Testing

From the `backend/` directory:

```bash
# Run all tests with verbose output
python -m pytest tests -v

# Run a specific test file
python -m pytest tests/test_analytics.py -v

# Run with short traceback
python -m pytest tests -v --tb=short
```

**Expected result**: `144 passed` (zero failures).

The test suite uses an isolated PostgreSQL test database (`clubops_test`). No production data is affected.

### Test coverage by module

| Test File | Tests | Module |
|-----------|-------|--------|
| `test_auth.py` | 18 | Authentication & JWT |
| `test_clubs.py` | 15 | Clubs CRUD |
| `test_members.py` | 13 | Members CRUD |
| `test_events.py` | 13 | Events CRUD |
| `test_attendance.py` | 14 | Attendance records |
| `test_users.py` | 15 | User profile |
| `test_analytics.py` | 15 | Analytics endpoints |
| `test_ai.py` | 8 | AI client & service |
| `test_ai_copilot.py` | 7 | AI Copilot endpoint |
| `test_meeting_intelligence.py` | 14 | Meeting analysis |
| `test_cors.py` | 11 | CORS middleware |
| `test_health.py` | 1 | Health check |

---

## 📚 API Documentation

With the backend running, visit:

| URL | Description |
|-----|-------------|
| `http://localhost:8000/docs` | Swagger UI (interactive) |
| `http://localhost:8000/redoc` | ReDoc (read-only) |
| `http://localhost:8000/health` | Liveness probe |
| `http://localhost:8000/health/ready` | Readiness probe (DB ping) |

### API Groups visible in Swagger

- **auth** — Register, Login, Me
- **users** — User profile
- **clubs** — Club management
- **members** — Roster management
- **events** — Event scheduling
- **attendance** — Attendance records
- **analytics** — Metrics & reporting
- **ai** — Copilot, Planner, Insights, Meeting Intelligence

---

## 🔐 Authentication

ClubOps AI uses **JWT Bearer tokens** with Argon2-hashed passwords.

### Register a new user

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","full_name":"Alice","password":"SecurePass123!"}'
```

### Login and get a token

```bash
curl -X POST http://localhost:8000/auth/login \
  -d "username=alice&password=SecurePass123!"
```

Response:
```json
{"access_token": "eyJ...", "token_type": "bearer"}
```

### Call a protected endpoint

```bash
curl http://localhost:8000/clubs/ \
  -H "Authorization: Bearer eyJ..."
```

### Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access to all endpoints |
| `manager` | Create/edit clubs, events, members; access analytics and AI |
| `member` | Read own profile; read clubs/events (limited) |

---

## 🤖 AI Configuration

The AI layer is **optional**. All non-AI endpoints work without `AI_API_KEY`.

To enable AI features:

1. Obtain an OpenAI API key (or compatible provider key).
2. Set in `backend/.env`:
   ```
   AI_API_KEY=sk-...your-key-here...
   AI_MODEL=gpt-4o-mini
   ```
3. Restart the backend.

When `AI_API_KEY` is empty:
- All AI endpoints return `503 Service Unavailable`
- The rest of the application continues normally
- No crash, no secret exposure

---

## 🌱 Demo Data & Credentials

Load realistic demo data using the included seed script:

```bash
# From backend/
python scripts/seed_demo.py
```

This is **idempotent** — running it multiple times produces no duplicates and no errors.

### Demo credentials

| Username | Password | Role |
|----------|----------|------|
| `admin` | `AdminPass123!` | admin |
| `manager` | `ManagerPass123!` | manager |
| `member1` | `MemberPass123!` | member |

### Seeded data

- **Club**: Ahmedabad AI Community
- **Club Members**: Priya Sharma, Rohan Mehta, Anjali Patel, Dev Kapoor
- **Events**: AI Workshop 2026 (past), Hackathon Sprint (past), Guest Lecture: LLMs (upcoming)
- **Attendance**: Realistic present/absent records for all past events

---

## 🎬 Demo Flow

Follow these 22 steps to demonstrate ClubOps AI end-to-end:

1. Open `http://localhost:5173`
2. Login as `admin` / `AdminPass123!`
3. View the dashboard overview
4. Navigate to **Analytics** — verify attendance rates
5. Open **Clubs** — see "Ahmedabad AI Community"
6. Click the club — view detail page
7. Navigate to **Members** — see 4 roster entries
8. Click **Add Member** — add a 5th test member
9. Navigate to **Events** — see 3 events
10. Click **Create Event** — add a new upcoming event
11. Open an existing event (AI Workshop 2026)
12. Navigate to **Attendance** — see present/absent records
13. Mark a member's attendance as present
14. Return to **Analytics** — verify the updated rate
15. Open **AI Copilot** — type "What events does the club have?"
16. Review the AI response grounded in real data
17. Click **Generate Event Plan** — enter event details
18. Review the structured agenda, tasks, and risks
19. Open **Meeting Intelligence** — paste a meeting transcript
20. View the extracted summary, decisions, and action items
21. Logout and login as `member1` / `MemberPass123!`
22. Verify restricted access (analytics and AI not visible/accessible)

---

## 🔧 Troubleshooting

### Database connection refused

**Symptom**: `connection refused` or `could not connect to server`

**Fix**:
```bash
# Check Docker is running and PostgreSQL is healthy
docker compose ps

# Restart if needed
docker compose down
docker compose up -d

# Verify DATABASE_URL matches your .env values
```

### Alembic migration fails

**Symptom**: `Target database is not up to date`

**Fix**:
```bash
alembic upgrade head
alembic current
```

### `pytest` cannot find test database

**Symptom**: Test suite fails to connect

**Fix**: Ensure the test database exists. The `conftest.py` expects:
```
postgresql+psycopg://clubops:ClubOpsDev2026@localhost:55432/clubops_test
```
Create it:
```bash
docker exec -it <postgres-container> psql -U clubops -c "CREATE DATABASE clubops_test;"
```

### AI endpoints return 503

**Symptom**: `AI service is currently unavailable or unconfigured`

**Fix**: Add a valid `AI_API_KEY` to `backend/.env`, or this is expected behavior when running without AI.

### Port already in use

**Symptom**: `[Errno 98] Address already in use`

**Fix**:
```bash
# Kill whatever is on port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <pid> /F
```

---

## 🔒 Security Notes

- `.env` is in `.gitignore` — **never tracked by Git**
- Passwords hashed with **Argon2** (pwdlib)
- JWT tokens expire after 30 minutes (configurable)
- Every response includes security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security` (HSTS)
- CORS restricted to configured origins
- RBAC enforced at dependency level — not just route level
- AI endpoints require `manager` or `admin` role
- No password hashes exposed in any API response

---

*ClubOps AI — Parts 02B through 08 complete.*