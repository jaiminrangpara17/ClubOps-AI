# ClubOps AI — Intelligent Event Operations Platform

<div align="center">

![ClubOps AI](https://img.shields.io/badge/ClubOps-AI%20Platform-indigo?style=for-the-badge&logo=react)
![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)

<p align="center">
  <strong>An all-in-one, AI-powered event operations and management platform designed for student clubs, campus organizations, and team event coordinators.</strong>
</p>

</div>

---

## 🌟 Overview

**ClubOps AI** streamlines end-to-end event planning, coordination, and execution. From initial ideation with an AI Copilot to volunteer staffing, risk mitigation matrices, meeting minute extraction, and document repository management, ClubOps AI empowers student organizations to run seamless events with operational confidence.

---

## ✨ Key Features

### 🤖 AI Event Copilot
- **Intelligent Planning Assistant**: Context-aware AI suggestions for scheduling, task allocation, and event checklists.
- **Automated Insights**: Identifies timeline bottlenecks, missing roles, and operational blind spots before they become issues.

### 📅 Event Command Center
- **Dynamic Event Overview**: Live countdowns, phase trackers (Planning, Active, Completed), and status summaries.
- **Multi-Event Management**: Switch effortlessly across multiple simultaneous campus events and festivals.

### 📋 Task & Milestone Tracker
- **Status & Priority Sorting**: Track tasks from Backlog to In-Progress and Completed.
- **Role Assignments & Due Dates**: Assign team members and volunteers with granular deadlines.

### 🤝 Volunteer & Staffing Coordination
- **Roster Management**: Manage volunteer profiles, contact details, assigned shifts, and roles.
- **Attendance & Check-in**: Track check-ins and operational availability in real time.

### 📝 Meeting Minutes & Action Items
- **Structured Agendas & Minutes**: Log decisions, attendance, and discussions.
- **Action Item Extraction**: Convert meeting outcomes into assignable tasks with one click.

### ⚠️ Risk Assessment & Matrix
- **Impact vs. Probability Grid**: Categorize risks (Operational, Financial, Safety, Technical).
- **Mitigation Action Plans**: Document contingency protocols and emergency contacts.

### 📂 Documents & Assets Hub
- **Centralized File Repository**: Store permits, sponsor decks, schedules, design assets, and floor plans.
- **Category Filtering & Search**: Instant file lookup by tag and document type.

### 📢 Announcements & Broadcasts
- **Targeted Communications**: Publish announcements for organizers, volunteers, or attendees.
- **Priority Badging**: Pin urgent updates and security notices.

### 🌓 Theme & User Experience
- **Dark & Light Mode**: Built-in dark/light mode toggle.
- **Mock & Live API Dual Engine**: Run completely standalone with comprehensive demo data, or connect seamlessly to a REST backend via `VITE_API_MODE`.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 7](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **State Management**: React Context & Custom Hooks

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18+ recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jaiminrangpara17/ClubOps-AI.git
   cd ClubOps-AI
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment (optional)**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   | Variable | Default | Description |
   | :--- | :--- | :--- |
   | `VITE_API_MODE` | `mock` | `mock` for local standalone mode, `api` for live backend |
   | `VITE_API_BASE_URL` | `http://localhost:8000/api` | Backend REST API base URL |

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```
├── public/                # Static public assets
├── src/
│   ├── components/        # Reusable UI components & layouts
│   │   ├── layout/        # Sidebar, Header, EventLayout
│   │   └── ui/            # Buttons, Badges, Modals, StatCards, Tabs
│   ├── context/           # React context providers (Auth, Event, Theme)
│   ├── data/              # Mock dataset for offline/demo operation
│   ├── hooks/             # Custom utility hooks
│   ├── lib/               # Utility functions & helpers
│   ├── pages/             # Main application pages
│   │   ├── event/         # Event sub-pages (Copilot, Tasks, Risks, Volunteers, etc.)
│   │   ├── DashboardPage.tsx
│   │   ├── EventsPage.tsx
│   │   ├── FoundationPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── SettingsPage.tsx
│   ├── routes/            # Route configuration and guards
│   ├── services/          # HTTP client, mock adapters, and API services
│   ├── styles/            # Design system tokens and styles
│   ├── types/             # TypeScript domain definitions and models
│   ├── App.tsx            # Main application root
│   └── main.tsx           # Application entry point
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite bundler configuration
```

---

## 💡 Demo Credentials

When running in **Mock Mode** (`VITE_API_MODE=mock`):
- Click **"Sign In with Demo Account"** or enter any email/password to explore all dashboard features with pre-populated demo events, volunteers, tasks, and meeting notes.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
