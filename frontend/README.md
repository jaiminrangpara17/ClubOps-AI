# ClubOps-AI 🚀

[![React](https://img.shields.io/badge/React-19.2.6-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.3.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.17-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **ClubOps-AI** is a modern, full-lifecycle intelligent event operations and club management platform designed to streamline planning, volunteer coordination, risk management, and intelligent automated workflows for student clubs, organizations, and event teams.

---

## 📖 Table of Contents

- [Features](#-features)
  - [🎯 Event Operations & Overview](#-event-operations--overview)
  - [🤖 AI Copilot & Action Review](#-ai-copilot--action-review)
  - [📋 Task Management](#-task-management)
  - [👥 Volunteer Management](#-volunteer-management)
  - [📅 Meetings & Minutes](#-meetings--minutes)
  - [⚠️ Risk Assessment & Mitigation](#️-risk-assessment--mitigation)
  - [📢 Announcements & Broadcasts](#-announcements--broadcasts)
  - [📄 Documents & Knowledge Base](#-documents--knowledge-base)
  - [🎨 Design System & Foundations](#-design-system--foundations)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Development Server](#running-the-development-server)
  - [Building for Production](#building-for-production)
- [🧪 Available Scripts](#-available-scripts)
- [🛡️ State & Architecture](#️-state--architecture)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

### 🎯 Event Operations & Overview
- **Multi-Event Switching:** Seamlessly switch between active and archived events.
- **KPI Metrics & Progress:** Track readiness percentage, volunteer headcount, completed deliverables, and critical risk flags in real-time.
- **Milestone Timeline:** Visual breakdown of countdown milestones leading up to event day.

### 🤖 AI Copilot & Action Review
- **Intelligent Operations Copilot:** Built-in AI copilot capable of synthesizing meeting minutes, proposing tasks, flagging high-risk areas, and suggesting volunteer reassignments.
- **AI Action Queue & Review:** Human-in-the-loop review interface allowing organizers to approve, reject, or fine-tune AI-suggested operational changes prior to execution.

### 📋 Task Management
- **Task Tracking:** Filterable lists and task states (Backlog, In Progress, In Review, Completed, Blocked).
- **Priorities & Assignees:** Assign tasks to volunteers with clear due dates and urgency levels.

### 👥 Volunteer Management
- **Roster & Roles:** Manage volunteer profiles, contact details, assigned areas, and shift timings.
- **Capacity & Workload Tracking:** Monitor volunteer availability and commitments across stages.

### 📅 Meetings & Minutes
- **Agendas & Schedules:** Organize planning syncs with clear agendas and attendee rosters.
- **Action Items Extraction:** Convert decisions made during meetings directly into trackable tasks.

### ⚠️ Risk Assessment & Mitigation
- **Risk Matrix:** Log risks categorized by severity and probability.
- **Mitigation Protocols:** Define contingencies, assign risk owners, and track resolution status.

### 📢 Announcements & Broadcasts
- **Targeted Communications:** Publish team updates, channel broadcasts, and emergency notifications.
- **Audit Trails:** Keep a verified history of all club-wide messages.

### 📄 Documents & Knowledge Base
- **Asset Repository:** Centralized storage for floor plans, budgets, run-of-show sheets, and sponsorship decks.
- **Categorization & Tags:** Fast search across document metadata and file attachments.

### 🎨 Design System & Foundations
- **Dark / Light Mode:** Built-in theme context with smooth transitions and persistent settings.
- **Design Tokens:** Accessible color palette, status tones (`neutral`, `brand`, `success`, `warning`, `danger`, `info`), surface elevations, and responsive typography.
- **Foundation Showcase:** Interactive component kitchen sink located at `/foundation`.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **[React 19](https://react.dev/)** | Modern frontend library with latest hooks and functional patterns |
| **[Vite 7](https://vitejs.dev/)** | Ultra-fast build tool and development server |
| **[TypeScript 5.9](https://www.typescriptlang.org/)** | Type-safe enterprise JavaScript codebase |
| **[Tailwind CSS 4](https://tailwindcss.com/)** | Next-generation utility-first styling with `@tailwindcss/vite` |
| **[React Router 7](https://reactrouter.com/)** | Declarative client-side routing (`HashRouter`) |
| **[Lucide React](https://lucide.dev/)** | Consistent and lightweight modern icon library |
| **[clsx](https://github.com/lukeed/clsx) & [tailwind-merge](https://github.com/dcastil/tailwind-merge)** | Dynamic and conflict-free class name resolution |

---

## 📁 Project Structure

```
ClubOps-AI/
├── public/                     # Static assets
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── auth/               # Protected route guards and auth components
│   │   ├── layout/             # AppLayout, EventLayout, Sidebar, Navbar
│   │   └── ui/                 # Buttons, Badges, Cards, Inputs, Modals, States
│   ├── context/                # React Context Providers (Auth, Event, Theme)
│   ├── data/                   # Mock demo datasets (Events, Tasks, Volunteers, etc.)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities, helpers, and status definitions
│   ├── pages/                  # Top-level route views
│   │   ├── event/              # Event-specific sub-routes (Copilot, Tasks, Risks, etc.)
│   │   ├── DashboardPage.tsx   # Global club dashboard
│   │   ├── EventsPage.tsx      # All events listing
│   │   ├── FoundationPage.tsx  # Design system showcase
│   │   ├── LoginPage.tsx       # Auth portal
│   │   ├── NotFoundPage.tsx    # 404 page
│   │   └── SettingsPage.tsx    # Platform settings
│   ├── routes/                 # App routing configuration
│   ├── services/               # Mock API services and state handlers
│   ├── styles/                 # Custom styling tokens and css variables
│   ├── types/                  # TypeScript interface and type declarations
│   ├── App.tsx                 # Root application wrapper with providers
│   ├── index.css               # Global styling and Tailwind directives
│   └── main.tsx                # Application bootstrap entry point
├── index.html                  # HTML template
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript compiler configuration
├── vite.config.ts              # Vite configuration
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher (Node `v20+` recommended)
- **npm**: `v9.0.0` or higher (or `pnpm` / `yarn`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jaiminrangpara17/ClubOps-AI.git
   cd ClubOps-AI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Running the Development Server

Start the local development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### Building for Production

Create an optimized production build:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

---

## 🧪 Available Scripts

- `npm run dev` - Launch the Vite development server with Hot Module Replacement (HMR).
- `npm run build` - Compile TypeScript and bundle assets with Vite for production.
- `npm run preview` - Locally serve the generated production build from `dist/`.

---

## 🛡️ State & Architecture

- **Authentication Context (`AuthContext`):** Manages user session state, active roles, and redirects unauthenticated requests securely.
- **Event Context (`EventContext`):** Provides global state for the currently active event across nested navigation bars and copilots.
- **Theme Context (`ThemeContext`):** Supports dark/light mode toggle with persistent local storage caching.
- **Error Boundaries:** Gracefully traps component render exceptions and provides fallback recovery interfaces.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
