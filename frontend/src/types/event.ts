/**
 * Event domain types — the single source of truth for events.
 * Keep these aligned with the backend schema; do not duplicate elsewhere.
 */

import type { StatusKind } from "./ui";

export type EventStatus = StatusKind;

/** Minimal event shape used by the application shell. */
export interface ClubEvent {
  id: string;
  name: string;
  /** Short reference code, e.g. "TF26". */
  code: string;
  status: EventStatus;
  startIso: string;
  endIso: string;
  venue: string;
  summary: string;
  attendeesExpected: number;
  teamSize: number;
  /** Operational readiness percentage (0–100). */
  readiness: number;
}

/** Full event shape returned by GET /events/:eventId. */
export interface Event {
  id: string;
  name: string;
  code: string;
  status: EventStatus;
  startIso: string;
  endIso: string;
  venue: string;
  summary: string | null;
  description: string | null;
  attendeesExpected: number | null;
  teamSize: number | null;
  readiness: number;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
  /** Counts are populated when the backend can compute them. */
  taskCount: number | null;
  volunteerCount: number | null;
}

/** Request to create an event. */
export interface CreateEventRequest {
  name: string;
  code?: string;
  startIso: string;
  endIso: string;
  venue: string;
  summary?: string;
  description?: string;
  attendeesExpected?: number;
  teamSize?: number;
}

/** Request to update an event. */
export interface UpdateEventRequest {
  name?: string;
  code?: string;
  startIso?: string;
  endIso?: string;
  venue?: string;
  summary?: string | null;
  description?: string | null;
  attendeesExpected?: number | null;
  teamSize?: number | null;
}

/** Minimal event used in lists. */
export interface ListEvent {
  id: string;
  name: string;
  code: string;
  status: EventStatus;
  startIso: string;
  endIso: string;
  venue: string;
  summary: string | null;
  readiness: number;
  taskCount: number | null;
  volunteerCount: number | null;
}

/** List response envelope. */
export interface EventsListResponse {
  events: ListEvent[];
}

/** Filter options for the events list. */
export type EventFilter = "all" | "draft" | "planned" | "active" | "blocked" | "at-risk" | "complete" | "cancelled";
