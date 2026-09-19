# ClubOps AI Service

Internal AI service for ClubOps. Sprint 1 provides only the foundation:
configuration, a reusable LLM client, error handling, and a health endpoint.

Not in this sprint: event planner, meeting intelligence, risk intelligence,
action engine, RAG, announcements, daily briefing, agents, database access.

## Requirements

- Python 3.11+ (3.10 minimum)

## Installation

```bash
cd ai
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env               # then add your key