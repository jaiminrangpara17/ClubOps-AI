# ⚡ ClubOps AI - Frontend Operations Hub

<div align="center">

![ClubOps AI](https://img.shields.io/badge/ClubOps-Frontend%20Hub-4F46E5?style=for-the-badge&logo=react&logoColor=white)

**Executive Operations Command Center, Event Intelligence, Task Boards, Volunteer Rostering & Meeting Intelligence**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![React Router](https://img.shields.io/badge/React_Router-v7.1-CA4245?style=flat-square&logo=react-router&logoColor=white)](https://reactrouter.com/)

</div>

---

## 📖 Overview

The **ClubOps AI Frontend** is a modern, responsive web application engineered to serve as the unified operating system for club leads, event coordinators, volunteers, and faculty advisors. It combines a resilient multi-section dashboard, granular task boards, end-to-end volunteer management, AI-driven meeting intelligence, and an interactive design foundation.

---

## ✨ Core Subsystems & Pages

### 📊 1. Operations Command Dashboard (`/dashboard`)
- **Multi-Section Asynchronous Loading**: Independent section loaders (`useSectionData`) ensure a failure in one subsystem never causes a cascade failure across the dashboard.
- **Executive AI Briefing (`AIDailyBrief.tsx`)**: Automated AI daily digest summarizing readiness score, volunteer staffing deficits, and critical path blockers.
- **KPI Metrics & Risk Heatmaps (`OverviewStats.tsx`, `RiskSummary.tsx`)**: High/medium/low severity indicators, progress gauges, and budget tracking.
- **Priority Tasks & Deadlines (`PriorityTasks.tsx`, `UpcomingDeadlines.tsx`)**: Real-time urgent action radar.
- **Volunteer Health Snapshot (`VolunteerSnapshot.tsx`)**: Quick glimpse of departmental coverage and active volunteers.

### 📝 2. Meeting Intelligence Subsystem (`/events/:eventId/meetings/*`)
- **Meeting Directory & Filtering (`/events/:eventId/meetings`)**:
  - Filter by timeframe (*Upcoming*, *Past*, *All*), meeting status (*Scheduled*, *Held*, *Cancelled*), and AI processing status (*Not Processed*, *Processing*, *Completed*, *Failed*).
  - Search by meeting title, agenda topics, and organizer name.
  - Quick KPI stats: total meetings, upcoming sessions, processing queue, extracted decisions, and action items.
- **Meeting Detail & Intelligence Hub (`/events/:eventId/meetings/:meetingId`)**:
  - **Structured Agenda & Minutes**: Full meeting timeline, location, organizer, and participant badges.
  - **Transcript Management**: Ingest and update meeting transcripts and raw notes.
  - **AI Intelligence Processing**: Trigger async NLP extraction of **Key Decisions** and **Action Items** from raw transcript data.
  - **1-Click Task Conversion (`createTaskFromActionItem`)**: Convert extracted action items directly into live operational tasks assigned to team members with due dates and priority tags.
- **Meeting Creation & Editing (`/meetings/new`, `/meetings/:meetingId/edit`)**:
  - Form validation with date pickers, participant multi-selectors, and location inputs.

### 👥 3. Volunteer Management & Rostering (`/events/:eventId/volunteers/*`)
- **Roster & Directory (`/events/:eventId/volunteers`)**: Search, filter by department (Stage, Registration, Logistics, Safety, Media, Hospitality), and status (`Confirmed`, `Pending`, `Unavailable`).
- **Volunteer Profile View (`/events/:eventId/volunteers/:volunteerId`)**: Contact cards, assigned shifts, supervisor links, and emergency contacts.
- **Volunteer Add & Edit (`/volunteers/new`, `/volunteers/:volunteerId/edit`)**: Rapid onboarding and assignment modifications with optimistic UI cache updates.

### ✅ 4. Task Tracker & Kanban Board (`/events/:eventId/tasks`)
- **Dual-View Workflow**: Kanban board columns (`To do`, `In progress`, `Blocked`, `Done`) and structured tabular view.
- **Task Prioritization**: Multi-tier priority system (`Critical`, `High`, `Medium`, `Low`) with assignees and due dates.
- **Create & Edit Tasks**: Modal drawer for creating and modifying task metadata.

### 🤖 5. AI Copilot Hub (`/events/:eventId/ai`)
- **Contextual Copilot Interface**: Interactive conversation canvas with pre-built prompt suggestions (*"What is blocking day-1 readiness?"*, *"Summarise open risks by severity"*, *"Draft an update for the committee"*).
- **Grounded Responses**: Architecture ready to cite live event documents, tasks, and meeting decisions.

### 🎨 6. Design System & Foundations (`/foundation`)
- Semantic tokens: `canvas`, `surface`, `surface-subtle`, `surface-inset`, `brand`, `line`, `danger`, `warning`, `success`, `info`.
- **Dark & Light Mode** toggle with system preference sync and persistent storage.
- Atomic component showcase: `Button`, `Badge`, `Card`, `StatCard`, `Input`, `Dropdown`, `Breadcrumb`, `Progress`, `EmptyState`, `ErrorState`, `LoadingState`.

---

## 📁 Directory Structure

```text
frontend/
├── src/
│   ├── components/
│   │   ├── auth/           # Protected route guards
│   │   ├── common/         # Modals, capability previews, dismiss helpers
│   │   ├── dashboard/      # Dashboard widgets (AIDailyBrief, RiskSummary, etc.)
│   │   ├── event/          # Event forms and dialogs
│   │   ├── layout/         # Header, Topbar, Sidebar, MobileNav, Layout wrappers
│   │   ├── meeting/        # Meeting cards, filters, forms, intelligence panels
│   │   ├── task/           # Task table, cards, forms, filters, badges
│   │   ├── ui/             # Atomic design system components
│   │   └── volunteer/      # Volunteer list, filters, forms, stats
│   ├── context/            # AuthContext, EventContext, ThemeContext
│   ├── data/               # In-memory mock repositories (Tasks, Volunteers, Meetings, Events)
│   ├── hooks/              # Custom hooks (useMeetings, useVolunteers, useTasks, etc.)
│   ├── lib/                # Formatters, auth utilities, status mappings
│   ├── pages/              # Top-level page routes
│   │   ├── event/          # Event sub-routes (Meetings, Tasks, Volunteers, AI, Risks, etc.)
│   │   ├── DashboardPage.tsx
│   │   ├── EventsPage.tsx
│   │   ├── FoundationPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── routes/             # AppRoutes definition
│   ├── services/           # Service layer with dual-mode (Mock API & REST HTTP API)
│   ├── styles/             # Global CSS & Design Tokens
│   ├── types/              # Comprehensive TypeScript definitions
│   ├── App.tsx             # Root application orchestrator
│   └── main.tsx            # React 19 entry point
├── .env.example            # Environment variables template
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build config
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_MODE` | `mock` for local offline development or `api` for live REST backend | `mock` |
| `VITE_API_BASE_URL` | Base URL for the backend REST API | `http://localhost:8000/api` |

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🔐 Demo Accounts (Mock Mode)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Event Lead** | `rahul@clubops.dev` | `clubops2026` |
| **President** | `president@clubops.dev` | `clubops2026` |
| **Volunteer** | `volunteer@clubops.dev` | `clubops2026` |
| **Faculty Advisor** | `faculty@clubops.dev` | `clubops2026` |

---

## 📄 License

Licensed under the [MIT License](../LICENSE).
