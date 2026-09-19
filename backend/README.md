# ⚙️ ClubOps AI — Backend API Service

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

The **ClubOps AI Backend** is a high-performance RESTful API service built with FastAPI and PostgreSQL. It powers authentication, event lifecycles, team permissions, volunteer rosters, and operational persistence for ClubOps AI.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Python**: 3.11 or later
- **PostgreSQL**: 16 (or run via Docker at repository root: `docker compose up -d`)

### 2. Environment Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Configure database credentials
```

### 3. Run the Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

---

## 📚 API Documentation

Once the server is running, interactive API documentation is available at:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: `GET http://localhost:8000/health`

---

## 🧪 Testing

```bash
pytest
```