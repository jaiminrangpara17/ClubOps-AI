# 🚀 ClubOps AI — Frontend Command Center

<div align="center">

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**The executive web dashboard and operational hub for ClubOps AI.**

[Subsystems](#-subsystems--modules) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure)

</div>

---

## 📖 Overview

The **ClubOps AI Frontend** is a single-page application built with React 19, TypeScript 5.9, Vite 7, and Tailwind CSS v4. It delivers a rich user experience for event leaders, coordinators, and volunteers—featuring zero-delay routing, resilient asynchronous data fetching, and an atomic design system.

---

## ✨ Subsystems & Modules

### 1. Executive Operations Dashboard (`/dashboard`)
- Real-time event statistics, day-1 readiness score, and countdown timers.
- Integrated AI executive briefing drawer summarizing blockers and risk levels.
- Full state snapshot export to JSON.

### 2. Task Tracker & Kanban Board (`/events/:id/tasks`)
- Interactive Kanban columns (`To do`, `In progress`, `Blocked`, `Done`) and dense list/table views.
- Priority levels: Critical, High, Medium, Low.
- Inline task creation, editing, status transitions, and assignee filtering.

### 3. Volunteer Coordination (`/events/:id/volunteers`)
- Full roster directory with search and departmental filtering (Stage, Registration, Logistics, Safety, Media, Hospitality).
- Availability tracking (`Confirmed`, `Pending`, `Unavailable`), emergency duty tags, and check-in times.
- Volunteer profile slide-out with shift assignments.

### 4. Meeting Intelligence (`/events/:id/meetings`)
- Schedule and archive meetings with agendas, location, and attendee rosters.
- Ingest raw meeting notes and transcripts.
- AI Intelligence extraction for Key Decisions and Action Items.
- 1-click conversion of action items into live tasks.

### 5. Document Hub & Asset Vault (`/events/:id/documents`)
- Structured file repository with categories (Floor Plans, Permits, Run-Sheets, Budgets, Sponsorships).
- Multipart simulated/real progress file uploader.
- Instant search and document metadata inspection panel.

### 6. Risk & Hazard Governance (`/events/:id/risks`)
- Severity and likelihood assessment matrix.
- Mitigation action planning linked to tasks and designated risk owners.
- Structured risk status transitions (`Open`, `Monitoring`, `Mitigated`, `Closed`).

### 7. Announcements & Broadcasts (`/events/:id/announcements`)
- Multi-channel delivery for all members, organizers, volunteers, and faculty.
- Pinned priority notices and read confirmation tracking.
- Create, edit, and archive announcement workflows.

### 8. AI Copilot Interface (`/events/:id/ai`)
- Grounded chat workspace for asking questions against live event data.
- Pre-built suggested prompts for blockers, volunteer gaps, and committee updates.

### 9. Design System & Foundation (`/foundation`)
- Complete color tokens for dark/light themes.
- Reusable UI component kit: `Button`, `Badge`, `Card`, `StatCard`, `Input`, `Dropdown`, `Breadcrumb`, `Progress`, `EmptyState`, `ErrorState`, `LoadingState`.

---

## 🛠️ Tech Stack

| Tool | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `19.2.6` | Component Architecture & State Management |
| **Vite** | `7.3.2` | Lightning-fast HMR and bundling |
| **TypeScript** | `5.9.3` | Type safety and domain contracts |
| **Tailwind CSS** | `4.1.17` | Utility styling with CSS variable design tokens |
| **React Router** | `7.18.4` | Client-side routing with HashRouter |
| **Lucide React** | `1.47.0` | Accessible vector icon set |
| **clsx / tailwind-merge** | Latest | Dynamic conditional class merging |

---

## 📂 Project Structure

```text
frontend/
├── public/                # Static assets & icons
├── src/
│   ├── components/        # Reusable domain & UI components
│   │   ├── announcement/  # Announcement cards, filters & editors
│   │   ├── auth/          # Login form & auth guard
│   │   ├── common/        # Shared badges, preview notices, planned features
│   │   ├── dashboard/     # Metric cards, charts & quick actions
│   │   ├── document/      # Document tables, uploaders & viewers
│   │   ├── event/         # Event forms, cards & selectors
│   │   ├── layout/        # App shell, sidebar, header & navigation
│   │   ├── meeting/       # Meeting agendas, intelligence & lists
│   │   ├── risk/          # Risk matrix, severity badges & forms
│   │   ├── task/          # Kanban board, task tables & drawers
│   │   ├── ui/            # Atomic design system components
│   │   └── volunteer/     # Volunteer cards, rosters & filters
│   ├── context/           # AuthContext, EventContext, ThemeContext
│   ├── data/              # Mock databases & initial seeds
│   ├── hooks/             # Custom domain hooks (useTasks, useRisks, etc.)
│   ├── lib/               # Utility formatters, date helpers, cn helper
│   ├── pages/             # Route page views & event-scoped views
│   ├── routes/            # App routing table
│   ├── services/          # API adapters with mock & HTTP modes
│   ├── styles/            # Design tokens & CSS theme variables
│   └── types/             # TypeScript domain interfaces
├── index.html             # HTML entry point
├── package.json           # Dependencies & scripts
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Build for Production
```bash
npm run build
```
Optimized assets will be output to the `dist/` directory.

### 4. Preview Production Build
```bash
npm run preview
```

---

## 🔑 Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Event Head** | `rahul@clubops.dev` | `clubops2026` |
| **President** | `president@clubops.dev` | `clubops2026` |
| **Volunteer** | `volunteer@clubops.dev` | `clubops2026` |
| **Faculty Advisor** | `faculty@clubops.dev` | `clubops2026` |

---

## 📄 License

Distributed under the MIT License.
