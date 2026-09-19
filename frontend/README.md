# 🚀 ClubOps AI — Frontend Application

[![React](https://img.shields.io/badge/React-19.2.6-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.17-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![React Router](https://img.shields.io/badge/React_Router-7.18.4-CA4245?logo=react-router&logoColor=white)](https://reactrouter.com/)

The **ClubOps AI Frontend** is a modern, responsive web application engineered to serve as the unified operations command center for student clubs, collegiate societies, community organizations, and non-profits.

---

## ✨ Features & Modules

### 📊 1. Operations Command Dashboard (`/dashboard`)
- **Interactive Executive AI Briefing**: On-demand AI-generated operational digests summarizing event readiness, volunteer coverage gaps, and blocked dependencies with copy and export functionality.
- **Operational Summary Export**: One-click download of the complete operational state as structured JSON.
- **Key Metrics & Statistics**: Real-time KPI cards covering active tasks, volunteers, pending items, and active risks.
- **Upcoming Deadlines & Priority Queues**: Filterable task deadlines sorted chronologically with status badges.
- **Event Context Header**: Switch between active events with real-time readiness progress gauges.

### 📅 2. Event Hub & Management (`/events`)
- Multi-event workspace for tracking concurrent club initiatives.
- Lifecycle filtering (`Planning`, `Active`, `Completed`, `On Hold`).
- Event creation modal with venue, dates, and budget details.

### ⚡ 3. Dedicated Event Workspaces (`/events/:eventId/*`)
Each event provides focused sub-workspaces:
- **📌 Overview (`/events/:id`)**: High-level health index, quick navigation, and recent activity logs.
- **✅ Tasks & Kanban Board (`/events/:id/tasks`)**: Kanban workflow (`To do`, `In progress`, `Blocked`, `Done`), search filters, task creator, priority tagging, assignees, and due dates.
- **🛡️ Risk Register (`/events/:id/risks`)**: Risk matrix categorizing risks by severity (High, Medium, Low) and likelihood, mitigation action trackers, and AI predictive risk signals.
- **🤝 Volunteers & Rosters (`/events/:id/volunteers`)**: Volunteer rosters, role assignment (Stage, Registration, Logistics, Safety), shift allocation, search, and status management.
- **📝 Meetings & Minutes (`/events/:id/meetings`)**: Meeting scheduler, agenda creator, attendee tracking, decisions log, and action item extractor.
- **📁 Document Vault (`/events/:id/documents`)**: Centralized repository for permits, budget approvals, proposals, and marketing assets with status badges.
- **📢 Announcements (`/events/:id/announcements`)**: Broadcast announcements with audience targeting and priority flags.
- **🤖 AI Copilot (`/events/:id/ai`)**: Grounded AI conversation interface with suggested prompts, citation previews, and operational drafting tools.

### 🔐 4. Authentication & RBAC (`/login`)
- Role-based views:
  - **Event Head**: Direct event operational control.
  - **President**: Club-wide governance and oversight.
  - **Volunteer**: Task assignments and shift schedules.
  - **Faculty Advisor**: Compliance, safety, and risk monitoring.
- Zero-backend **Mock Development Mode** with preloaded demo profiles and one-click quick-fill buttons.

### 🎨 5. Modern Design System & Foundations (`/foundation`)
- Semantic color token system (`canvas`, `surface`, `brand`, `line`, `danger`, `warning`, `success`).
- **Dark Mode / Light Mode** theme switching with system preference detection and localStorage persistence.
- Complete UI atomic component suite (`Button`, `Badge`, `Card`, `StatCard`, `Input`, `Dropdown`, `Breadcrumb`, `Progress`, `EmptyState`, `ErrorState`, `LoadingState`).

---

## 🏗️ Architecture & Directory Structure

```text
frontend/
├── public/                 # Static public assets
├── src/
│   ├── components/         # Reusable UI & Layout components
│   │   ├── auth/           # Route guards & auth checks
│   │   ├── common/         # Shared capability cards & notices
│   │   ├── layout/         # Navigation, Sidebar, Topbar, Header, Switcher
│   │   └── ui/             # Design system atomic components
│   ├── context/            # React Contexts (Auth, Event, Theme)
│   ├── data/               # Demo data sets (dashboard, events, tasks, risks)
│   ├── hooks/              # Custom hooks (media query, scroll lock, outside click)
│   ├── lib/                # Utilities (class names, formatting, status helpers)
│   ├── pages/              # Application view routes
│   │   ├── event/          # Event sub-pages (Tasks, Copilot, Risks, etc.)
│   │   ├── DashboardPage.tsx
│   │   ├── EventsPage.tsx
│   │   ├── FoundationPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── routes/             # App routing tree (AppRoutes.tsx)
│   ├── services/           # HTTP requests, mock auth, session management
│   ├── styles/             # Base CSS and token definitions
│   ├── types/              # TypeScript interface & type definitions
│   ├── App.tsx             # Root React application component
│   ├── index.css           # Global stylesheet with Tailwind v4
│   └── main.tsx            # Application entry point
├── index.html              # HTML template
├── package.json            # Scripts and dependencies
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build configuration with singlefile bundle
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

2. **Start development server:**
   ```bash
   npm run dev
   ```
   Navigate to [http://localhost:5173](http://localhost:5173)

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production bundle:**
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

## ⚙️ Environment Variables

Create `.env` or `.env.local` inside the `frontend/` directory:

```env
# API mode: 'mock' for local offline demo, or 'api' for backend integration
VITE_API_MODE=mock

# Backend URL when VITE_API_MODE=api
VITE_API_BASE_URL=http://localhost:8000
```
