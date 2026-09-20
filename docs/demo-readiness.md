# ClubOps AI — Final QA & Demo Readiness

Status: final static QA pass. This workspace contains no backend repository,
no live API documentation and no browser automation runtime. All feature
services therefore run in explicit mock mode by default.

## Startup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the Vite URL printed in the terminal. A production verification build is
available with `npm run build`.

## Environment

| Variable | Required | Meaning |
|---|---:|---|
| `VITE_API_BASE_URL` | yes | API base URL; `/api` is the default proxy-relative value |
| `VITE_API_MODE` | yes | `mock` for the documented demo adapter; `api` only when the backend endpoints in `frontend-backend-integration.md` exist |

Never commit `.env.local`, credentials, tokens or provider keys.

## Demo login (mock mode only)

The login screen displays the available development accounts. They all use:

```text
Password: clubops2026
```

These credentials exist only in the isolated mock auth adapter. They must not
be used or shown when `VITE_API_MODE=api`.

## Recommended demo flow

1. Login as **Rahul Kapoor** (Event Head).
2. Open the **Command Center** and select **TechFest 2026**.
3. Open the event workspace and review **Tasks** / **Volunteers**.
4. Open **Meetings**, then **Core committee sync — week 6** to show transcript,
   decisions and action items.
5. Open **Documents**, then **Venue hire agreement.pdf** to show content,
   sample intelligence and operational links.
6. Open **Risk Management** and the venue-contract risk to show mitigation and
   linked task/meeting/document context.
7. Open **AI Copilot** and ask **"Which tasks are overdue?"**.
8. Open **Review actions**, then review a pending action.
9. Explicitly approve or reject it. In mock mode the adapter updates the
   relevant mock module record, then returns the authoritative simulated result.
10. Return to the approval center to show the pending count/status changed.

## Implemented modules

- Authentication / protected routes
- Dashboard / event context
- Events, tasks, volunteers
- Meeting intelligence
- Document intelligence
- Risks
- Announcements
- AI Copilot
- AI action approval

## Route inventory (verified from `src/routes/AppRoutes.tsx`)

```text
/login
/dashboard
/events
/events/:eventId
/events/:eventId/tasks
/events/:eventId/volunteers
/events/:eventId/volunteers/new
/events/:eventId/volunteers/:volunteerId
/events/:eventId/volunteers/:volunteerId/edit
/events/:eventId/meetings
/events/:eventId/meetings/new
/events/:eventId/meetings/:meetingId
/events/:eventId/meetings/:meetingId/edit
/events/:eventId/documents
/events/:eventId/documents/:documentId
/events/:eventId/risks
/events/:eventId/risks/new
/events/:eventId/risks/:riskId
/events/:eventId/risks/:riskId/edit
/events/:eventId/announcements
/events/:eventId/announcements/new
/events/:eventId/announcements/:announcementId
/events/:eventId/announcements/:announcementId/edit
/events/:eventId/ai
/events/:eventId/ai/actions
/events/:eventId/ai/actions/:actionId
/settings
/foundation
/404
```

The router does **not** currently register event creation/edit routes or
task-detail/create/edit routes. Demo narration must use only the routes above.

## QA results

| Area | Status | Notes |
|---|---|---|
| Production build / TypeScript | PASS | `npm run build` completed with 0 errors |
| Lint | BLOCKED | no lint script is configured |
| Automated tests | BLOCKED | no test script/framework is configured |
| Browser user journey | BLOCKED | browser/network tooling unavailable in this environment |
| Responsive browser audit | BLOCKED | requires manual desktop/tablet/mobile pass |
| Live backend integration | BLOCKED | no backend/API documentation is present |
| Mock demo flow | READY FOR MANUAL TEST | all mock adapters are isolated and build cleanly |

## Known limitations

- `VITE_API_MODE=mock` is the only demo-ready mode in this workspace.
- No real AI, OCR, RAG, streaming, document processing, message delivery or
  backend action execution exists.
- Task IDs link to the task workspace because there is no `/tasks/:taskId`
  route in the active router.
- Dashboard uses a section-based mock dashboard adapter; it has not been
  connected to mutation invalidation because the backend aggregate contract is
  unavailable.
- Document upload mock accepts a file and simulates lifecycle state, but does
  not store bytes. Download/preview stay disabled.

## Live-demo fallback plan

| Risk | Detection | Retry / fallback |
|---|---|---|
| Backend unreachable | API error state / network panel | Stay in `mock` mode for the demo; use Retry when a live backend is available |
| Login failure | inline login error | select a displayed mock account; confirm `VITE_API_MODE=mock` |
| AI unavailable/rate-limited | Copilot inline error | show the explicit stub notice; use quick prompts only in mock mode |
| Document/meeting processing delayed | status badges show queued/processing/failed | explain it is asynchronous; show an already-ready seeded record |
| Action approval fails | outcome/error panel stays pending/failed | retry only after reviewing server state; reject action instead; never claim completion |

## Backend dependencies before `api` mode

See `docs/frontend-backend-integration.md` for the full endpoint map. The
minimum blockers are authentication, event list/detail, all event-scoped CRUD
contracts, dashboard aggregate/section contracts, and AI/AI-action contracts.
The backend should also supply an authoritative pending-action count endpoint,
pagination/filter contracts, and stable entity IDs.

## Manual QA checklist

- Verify login/logout and direct protected route redirects.
- Switch between at least two events and check no data leaks.
- Submit a create/edit form and confirm server response before showing success.
- Check tables/cards at desktop, tablet and mobile widths.
- Inspect browser console and Network for 401/403 loops, duplicate requests,
  wrong event IDs and failed imports.
- Confirm no secrets/tokens are visible in console, DOM or URLs.