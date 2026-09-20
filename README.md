# ClubOps AI — Event Operations Platform

<div align="center">

![ClubOps AI](https://img.shields.io/badge/ClubOps-AI-6366f1?style=for-the-badge&logo=sparkles&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**A modern, AI-powered club & event operations management platform.**

</div>

---

## ✨ Features

- 📅 **Event Management** — Create, track, and manage club events end-to-end
- ✅ **Task Tracking** — Assign and monitor tasks across your team
- 🙋 **Volunteer Management** — Coordinate volunteers efficiently
- 📋 **Meeting Management** — Schedule and document meetings with ease
- 📄 **Document Management** — Centralized storage for all club documents
- ⚠️ **Risk Management** — Identify, assess, and mitigate operational risks
- 📢 **Announcements** — Broadcast important updates to your club
- 🤖 **AI Integration** — AI-powered suggestions and action items
- 📊 **Dashboard** — Real-time overview of all club operations
- 🔐 **Authentication** — Secure login and role-based access

---

## 🚀 Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI Framework |
| TypeScript | 5.9 | Type Safety |
| Vite | 7.3 | Build Tool & Dev Server |
| Tailwind CSS | 4.1 | Styling |
| React Router | 7.x | Client-Side Routing |
| Lucide React | 1.47 | Icons |

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ai/            # AI-related components
│   │   ├── aiAction/      # AI action components
│   │   ├── announcement/  # Announcement components
│   │   ├── auth/          # Authentication components
│   │   ├── common/        # Shared/common components
│   │   ├── dashboard/     # Dashboard widgets
│   │   ├── document/      # Document management components
│   │   ├── event/         # Event management components
│   │   ├── layout/        # Layout components (sidebar, navbar)
│   │   ├── meeting/       # Meeting management components
│   │   ├── risk/          # Risk management components
│   │   ├── task/          # Task management components
│   │   ├── ui/            # Base UI primitives
│   │   └── volunteer/     # Volunteer management components
│   ├── context/           # React Context providers
│   ├── data/              # Static/mock data
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── pages/             # Page-level components
│   │   ├── DashboardPage.tsx
│   │   ├── EventsPage.tsx
│   │   ├── FoundationPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── routes/            # React Router configuration
│   ├── services/          # API service layer
│   ├── styles/            # Global styles
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx
│   └── main.tsx
├── docs/                  # Project documentation
│   ├── demo-readiness.md
│   └── frontend-backend-integration.md
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/jaiminrangpara17/ClubOps-AI.git
cd ClubOps-AI

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your settings
```

### Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```env
# Base URL for the ClubOps backend API (no trailing slash)
VITE_API_BASE_URL=/api

# API mode: "api" = real backend, "mock" = local mock data
VITE_API_MODE=mock
```

### Development

```bash
npm run dev
```

The app will start at **http://localhost:5173** (or next available port).

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## 🔌 API Modes

The app supports two API modes, controlled by `VITE_API_MODE`:

| Mode | Description |
|------|-------------|
| `mock` | Uses local mock data — no backend required. Great for frontend development. |
| `api` | Calls the real ClubOps backend at `VITE_API_BASE_URL`. |

> **Note**: There is no mixed mode. All features use either real or mock data.

---

## 📚 Documentation

- [Demo Readiness Guide](./docs/demo-readiness.md)
- [Frontend-Backend Integration Guide](./docs/frontend-backend-integration.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  Made with ❤️ for clubs everywhere
</div>
