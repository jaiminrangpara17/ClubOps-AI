import type { Severity, StatusKind } from "./ui";

/**
 * Dashboard contracts — one type per dashboard section.
 *
 * Rules:
 * - Pure data. No icons, colour tokens, formatted strings or React imports.
 *   Presentation is resolved in the UI layer.
 * - These mirror the backend payloads; sync changes with the API team.
 * - Optional fields that the backend cannot fill yet are `null` (never
 *   invented client-side) so the UI can show an honest placeholder.
 */

export type DashboardModuleId =
  | "tasks"
  | "volunteers"
  | "meetings"
  | "documents"
  | "risks"
  | "announcements";

/* ------------------------------ Summary ------------------------------ */

/** One headline figure in the overview statistics strip. */
export interface DashboardStat {
  id: string;
  label: string;
  /** Primary figure, pre-formatted by the backend (e.g. "72%"). */
  value: string;
  /** Secondary context line (e.g. "18 completed today"). */
  secondary: string;
  /** Visual weight for the tile. */
  indicator: "success" | "warning" | "danger" | "info" | "neutral";
  moduleId: DashboardModuleId;
}

/**
 * Event context + overview statistics.
 * `event` is null when the workspace has no active event.
 */
export interface DashboardSummary {
  eventId: string | null;
  event: {
    id: string;
    name: string;
    code: string;
    status: StatusKind;
    description: string;
    /** Human-readable event date, e.g. "15 October 2026". */
    dateLabel: string;
    startIso: string;
    endIso: string;
    venue: string;
    /** Whole days until the event starts; null when already past. */
    daysRemaining: number | null;
  } | null;
  stats: DashboardStat[];
  generatedAt: string;
}

/* ---------------------------- Priorities ----------------------------- */

export interface PriorityItem {
  id: string;
  title: string;
  owner: string;
  dueIso: string;
  priority: Severity;
  status: StatusKind;
  moduleId: DashboardModuleId;
}

/* ----------------------------- Deadlines ----------------------------- */

export interface UpcomingDeadline {
  id: string;
  title: string;
  owner: string;
  dueIso: string;
  moduleId: DashboardModuleId;
}

/* ------------------------------- Risks ------------------------------- */

export interface DashboardRisk {
  id: string;
  title: string;
  /** Short explanation of the exposure. */
  detail: string;
  /** Functional area affected (e.g. "Venue"). */
  area: string;
  severity: Severity;
  owner: string;
}

/* ------------------------------ Progress ----------------------------- */

export interface EventProgress {
  overallPct: number;
  tasksPct: number;
  volunteerAssignmentPct: number;
  deadlinesPct: number;
}

/* ----------------------------- Volunteers ---------------------------- */

export interface VolunteerWorkload {
  id: string;
  name: string;
  shiftCount: number;
  /** Capacity used, 0–100, supplied by the backend. */
  loadPct: number;
  level: Severity;
}

export interface VolunteerSnapshot {
  active: number;
  assigned: number;
  available: number;
  overloaded: number;
  /** Shift coverage percentage, 0–100. */
  coveragePct: number;
  /**
   * Per-person workload. Null when the backend does not compute workload —
   * the UI then shows a neutral placeholder instead of guessing.
   */
  workload: VolunteerWorkload[] | null;
}

/* ----------------------------- AI brief ------------------------------ */

/**
 * Structured daily brief. The frontend renders this verbatim; it never
 * generates the narrative itself.
 */
export interface AIDailyBrief {
  greeting: string;
  /** Days until the event, when known. */
  daysRemaining: number | null;
  headlineItems: string[];
  activeRiskCount: number;
  closing: string;
  generatedAt: string;
}

/* --------------------------- Recent activity ------------------------- */

export interface RecentActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  /** Pre-formatted relative time (e.g. "10 min ago"). */
  timeLabel: string;
  moduleId: DashboardModuleId;
}
