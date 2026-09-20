# ClubOps AI — Frontend ↔ Backend Integration (Part 14)

Status date: Part 14 audit. **No backend repository or API documentation exists
in this workspace.** Every service therefore runs on its isolated mock adapter
until the backend ships. This document records the exact wiring so the backend
team can implement against it, and so cutover is a two-variable change.

## Cutover

Set in `.env.local`:

```
VITE_API_BASE_URL=https://<backend-host>/api
VITE_API_MODE=api
```

`src/services/apiMode.ts` is the single switch. No component changes are
required — every feature already routes UI → hook → feature service →
`apiRequest`/`apiUpload` → backend.

## Authentication

- Mechanism assumed: JWT Bearer (`Authorization: Bearer <token>`).
- Contract: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
  (see `src/services/authService.ts`).
- Session storage: `src/services/session.ts` (localStorage for "remember me",
  sessionStorage otherwise). Recommended pre-production change: httpOnly
  cookies — only `session.ts` + `http.ts` would change.
- **Part 14 fix:** the shared client (`src/services/http.ts`) now attaches the
  session token to *every* request automatically (`resolveToken`). Previously
  only auth/dashboard passed tokens; all other services would have received
  401s against a real backend.
- 401 anywhere → `clubops:unauthorized` window event → `AuthContext` clears
  the session and redirects to login. No refresh-token loop exists (no refresh
  endpoint is defined).

## API client

`src/services/http.ts`:
- `apiRequest<T>` — JSON, 12 s timeout, AbortSignal support.
- `apiUpload<T>` — multipart via XHR with real upload progress.
- Error taxonomy: network / unauthorized / forbidden / not-found / conflict /
  rate-limited / payload-too-large / unsupported-media / validation / server /
  unexpected, mapped from 400/401/403/404/409/413/415/422/429/5xx.
- `describeApiError` produces all user-facing messages; raw errors never
  reach the UI.

## Feature → service → endpoints → status

| Feature | Service | Endpoints (prefix `/events/:eventId` unless noted) | Status |
|---|---|---|---|
| Auth | `authService` | `/auth/login`, `/auth/logout`, `/auth/me` (global) | **Mocked** — no backend |
| Events | `eventService` | `GET/POST /events`, `GET/PATCH/DELETE /events/:id` (global) | **Mocked** |
| Dashboard | `dashboardService` | `/dashboard/{summary,priorities,deadlines,risks,progress,volunteers,brief,activity}` | **Mocked** |
| Tasks | `taskService` | `/tasks`, `/tasks/:id`, `/tasks/:id/status`, `/members` | **Mocked** |
| Volunteers | `volunteerService` | `/volunteers`, `/volunteers/:id`, `GET /members?excludeEventId=` (global) | **Mocked** |
| Meetings | `meetingService` | `/meetings`, `/meetings/:id`, `…/transcript`, `…/intelligence`, `…/process`, `…/action-items/:id/task` | **Mocked** |
| Documents | `documentService` | `/documents/capabilities`, `/documents`, `/documents/:id`, `…/content`, `…/intelligence`, `…/relations`, `…/retry`, `…/file`, `/documents/search?q=` | **Mocked** |
| Risks | `riskService` | `/risks/capabilities`, `/risks`, `/risks/:id`, `…/transition`, `…/mitigation-task` | **Mocked** |
| Announcements | `announcementService` | `/announcements/capabilities`, `/announcements`, `/announcements/:id`, `…/publish`, `…/unpublish`, `…/archive` | **Mocked** |
| AI Copilot | `aiService` | `/ai/capabilities`, `/ai/conversations`, `…/:id`, `…/:id/messages` | **Mocked** — no LLM anywhere in frontend |
| AI Actions | `aiActionService` | `/ai/actions/capabilities`, `/ai/actions`, `/ai/actions/:id`, `…/approve`, `…/reject` | **Mocked** |

Capability endpoints gate optional features (upload, preview, delete, content
search, publish, retry, reject-reason, edit-before-approval, streaming,
persistence). The UI renders nothing the backend does not advertise.

## Part 14 changes

1. **Central token attachment** in `http.ts` (critical fix, see above).
2. **EventContext de-mocked**: the shell previously imported `DEMO_EVENTS`
   directly (mock data in the production path). It now loads through
   `eventService.listEvents()` and exposes `refreshEvents()`. `ListEvent`
   gained nullable `attendeesExpected`/`teamSize`.
3. **Honest nulls**: `ClubEvent.attendeesExpected/teamSize` are now
   `number | null`; render sites show "—" instead of fabricated zeros.
4. `.env.example` added.

## Known limitations / backend work still required

- Every endpoint above must be implemented; none exist yet.
- 429 should be added to the error taxonomy as a first-class kind.
- Dashboard: consider one aggregate endpoint; the frontend currently issues 8
  section requests (they degrade independently by design).
- AI actions: a `?status=pending&countOnly` endpoint is needed for the
  dashboard badge (currently derived from the full list).
- No task-detail route exists (`/tasks/:taskId`); task links open the task
  workspace. Backend task IDs should stay stable for a future detail page.
- No pagination contract is defined anywhere; all lists assume full datasets.
  If the backend paginates, service adapters must be extended (UI unchanged).
- Streaming (AI), read receipts (announcements), attachments, scheduled
  publishing and workload calculation are all capability-gated off.

## Mock isolation guarantee

All mock data lives in `src/data/mock*.ts` / `src/data/demo*.ts` and is
imported **only** by service adapters (plus the topbar notifications
placeholder). `VITE_API_MODE` selects real *or* mock per service — records are
never mixed.
