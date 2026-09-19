# ClubOps-AI

Intelligent operations and management platform designed to streamline club management, membership operations, event scheduling, and analytics powered by AI capabilities.

## 📁 Repository Structure

This repository is organized as a monorepo containing both the backend AI service and the frontend web application:

```
ClubOps-AI/
├── ai/          # AI backend service (FastAPI, Python, LLM integration)
├── frontend/    # Frontend web application (React 19, Vite, TypeScript, Tailwind CSS)
└── README.md
```

## 🚀 Quick Start

### Frontend (`frontend/`)

Built with React 19, Vite, TypeScript, and Tailwind CSS.

```bash
cd frontend
npm install
npm run dev
```

For more details, see [`frontend/README.md`](frontend/README.md).

### AI Service (`ai/`)

Internal FastAPI service providing configuration, reusable LLM client, and operational intelligence.

```bash
cd ai
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env
pytest
```

For more details, see [`ai/README.md`](ai/README.md).
