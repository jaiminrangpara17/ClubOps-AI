# 🌟 ClubOps AI — Intelligent Event Operations Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?logo=react&logoColor=black)](frontend/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](backend/)
[![Python AI](https://img.shields.io/badge/AI_Engine-Python_3.11-3776AB?logo=python&logoColor=white)](ai/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16-4169E1?logo=postgresql&logoColor=white)](docker-compose.yml)

**ClubOps AI** is an end-to-end intelligent operations platform designed to streamline event planning, volunteer coordination, risk governance, meeting documentation, and executive decision-making for collegiate clubs, student societies, and community organizations.

---

## 🏛️ Monorepo Architecture

The repository is structured as a modular monorepo containing three core services and containerized infrastructure:

```text
ClubOps-AI/
├── 🌐 frontend/         # React 19 web application (Vite, TypeScript, Tailwind CSS v4)
├── ⚙️ backend/          # Core FastAPI REST backend & PostgreSQL integration
├── 🧠 ai/               # AI Engine: LLM integrations, Event Planner, validators & prompts
├── 🐳 docker-compose.yml# PostgreSQL 16 local database development environment
├── 📄 .env.example      # Global environment configuration template
└── 📖 README.md         # Monorepo documentation & quick-start guide
```

---

## 📦 Services Breakdown

| Service | Technology | Description | Documentation |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 | Executive operations command center, interactive Kanban tasks, volunteer management, risk register, document vault, and AI copilot interface. | [Frontend Guide](frontend/README.md) |
| **Backend** | Python, FastAPI, Uvicorn, PostgreSQL | RESTful API endpoints for club governance, member authentication, event persistence, and operational records. | [Backend Guide](backend/README.md) |
| **AI Engine** | Python 3.11, Pydantic, LLM Client | Domain-specific LLM intelligence for event schedule generation, action validation, automated risk detection, and daily briefings. | [AI Engine Guide](ai/README.md) |
| **Database** | PostgreSQL 16 Alpine (Docker) | Containerized relational database for persistent club operations. | [docker-compose.yml](docker-compose.yml) |

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/jaiminrangpara17/ClubOps-AI.git
cd ClubOps-AI
```

### 2. Start PostgreSQL Database
```bash
docker compose up -d
```

### 3. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
The web dashboard is now running at `http://localhost:5173`.

### 4. Start the AI Engine Service
```bash
cd ai
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env            # Configure LLM API key
uvicorn app.main:app --reload --port 8001
```

### 5. Start the Backend API
```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## ⚡ Core Features

### 📊 Executive Operations Command Center
- **AI Daily Briefing**: Synthesizes real-time readiness status, critical blockers, and action suggestions.
- **KPI Metrics**: Real-time stats on volunteer coverage, pending permits, and open risks.
- **Export Summary**: Instant JSON export of active event operations.

### 🗓️ Event Workspace & Execution
- **Task Management**: Kanban board workflow (`To do`, `In progress`, `Blocked`, `Done`) with priority badges and assignees.
- **Risk Register**: Proactive risk matrix categorizing operational hazards by severity, likelihood, and mitigation steps.
- **Volunteer Coordination**: Shift allocation, role rosters, and real-time attendance tracking.
- **Meetings & Minutes**: Decision logs, agenda planning, and automated action item extraction.
- **Document Vault**: Central repository for permits, budget sheets, and logistics guides.
- **AI Copilot**: Interactive context-aware assistant for drafting announcements, task breakdowns, and operational schedules.

### 🔐 Multi-Role Access Control (RBAC)
Supports specialized views for:
- 👑 **President / Lead Organizer**: High-level governance and approvals.
- 🎯 **Event Head**: Direct event planning and execution.
- 🤝 **Volunteers**: Assigned tasks, shifts, and check-in schedules.
- 🎓 **Faculty Advisor**: Compliance oversight and risk mitigation logs.

---

## 🔑 Demo Access

For rapid local testing and development without a live backend, the frontend comes with pre-configured demo profiles:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Event Head** | `rahul@clubops.dev` | `clubops2026` |
| **President** | `president@clubops.dev` | `clubops2026` |
| **Volunteer** | `volunteer@clubops.dev` | `clubops2026` |
| **Faculty Advisor** | `faculty@clubops.dev` | `clubops2026` |

---

## 🧪 Testing & Validation

### Run Frontend Build & Verification
```bash
cd frontend
npm run build
```

### Run AI Service Tests
```bash
cd ai
pytest -v
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
