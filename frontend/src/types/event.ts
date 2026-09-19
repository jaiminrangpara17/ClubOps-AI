import type { StatusKind } from "./ui";

/**
 * Minimal event shape used by the application shell.
 * Mirrors the fields the API is expected to expose so preview data can be
 * swapped for real data without touching components.
 */
export interface ClubEvent {
  id: string;
  name: string;
  /** Short reference code, e.g. "TF26". */
  code: string;
  status: StatusKind;
  startIso: string;
  endIso: string;
  venue: string;
  summary: string;
  attendeesExpected: number;
  teamSize: number;
  /** Operational readiness percentage (0–100). */
  readiness: number;
}
