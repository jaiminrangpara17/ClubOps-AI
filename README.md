# 🌟 ClubOps AI — Intelligent Event Operations Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?logo=react&logoColor=black)](frontend/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](backend/)
[![Python AI](https://img.shields.io/badge/AI_Engine-Python_3.11-3776AB?logo=python&logoColor=white)](ai/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16-4169E1?logo=postgresql&logoColor=white)](docker-compose.yml)

**ClubOps AI** is an end-to-end intelligent operations platform engineered to streamline event planning, volunteer coordination, risk governance, meeting documentation, and executive decision-making for collegiate clubs, student societies, and community organizations.

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
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 | Executive operations command center, modular dashboard widgets, interactive Kanban tasks, volunteer management, risk register, document vault, and AI copilot interface. | [Frontend Guide](frontend/README.md) |
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
The web dashboard will be available at `http://localhost:5173`.

### 4. Start the AI Engine Service
```bash
cd ai
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env            # Configure LLM API key
uvicorn app.main:app --reload --port 8001
```
Interactive AI documentation will be available at `http://localhost:8001/docs`.

### 5. Start the Backend API
```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Interactive API documentation will be available at `http://localhost:8000/docs`.

---

## ⚡ Core Platform Capabilities

### 📊 1. Operations Command Dashboard (`/dashboard`)
- **Interactive Executive AI Briefing**: On-demand AI-generated operational digests summarizing event readiness, volunteer coverage gaps, and blocked dependencies with copy and export functionality.
- **Operational Summary Export**: One-click download of the complete operational state as structured JSON.
- **Real-Time KPI Cards**: Active tasks, volunteer headcount, pending permits, and open risks.
- **Modular Dashboard Widgets**: `AIDailyBrief`, `DashboardHeader`, `DashboardSection`, `EventProgress`, `OverviewStats`, `PriorityTasks`, `RecentActivity`, `RiskSummary`, `UpcomingDeadlines`, `VolunteerSnapshot`.
- **Event Context Header**: Switch between active events with live readiness progress gauges.

### 📅 2. Event Hub & Workspaces (`/events`, `/events/:id/*`)
- **Event Hub (`/events`)**: Multi-event workspace with lifecycle filtering (`Planning`, `Active`, `Completed`, `On Hold`) and event creation modals.
- **📌 Event Overview (`/events/:id`)**: High-level health index, quick navigation, and recent activity streams.
- **✅ Tasks & Kanban Board (`/events/:id/tasks`)**: Kanban workflow (`To do`, `In progress`, `Blocked`, `Done`), search filters, priority tagging, assignees, and due dates.
- **🛡️ Risk Register (`/events/:id/risks`)**: Risk matrix categorizing risks by severity (High, Medium, Low) and likelihood, mitigation action trackers, and AI predictive risk signals.
- **🤝 Volunteers & Rosters (`/events/:id/volunteers`)**: Volunteer rosters, role assignment (Stage, Registration, Logistics, Safety), shift allocation, search, and status management.
- **📝 Meetings & Minutes (`/events/:id/meetings`)**: Meeting scheduler, agenda creator, attendee tracking, decisions log, and action item extractor.
- **📁 Document Vault (`/events/:id/documents`)**: Centralized repository for permits, budget approvals, proposals, and marketing assets.
- **📢 Announcements (`/events/:id/announcements`)**: Broadcast announcements with audience targeting and priority flags.
- **🤖 AI Copilot (`/events/:id/ai`)**: Grounded AI conversation interface with suggested prompts, citation previews, and operational drafting tools.

### 🔐 3. Authentication & RBAC (`/login`)
- Role-based views:
  - **Event Head**: Direct event operational control.
  - **President**: Club-wide governance and oversight.
  - **Volunteer**: Task assignments and shift schedules.
  - **Faculty Advisor**: Compliance, safety, and risk monitoring.
- Zero-backend **Mock Development Mode** with preloaded demo profiles and one-click quick-fill buttons.

### 🎨 4. Design System & Foundations (`/foundation`)
- Semantic color token system (`canvas`, `surface`, `brand`, `line`, `danger`, `warning`, `success`).
- **Dark Mode / Light Mode** theme switching with system preference detection and localStorage persistence.
- Complete UI atomic component suite (`Button`, `Badge`, `Card`, `StatCard`, `Input`, `Dropdown`, `Breadcrumb`, `Progress`, `EmptyState`, `ErrorState`, `LoadingState`).

---

## 🔑 Demo Login Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Event Head** | `rahul@clubops.dev` | `clubops2026` |
| **President** | `president@clubops.dev` | `clubops2026` |
| **Volunteer** | `volunteer@clubops.dev` | `clubops2026` |
| **Faculty Advisor** | `faculty@clubops.dev` | `clubops2026` |

---

## 🧪 Testing & Verification

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
