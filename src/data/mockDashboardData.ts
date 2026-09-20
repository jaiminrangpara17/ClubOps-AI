import { isoFromToday } from "./demoEvents";
import type { Severity, StatusKind } from "@/types";
import type {
  AIDailyBrief,
  DashboardModuleId,
  DashboardRisk,
  DashboardStat,
  DashboardSummary,
  EventProgress,
  PriorityItem,
  RecentActivityItem,
  UpcomingDeadline,
  VolunteerSnapshot,
  VolunteerWorkload,
} from "@/types/dashboard";

/* =========================================================================
   LOCAL DEVELOPMENT MOCK — dashboard payloads
   =========================================================================
   No dashboard endpoints exist yet. These builders produce deterministic,
   internally consistent sample payloads so the UI can be built and reviewed.
   Every value is derived from the event id — nothing is randomised per render,
   so reloading does not shuffle the screen.

   ➜ Delete this module when the backend ships and flip VITE_API_MODE=api.
   ========================================================================= */

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

/** Deterministic value inside a spread around a base number. */
function jitter(seed: number, base: number, spread: number, index: number): number {
  const offset = ((seed + index * 7) % (spread * 2 + 1)) - spread;
  return Math.max(0, base + offset);
}

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/* ------------------------------ Summary ------------------------------ */

export function buildMockSummary(
  event: {
    id: string;
    name: string;
    code: string;
    status: StatusKind;
    summary: string;
    startIso: string;
    endIso: string;
    venue: string;
    readiness: number;
  },
  daysRemaining: number | null,
): DashboardSummary {
  const seed = hashId(event.id);
  const taskTotal = jitter(seed, 100, 20, 1);
  const taskDone = Math.round((taskTotal * event.readiness) / 100);
  const activeVolunteers = jitter(seed, 28, 9, 2);
  const meetingsCompleted = jitter(seed, 8, 3, 3);
  const activeRisks = 2 + (seed % 3);

  const stats: DashboardStat[] = [
    {
      id: "tasks",
      label: "Tasks",
      value: `${clampPct((taskDone / taskTotal) * 100)}%`,
      secondary: `${taskDone} of ${taskTotal} complete`,
      indicator: event.readiness >= 70 ? "success" : "warning",
      moduleId: "tasks",
    },
    {
      id: "volunteers",
      label: "Volunteers",
      value: String(activeVolunteers),
      secondary: `${jitter(seed, 18, 4, 4)} assigned to shifts`,
      indicator: "info",
      moduleId: "volunteers",
    },
    {
      id: "meetings",
      label: "Meetings",
      value: String(meetingsCompleted),
      secondary: `${jitter(seed, 2, 1, 5)} scheduled ahead`,
      indicator: "neutral",
      moduleId: "meetings",
    },
    {
      id: "risks",
      label: "Risks",
      value: String(activeRisks),
      secondary: `${1 + (seed % 2)} high priority`,
      indicator: activeRisks > 3 ? "danger" : "warning",
      moduleId: "risks",
    },
  ];

  return {
    eventId: event.id,
    event: {
      id: event.id,
      name: event.name,
      code: event.code,
      status: event.status,
      description: event.summary,
      dateLabel: new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(event.startIso)),
      startIso: event.startIso,
      endIso: event.endIso,
      venue: event.venue,
      daysRemaining,
    },
    stats,
    generatedAt: new Date().toISOString(),
  };
}

/* ---------------------------- Priorities ----------------------------- */

export function buildMockPriorities(): PriorityItem[] {
  const rows: Array<{
    id: string;
    title: string;
    owner: string;
    dayOffset: number;
    priority: Severity;
    status: StatusKind;
    moduleId: DashboardModuleId;
  }> = [
    {
      id: "p1",
      title: "Confirm auditorium booking",
      owner: "Rahul",
      dayOffset: 0,
      priority: "high",
      status: "at-risk",
      moduleId: "tasks",
    },
    {
      id: "p2",
      title: "Finalize sponsor proposal",
      owner: "Priya",
      dayOffset: 0,
      priority: "high",
      status: "active",
      moduleId: "documents",
    },
    {
      id: "p3",
      title: "Assign remaining volunteers",
      owner: "Amit",
      dayOffset: 0,
      priority: "medium",
      status: "planned",
      moduleId: "volunteers",
    },
    {
      id: "p4",
      title: "Circulate run sheet draft",
      owner: "Sana",
      dayOffset: 2,
      priority: "low",
      status: "draft",
      moduleId: "documents",
    },
  ];

  return rows.map((row) => ({ ...row, dueIso: isoFromToday(row.dayOffset, 17) }));
}

/* ----------------------------- Deadlines ----------------------------- */

export function buildMockDeadlines(): UpcomingDeadline[] {
  const rows: Array<{
    id: string;
    title: string;
    owner: string;
    dayOffset: number;
    moduleId: DashboardModuleId;
  }> = [
    { id: "d1", title: "Venue confirmation", owner: "Rahul", dayOffset: 0, moduleId: "tasks" },
    { id: "d2", title: "Sponsor proposal", owner: "Priya", dayOffset: 1, moduleId: "documents" },
    { id: "d3", title: "Poster design", owner: "Sana", dayOffset: 5, moduleId: "tasks" },
    { id: "d4", title: "Volunteer recruitment", owner: "Amit", dayOffset: 9, moduleId: "volunteers" },
    { id: "d5", title: "Committee minutes", owner: "Rahul", dayOffset: 14, moduleId: "meetings" },
    { id: "d6", title: "Insurance certificate", owner: "Priya", dayOffset: -2, moduleId: "documents" },
  ];

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    owner: row.owner,
    dueIso: isoFromToday(row.dayOffset, 12),
    moduleId: row.moduleId,
  }));
}

/* ------------------------------- Risks ------------------------------- */

export function buildMockRisks(): DashboardRisk[] {
  return [
    {
      id: "r1",
      title: "Venue booking overdue",
      detail: "The auditorium hold expires before the contract is countersigned.",
      area: "Venue",
      severity: "high",
      owner: "Rahul",
    },
    {
      id: "r2",
      title: "Volunteer shortage",
      detail: "Registration desk is short 5 people for the opening morning.",
      area: "Volunteers",
      severity: "medium",
      owner: "Amit",
    },
    {
      id: "r3",
      title: "Sponsor confirmation pending",
      detail: "Two sponsors have not confirmed their tier in writing.",
      area: "Partnerships",
      severity: "medium",
      owner: "Priya",
    },
  ];
}

/* ------------------------------ Progress ----------------------------- */

export function buildMockProgress(readiness: number): EventProgress {
  const seed = readiness;
  return {
    overallPct: clampPct(readiness),
    tasksPct: clampPct(readiness),
    volunteerAssignmentPct: clampPct(readiness + jitter(seed, 13, 6, 1)),
    deadlinesPct: clampPct(readiness - jitter(seed, 4, 4, 2)),
  };
}

/* ----------------------------- Volunteers ---------------------------- */

export function buildMockVolunteerSnapshot(): VolunteerSnapshot {
  const seed = 42;
  const active = jitter(seed, 28, 6, 1);
  const assigned = Math.min(active, jitter(seed, 18, 4, 2));
  const available = Math.max(0, active - assigned - 3);
  const overloaded = 3;

  const workload: VolunteerWorkload[] = [
    { id: "v1", name: "Rahul", shiftCount: 5, loadPct: 88, level: "high" },
    { id: "v2", name: "Priya", shiftCount: 4, loadPct: 62, level: "medium" },
    { id: "v3", name: "Amit", shiftCount: 2, loadPct: 30, level: "low" },
  ];

  return {
    active,
    assigned,
    available,
    overloaded,
    coveragePct: clampPct((assigned / active) * 100),
    workload,
  };
}

/* ----------------------------- AI brief ------------------------------ */

export function buildMockDailyBrief(
  daysRemaining: number | null,
  riskCount: number,
): AIDailyBrief {
  return {
    greeting: "Good morning.",
    daysRemaining,
    headlineItems: [
      "Confirm auditorium booking",
      "Finalize sponsorship",
      "Assign 5 remaining volunteers",
    ],
    activeRiskCount: riskCount,
    closing: "Focus on venue confirmation first — it is blocking two other items.",
    generatedAt: new Date().toISOString(),
  };
}

/* --------------------------- Recent activity ------------------------- */

export function buildMockRecentActivity(): RecentActivityItem[] {
  return [
    {
      id: "a1",
      actor: "Rahul",
      action: "completed",
      target: "Venue research",
      timeLabel: "10 min ago",
      moduleId: "tasks",
    },
    {
      id: "a2",
      actor: "Priya",
      action: "was assigned",
      target: "Sponsor outreach",
      timeLabel: "1 hour ago",
      moduleId: "tasks",
    },
    {
      id: "a3",
      actor: "System",
      action: "processed",
      target: "Meeting transcript",
      timeLabel: "3 hours ago",
      moduleId: "meetings",
    },
    {
      id: "a4",
      actor: "System",
      action: "detected",
      target: "New risk: volunteer shortage",
      timeLabel: "Yesterday",
      moduleId: "risks",
    },
  ];
}

/** Summary returned when the workspace has no active event. */
export function buildMockEmptySummary(): DashboardSummary {
  return {
    eventId: null,
    event: null,
    stats: [],
    generatedAt: new Date().toISOString(),
  };
}
