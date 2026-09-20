# 🏛 ClubOps AI — System Architecture & Database Design

## 1. System Architecture Diagram

```text
                    ┌──────────────────────────────────────┐
                    │             User / Client            │
                    │        Browser / Web Application     │
                    └──────────────────┬───────────────────┘
                                       │
                                       │ HTTP / HTTPS (JSON)
                                       ▼
                    ┌──────────────────────────────────────┐
                    │         React Frontend (Vite)        │
                    │       http://localhost:5173          │
                    │   Dashboard / Operations / AI Views  │
                    └──────────────────┬───────────────────┘
                                       │
                                       │ REST API (Bearer JWT, CORS)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FastAPI Backend (Port 8000)                       │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Middleware Layer (Global HTTP)                     │  │
│  │  • CORS Handler (allowed origins from CORS_ORIGINS)                   │  │
│  │  • Security Headers (nosniff, DENY, 1; mode=block, HSTS)              │  │
│  │  • Structured JSON Request Logging & Latency Measurement              │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │                    Dependency & Security Layer                        │  │
│  │  • JWT Token Decode & Signature Verification (HS256)                  │  │
│  │  • Current Active User Resolution (get_current_active_user)           │  │
│  │  • Role-Based Access Control (require_admin, require_manager_or_admin)│  │
│  │  • Database Session Life Cycle (get_db yields SQLAlchemy Session)     │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │                         API Routers Layer                             │  │
│  │  /auth        • /users       • /clubs       • /members                │  │
│  │  /events      • /attendance  • /analytics   • /ai     • /health       │  │
│  └───────────────────┬───────────────────────────────┬───────────────────┘  │
│                      │                               │                      │
│                      ▼                               ▼                      │
│  ┌──────────────────────────────────────┐  ┌─────────────────────────────┐  │
│  │          SQLAlchemy 2.0 ORM          │  │     AI Service & Client     │  │
│  │   PostgreSQL Connection Pool         │  │   • Grounding Context Tools │  │
│  │   Declarative Base Models            │  │   • OpenAI-Compatible Client│  │
│  └───────────────────┬──────────────────┘  └──────────────┬──────────────┘  │
└──────────────────────┼────────────────────────────────────┼─────────────────┘
                       │                                    │
                       │ psycopg3 (Port 55432)              │ httpx (HTTPS)
                       ▼                                    ▼
      ┌─────────────────────────────────┐  ┌─────────────────────────────────┐
      │          PostgreSQL 16          │  │        AI Model Provider        │
      │       (Docker Container)        │  │       (e.g., gpt-4o-mini)       │
      │   Database: clubops_ai          │  │  • Natural-Language Completion  │
      │   Migrations: Alembic Head      │  │  • Structured Pydantic Output   │
      └─────────────────────────────────┘  └─────────────────────────────────┘
```

---

## 2. Request Lifecycle & Security Middleware Flow

1. **Incoming Request**: Client issues an HTTP request with an optional `Authorization: Bearer <token>` header.
2. **Security Headers Middleware**: Injects defensive HTTP headers:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains`
3. **Structured Logger**: Measures response latency in milliseconds and outputs JSON-formatted log lines (`method`, `path`, `status_code`, `latency_ms`).
4. **Authentication & RBAC**:
   - Parses JWT token using `JWT_SECRET_KEY` and algorithm `HS256`.
   - Resolves database `User` record.
   - Enforces role rules: `admin`, `manager`, or `member`.
5. **Route Execution**:
   - CRUD routes query or update PostgreSQL through transactional SQLAlchemy sessions.
   - AI routes first retrieve verified DB rows via grounding tools (`app/services/ai/tools.py`), then construct a strictly bounded prompt.
6. **Graceful Fallback**:
   - If AI credentials are unset or the provider times out, the service returns HTTP 503/504 without crashing or leaking credentials. Non-AI routes remain completely unaffected.

---

## 3. Entity-Relationship Database Diagram

```text
               ┌──────────────────────────────────────┐
               │                users                 │
               ├──────────────────────────────────────┤
               │ id: Integer (PK, Serial)             │
               │ username: String(50) (Unique, Index) │
               │ email: String(100) (Unique, Index)   │
               │ hashed_password: String(255)         │
               │ role: String(20) [admin/manager/mem] │
               │ is_active: Boolean (Default: True)   │
               │ created_at: DateTime(timezone=True)  │
               └──────────────────┬───────────────────┘
                                  │
                                  │ (User administers/belongs to Clubs)
                                  ▼
               ┌──────────────────────────────────────┐
               │                clubs                 │
               ├──────────────────────────────────────┤
               │ id: Integer (PK, Serial)             │
               │ name: String(100) (Unique, Index)    │
               │ description: Text                    │
               │ created_at: DateTime(timezone=True)  │
               │ updated_at: DateTime(timezone=True)  │
               └──────────┬────────────────┬──────────┘
                          │                │
                     1:N  │                │  1:N
                          ▼                ▼
┌───────────────────────────────┐    ┌───────────────────────────────┐
│            members            │    │            events             │
├───────────────────────────────┤    ├───────────────────────────────┤
│ id: Integer (PK, Serial)      │    │ id: Integer (PK, Serial)      │
│ club_id: Integer (FK -> clubs)│    │ club_id: Integer (FK -> clubs)│
│ name: String(100) (Index)     │    │ title: String(150) (Index)    │
│ email: String(100) (Index)    │    │ description: Text             │
│ joined_at: DateTime(tz=True)  │    │ starts_at: DateTime(tz=True)  │
└──────────────┬────────────────┘    │ ends_at: DateTime(tz=True)    │
               │                     │ created_at: DateTime(tz=True) │
               │                     └───────────────┬───────────────┘
          1:N  │                                     │  1:N
               ▼                                     ▼
┌────────────────────────────────────────────────────────────────────┐
│                             attendance                             │
├────────────────────────────────────────────────────────────────────┤
│ id: Integer (PK, Serial)                                           │
│ member_id: Integer (FK -> members.id, OnDelete CASCADE)             │
│ event_id: Integer (FK -> events.id, OnDelete CASCADE)               │
│ present: Boolean (Default: True)                                   │
│ marked_at: DateTime(timezone=True)                                 │
└────────────────────────────────────────────────────────────────────┘
```

---

## 4. Relational Constraints & Database Integrity

| Table | Constraint Type | Target Columns | Purpose |
|---|---|---|---|
| `users` | UNIQUE | `username`, `email` | Prevents duplicate accounts |
| `clubs` | UNIQUE | `name` | Guarantees distinct club namespaces |
| `members` | FOREIGN KEY | `club_id` ➔ `clubs.id` | Maintains relational ownership |
| `events` | FOREIGN KEY | `club_id` ➔ `clubs.id` | Scopes events directly to clubs |
| `attendance`| FOREIGN KEY | `member_id` ➔ `members.id` | Links record to specific roster member |
| `attendance`| FOREIGN KEY | `event_id` ➔ `events.id` | Links record to specific scheduled event |
| `attendance`| UNIQUE (Composite)| `(member_id, event_id)` | Prevents duplicate attendance logging |

---

## 5. Migration Management with Alembic

- **Current Revision**: `ef3755e0a2a7 (head)`
- **Auto-Generation Validation**: `alembic check` produces zero pending drift against model metadata.
- **Rollback Safety**: Every migration revision contains bidirectional `upgrade()` and `downgrade()` routines using transactional DDL.
