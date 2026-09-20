# ⚡ ClubOps AI — Frontend Application

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite 7](https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](../LICENSE)

**ClubOps AI Frontend** is a modern, responsive single-page web application engineered for campus clubs, event organizers, and student societies. It serves as the primary operations command hub for real-time logistics, task tracking, volunteer rostering, meeting intelligence, document vaults, risk governance, and AI-assisted workflows.

---

## 🌟 Key Subsystems & Features

### 📊 1. Operations Command Dashboard (`/dashboard`)
- **Executive AI Daily Briefing**: Automatic situational digests of blockers, unfilled shifts, and upcoming deadlines.
- **Section Resilience**: Multi-section asynchronous loading (`useSectionData`) ensuring zero cascading failures.
- **KPI Overview**: Live status counters for tasks, volunteer check-ins, permits, and active risks.
- **State Export**: Export complete event state as JSON for backups and external reporting.

### 📋 2. Tasks & Workflow Tracker (`/events/:id/tasks`)
- **Kanban & Table Views**: Interactive board (`Todo`, `In Progress`, `Blocked`, `Done`) and structured tabular data.
- **Priority & Due Date Tracking**: Multi-tier priority management (`Critical`, `High`, `Medium`, `Low`).
- **Urgent Action Surface**: Immediate highlighting of blocked and high-risk operational items.

### 👥 3. Volunteer Management Roster (`/events/:id/volunteers`)
- **Departmental Roles**: Registration, Tech Crew, Stage, Hospitality, Media, Logistics, and Safety.
- **Profile Detail & Shifts**: Roster directory, volunteer contact info, check-in status, and assigned tasks.
- **Interactive Modals**: Rapid volunteer onboarding, inline edits, and shift assignment changes.

### 📝 4. Meeting Intelligence & Action Pipeline (`/events/:id/meetings`)
- **Lifecycle & Agendas**: Schedule sessions, configure structured agendas, and record attendance.
- **Transcript Ingestion**: Ingest raw meeting notes and transcripts.
- **AI Extraction & 1-Click Task Creation**: Extract key decisions and automatically convert action items into live tasks.

### 📁 5. Document Hub & Asset Vault (`/events/:id/documents`)
- **Categorized Storage**: Floor plans, run-of-show decks, permits, sponsor contracts, and volunteer guides.
- **Multipart Uploads**: Real-time upload progress tracking via `apiUpload` (XHR) with file validation.
- **Document Detail Views**: Preview metadata, size, upload timestamp, category tags, and access permissions.
- **Instant Search & Filter**: Search documents by title, tags, or file type with immediate preview panels.

### ⚠️ 6. Risk Register & Matrix Governance (`/events/:id/risks`)
- **Severity & Likelihood Matrix**: Multi-dimensional risk matrix mapping probability against operational impact (`Low`, `Medium`, `High`, `Critical`).
- **Interactive Risk Management**: Create (`/risks/new`), inspect (`/risks/:riskId`), and edit (`/risks/:riskId/edit`) risk profiles with optimistic state updates.
- **Mitigation & Contingency Plans**: Dedicated mitigation action trackers, trigger indicators, assigned risk owners, and status updates.
- **Risk Analytics**: Aggregate severity metrics, status distribution, and quick filtering by likelihood and category.

### 📢 7. Announcements & Broadcasts (`/events/:id/announcements`)
- Target broadcasts specifically to Attendees, Volunteers, Organizers, or Sponsors.

### 🤖 8. AI Copilot Hub (`/events/:id/ai`)
- Grounded query interface ready for RAG integrations to answer event questions with citation previews.

### 🎨 9. Design System & Theme Engine (`/foundation`)
- **Dark Mode & Light Mode**: Seamless theme switching with system detection and persistence.
- **Design Tokens**: Standardized palette (`canvas`, `surface`, `brand`, `line`, `danger`, `warning`, `success`).
- **Atomic Components**: Fully accessible Button, Badge, Modal, Card, Dropdown, Input, Progress, and State handlers.

---

## 🛠️ Tech Stack & Dependencies

- **Framework**: React 19.2 (Functional Components & Hooks)
- **Language**: TypeScript 5.9 (Strict Type Safety)
- **Bundler & Build Tool**: Vite 7.3 (`@vitejs/plugin-react`, `vite-plugin-singlefile`)
- **Styling**: Tailwind CSS v4 + Custom CSS Token System (`@theme inline`)
- **Icons**: Lucide React (`lucide-react`)
- **Routing**: React Router DOM v7 (`HashRouter`)
- **Utilities**: `clsx`, `tailwind-merge`

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `VITE_API_MODE` | `mock` | Switch between `mock` (built-in offline data) and `api` (live backend endpoints) |
| `VITE_API_BASE_URL` | `/api` | Base URL prefix for backend REST requests |

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```
The optimized single-file production bundle will be generated in `dist/`.

---

## 🔑 Demo Login Accounts

| Role | Email | Password |
|---|---|---|
| **Event Head** | `rahul@clubops.dev` | `clubops2026` |
| **President** | `president@clubops.dev` | `clubops2026` |
| **Volunteer Coordinator** | `volunteer@clubops.dev` | `clubops2026` |
| **Faculty Advisor** | `faculty@clubops.dev` | `clubops2026` |

*(Note: In mock mode, any non-empty password is accepted for testing).*

---

## 🔌 API Client Architecture

All network interactions pass through `src/services/http.ts`, providing:
- Unified error taxonomy (`ApiError` with user-safe descriptions).
- Automatic `401 Unauthorized` handling with `clubops:unauthorized` window events.
- Request timeout protection (12-second ceiling) and abort signal propagation.
- Multipart upload progress tracking (`apiUpload`).
- Dual-mode switching (`apiMode.ts`): transparently fallback to high-fidelity mocks when live backend is offline.
