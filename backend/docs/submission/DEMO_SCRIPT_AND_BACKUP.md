# 🎬 ClubOps AI — 5–10 Minute Demo Script & Contingency Plan

This document contains the step-by-step demonstration script for presenting ClubOps AI to evaluators, complete with standard demo credentials, talking points, and contingency fallback procedures.

---

## 1. Demo Credentials & Seed Data Baseline

Ensure the database has been seeded before starting:
```powershell
python scripts/seed_demo.py
```

### Pre-Seeded Accounts:
| Role | Username | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin` | `AdminPass123!` | System-wide configuration, all clubs, full management |
| **Manager**| `manager` | `ManagerPass123!` | Club operations, events, attendance, AI planners, meeting intelligence |
| **Member** | `member1` | `MemberPass123!` | Read-only club view, personal attendance, general Copilot |

### Pre-Seeded Operational Entities:
- **Club**: "Ahmedabad AI Community" (ID: 1)
- **Members**: Priya Sharma, Rohan Mehta, Anjali Patel, Dev Kapoor
- **Events**:
  1. *AI Workshop 2026* (Past) — 75% attendance recorded
  2. *Hackathon Sprint* (Past) — 75% attendance recorded
  3. *Guest Lecture: LLMs* (Upcoming) — Scheduled for next week

---

## 2. Seven-Scene Demonstration Script (7–10 Minutes)

### ⏱ Scene 1 — Introduction (1 Minute)
- **Presenter Action**: Display the ClubOps AI architecture slide or landing screen.
- **Narrative**:
  > *"ClubOps AI is a unified operations platform designed for student and community organizations. It solves the everyday chaos of scattered spreadsheets, unrecorded meeting decisions, and opaque attendance by connecting club management, event tracking, real-time analytics, and an operational AI Copilot grounded in verified database records."*
- **Key Highlight**: Point out that AI is directly integrated with PostgreSQL rather than operating as an isolated chatbot.

---

### ⏱ Scene 2 — Authentication & Role-Aware Dashboard (1 Minute)
- **Presenter Action**: Log in as `manager` (`ManagerPass123!`).
- **Narrative**:
  > *"We begin by authenticating as a Club Manager. Upon login, an Argon2-verified password authenticates the user, and an HS256 JWT Bearer token is issued. The dashboard immediately renders real metrics aggregated directly from PostgreSQL."*
- **Key Highlight**: Show the dashboard overview showing total clubs, total members, upcoming events, and current attendance percentage.

---

### ⏱ Scene 3 — Core Club Operations (1.5 Minutes)
- **Presenter Action**: Navigate to **Clubs** ➔ **Ahmedabad AI Community** ➔ **Events** ➔ **Attendance**.
- **Narrative**:
  > *"Organizers can view the roster of 4 active members and schedule new events. Notice the event 'Guest Lecture: LLMs' scheduled for next week. In the Attendance module, managers can toggle attendance records between 'present' and 'absent'. Every update writes transactionally to PostgreSQL with composite unique constraints preventing duplicate logging."*
- **Key Highlight**: Demonstrate changing attendance for Dev Kapoor from absent to present.

---

### ⏱ Scene 4 — Real-Time Operational Analytics (1 Minute)
- **Presenter Action**: Navigate to **Analytics**.
- **Narrative**:
  > *"Notice that analytics metrics are not hardcoded or fabricated. The backend runs live SQL aggregations over the attendance and events tables to compute the 75% attendance rate and active participation trends. As attendance is marked, metrics update accurately."*

---

### ⏱ Scene 5 — Grounded AI Copilot & Meeting Intelligence (2.5 Minutes)
- **Presenter Action**: Open **AI Copilot** and submit query:
  ```text
  "What are the upcoming events for Ahmedabad AI Community?"
  ```
- **Narrative**:
  > *"The AI Copilot does not hallucinate. The backend first executes a SQL grounding query to retrieve verified database records for Ahmedabad AI Community. The prompt injects this exact context. The response accurately lists 'Guest Lecture: LLMs' along with its exact schedule."*
- **Presenter Action**: Navigate to **Meeting Intelligence**, paste a sample meeting transcript, and click **Analyze**:
  ```text
  "Meeting Date: March 15. Attendees: Priya, Rohan, Dev.
  Decision: We will host a hands-on LangChain workshop on April 10th.
  Action: Priya will draft the registration form by Friday.
  Action: Rohan will reserve the main auditorium by Wednesday."
  ```
- **Narrative**:
  > *"The meeting intelligence engine parses unstructured discussion into an executive summary, cataloged decisions, and discrete action items with assigned owners."*

---

### ⏱ Scene 6 — Security Boundaries & RBAC Enforcement (1 Minute)
- **Presenter Action**: Log out and log in as `member1` (`MemberPass123!`).
- **Narrative**:
  > *"When logged in as a standard member, administrative and event creation routes are locked down. If an unauthorized user attempts an admin API operation, FastAPI dependency injection intercepts the request and responds with HTTP 403 Forbidden. Security is enforced at the backend dependency layer, not merely in UI visibility."*

---

### ⏱ Scene 7 — Closing, Testing & Architecture (1 Minute)
- **Presenter Action**: Display Swagger UI (`/docs`) and terminal showing 144 passing tests.
- **Narrative**:
  > *"In summary, ClubOps AI provides complete operational continuity backed by 144 automated tests with a 100% pass rate, Alembic migration versioning, and strict security headers. The software is feature-complete, frozen, and available on GitHub."*

---

## 3. Contingency & Backup Plans

### Fallback A: Live Network or Wi-Fi Disruption
- **Action**: Run the application entirely locally on `http://127.0.0.1:8000` and `http://127.0.0.1:5173`.
- **Backend Startup**:
  ```powershell
  uvicorn app.main:app --host 127.0.0.1 --port 8000
  ```
- **Fallback Materials**: If the local dev server is unavailable, present the pre-rendered architecture diagrams, the Swagger UI specification, and the pre-generated test results in `backend/docs/submission/`.

### Fallback B: Upstream AI Provider Rate Limit or Failure
- **Symptom**: Upstream model provider returns HTTP 429 or 503.
- **Graceful Behavior**:
  - The backend catches `httpx.TimeoutException` or upstream errors and returns a clean JSON error: `{"detail": "AI service is currently unavailable or unconfigured"}`.
  - Core non-AI modules (Auth, Clubs, Members, Events, Attendance, Analytics) remain **100% functional**.
  - **Presenter Talking Point**:
    > *"Notice our graceful degradation architecture: if the external AI provider is unreachable, the system continues serving all operational records without crashing or leaking API credentials."*
