# 🌐 ClubOps AI — Frontend Application

[![React](https://img.shields.io/badge/React-19.2.6-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.17-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![React Router](https://img.shields.io/badge/React_Router-7.18.4-CA4245?logo=react-router&logoColor=white)](https://reactrouter.com/)

The **ClubOps AI Frontend** is a modern, reactive single-page operations command center crafted for collegiate clubs, student societies, and event organizers. Engineered with React 19, TypeScript, Vite, and Tailwind CSS v4, it provides complete operational oversight across event logistics, tasks, volunteer coordination, risk governance, and AI-assisted workflows.

---

## ✨ Features & Capabilities

### 📊 1. Operations Command Dashboard (`/dashboard`)
- **Executive AI Briefing**: Context-aware operational digest summarizing event readiness, volunteer coverage gaps, and blocked dependencies with copy and export functionality.
- **Operational Summary Export**: One-click download of the complete operational state as structured JSON.
- **Real-Time KPI Metrics**: Active tasks, volunteer headcount, pending permits, and open risks.
- **Modular Dashboard Widgets**:
  - `AIDailyBrief`: Contextual operational digest generation.
  - `DashboardHeader`: Context header with quick actions and event switcher.
  - `DashboardSection`: Reusable collapsible dashboard section wrapper.
  - `EventProgress`: Multi-phase readiness meter.
  - `OverviewStats`: KPI cards with trend indicators.
  - `PriorityTasks`: Urgent item queues with status filtering.
  - `RecentActivity`: Real-time audit log and event updates.
  - `RiskSummary`: High-priority operational risks with mitigation suggestions.
  - `UpcomingDeadlines`: Chronologically sorted milestone timeline.
  - `VolunteerSnapshot`: Real-time volunteer coverage and attendance.
- **Event Context Header**: Seamlessly switch between active events with live readiness progress gauges.

### 📋 2. Comprehensive Task Tracker (`/events/:id/tasks`)
- **Dual-View Workflow**: Switch between interactive Kanban cards (`TaskCard.tsx`) and dense data table rows (`TaskRow.tsx`, `TaskTable.tsx`).
- **Status Workflows**: `To Do`, `In Progress`, `Blocked`, and `Completed`.
- **Priority Tiering**: `Critical`, `High`, `Medium`, and `Low` with visual badges and urgency scoring.
- **Deadline Intelligence**: Automated categorization for overdue items, items due today, and upcoming milestones (`taskDateUtils.ts`).
- **Interactive Modals & Forms**: Create, edit, reassign, and delete tasks with instant optimistic updates (`TaskForm.tsx`).
- **Comprehensive Filters**: Filter by status, priority, assignee, and search query.

### 🤝 3. Complete Volunteer Management Subsystem (`/events/:id/volunteers`)
- **Volunteer Directory & Roster**: Searchable and filterable volunteer grid and list views with status badges (`Confirmed`, `Pending`, `Unavailable`).
- **Role & Department Breakdown**: Departmental categorization across Stage, Registration, Logistics, Safety, Media, and Hospitality.
- **Comprehensive Profiles & Detail Views (`/events/:id/volunteers/:volunteerId`)**:
  - Full volunteer biography, contact information (email, phone, student ID), and dietary preferences.
  - Assigned shifts, tasks, supervisor details, and check-in / attendance records.
- **Volunteer Creation & Editing (`/events/:id/volunteers/new`, `.../edit`)**: Dedicated responsive form pages for onboarding and modifying volunteer details.
- **Volunteer Metrics & KPIs (`VolunteerStats.tsx`)**: Total volunteers, confirmed headcount, pending onboarding, and department coverage rates.
- **Dual-Mode Volunteer Service (`volunteerService.ts`)**: Supports mock persistence with localStorage synchronization and live REST API endpoints.

### 📅 4. Multi-Event Hub & Management (`/events`)
- Multi-event workspace for tracking concurrent club initiatives.
- Lifecycle filtering (`Planning`, `Active`, `Completed`, `On Hold`).
- Event creation and editing modal (`EventForm.tsx`) with validation, venue, dates, and budget details.

### ⚡ 5. Dedicated Event Sub-Workspaces (`/events/:eventId/*`)
Each event provides focused sub-workspaces:
- **📌 Overview (`/events/:id`)**: High-level health index, quick navigation, and recent activity logs.
- **✅ Tasks & Kanban (`/events/:id/tasks`)**: Comprehensive task tracker, Kanban board, and assignees.
- **🤝 Volunteers & Rosters (`/events/:id/volunteers`)**: Full volunteer subsystem with rosters, creation, detail, and edit workflows.
- **🛡️ Risk Register (`/events/:id/risks`)**: Risk matrix categorizing risks by severity (High, Medium, Low) and likelihood, mitigation action trackers, and AI predictive risk signals.
- **📝 Meetings & Minutes (`/events/:id/meetings`)**: Meeting scheduler, agenda creator, attendee tracking, decisions log, and action item extractor.
- **📁 Document Vault (`/events/:id/documents`)**: Centralized repository for permits, budget approvals, proposals, and marketing assets with status badges.
- **📢 Announcements (`/events/:id/announcements`)**: Broadcast announcements with audience targeting and priority flags.
- **🤖 AI Copilot (`/events/:id/ai`)**: Grounded AI conversation interface with suggested prompts, citation previews, and operational drafting tools.

### 🔐 6. Authentication & RBAC (`/login`)
- Role-based views:
  - **Event Head**: Direct event operational control.
  - **President**: Club-wide governance and oversight.
  - **Volunteer**: Task assignments and shift schedules.
  - **Faculty Advisor**: Compliance, safety, and risk monitoring.
- Zero-backend **Mock Development Mode** with preloaded demo profiles and one-click quick-fill buttons.

### 🎨 7. Modern Design System & Foundations (`/foundation`)
- Semantic color token system (`canvas`, `surface`, `brand`, `line`, `danger`, `warning`, `success`).
- **Dark Mode / Light Mode** theme switching with system preference detection and localStorage persistence.
- Complete UI atomic component suite (`Button`, `Badge`, `Card`, `StatCard`, `Input`, `Dropdown`, `Breadcrumb`, `Progress`, `EmptyState`, `ErrorState`, `LoadingState`).

---

## 🏗️ Architecture & Directory Structure

```text
frontend/
├── public/                     # Static assets & icons
├── src/
│   ├── components/             # Reusable UI, Layout, Dashboard, Event, Task & Volunteer components
│   │   ├── auth/               # Route guards & auth checks (ProtectedRoute.tsx)
│   │   ├── common/             # PlannedCapabilities, PreviewNotice
│   │   ├── dashboard/          # Modular Dashboard widgets (AIDailyBrief, OverviewStats, etc.)
│   │   ├── event/              # Event management components (EventForm.tsx)
│   │   ├── layout/             # Navigation, Sidebar, Topbar, Header, Switcher
│   │   ├── task/               # Task components (TaskTable, TaskCard, TaskForm, TaskFilters, etc.)
│   │   ├── volunteer/          # Volunteer components (VolunteerList, VolunteerForm, VolunteerStats, etc.)
│   │   └── ui/                 # Design system atomic components (Button, Badge, Card, etc.)
│   ├── context/                # React Contexts (AuthContext, EventContext, ThemeContext)
│   ├── data/                   # Demo data sets (demoEvents, demoNotifications, mockDashboardData, mockTasks, mockVolunteers)
│   ├── hooks/                  # Custom hooks (useEvent, useEvents, useTasks, useVolunteers, useSectionData, useMediaQuery)
│   ├── lib/                    # Utilities (auth, cn, format, status, navigation, eventForm, taskDateUtils, volunteer)
│   ├── pages/                  # Application view routes
│   │   ├── event/              # Event sub-pages (Tasks, Volunteers, Copilot, Risks, Meetings, Documents, etc.)
│   │   ├── DashboardPage.tsx   # Executive command dashboard
│   │   ├── EventsPage.tsx      # All events listing and creation
│   │   ├── FoundationPage.tsx  # UI component gallery & design tokens
│   │   ├── LoginPage.tsx       # Auth login with demo quick-fills
│   │   ├── SettingsPage.tsx    # User and application settings
│   │   └── NotFoundPage.tsx    # 404 handler
│   ├── routes/                 # Application routing tree (AppRoutes.tsx)
│   ├── services/               # API clients (apiMode, authService, dashboardService, eventService, taskService, volunteerService, http)
│   ├── styles/                 # CSS tokens and base stylesheets (base.css, tokens.css)
│   ├── types/                  # TypeScript interface & type definitions (auth, dashboard, event, task, volunteer, ui)
│   ├── App.tsx                 # Root application component
│   ├── index.css               # Global stylesheet with Tailwind v4
│   └── main.tsx                # Application entry point
├── .env.example                # Frontend environment template
├── index.html                  # HTML template
├── package.json                # Scripts and dependencies
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite build configuration with singlefile bundle
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or later
- **npm**: v9.0.0 or later (or `pnpm` / `yarn`)

### Installation & Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment (optional):**
   ```bash
   cp .env.example .env
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Navigate to [http://localhost:5173](http://localhost:5173)

4. **Build for production:**
   ```bash
   npm run build
   ```
   An optimized bundle will be compiled into the `dist/` directory.

5. **Preview production bundle:**
   ```bash
   npm run preview
   ```

---

## 🔑 Demo Login Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Event Head** | `rahul@clubops.dev` | `clubops2026` |
| **President** | `president@clubops.dev` | `clubops2026` |
| **Volunteer** | `volunteer@clubops.dev` | `clubops2026` |
| **Faculty Advisor** | `faculty@clubops.dev` | `clubops2026` |

---

## ⚙️ Environment Configuration

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_MODE` | `"mock"` \| `"api"` | `"mock"` | Toggle between offline in-memory mock services and live backend API |
| `VITE_API_BASE_URL` | `string` | `"/api"` | Backend REST API root endpoint |

---

## 📄 License

Distributed under the MIT License. See [LICENSE](../LICENSE) for details.
