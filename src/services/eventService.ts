import { isMockApi } from "./apiMode";
import { apiRequest } from "./http";
import { isoFromToday } from "@/data/demoEvents";
import type {
  CreateEventRequest,
  Event,
  EventsListResponse,
  ListEvent,
  UpdateEventRequest,
} from "@/types";

/**
 * Event service — the ONLY module that talks to event endpoints.
 *
 * Contract (owned by the backend):
 *   GET  /events                    → EventsListResponse
 *   POST /events                   → Event
 *   GET  /events/:eventId          → Event
 *   PATCH /events/:eventId         → Event
 *   DELETE /events/:eventId        → 204
 */
export interface EventService {
  listEvents(): Promise<EventsListResponse>;
  getEvent(eventId: string): Promise<Event>;
  createEvent(request: CreateEventRequest): Promise<Event>;
  updateEvent(eventId: string, request: UpdateEventRequest): Promise<Event>;
  deleteEvent(eventId: string): Promise<void>;
}

const httpEventService: EventService = {
  listEvents() {
    return apiRequest<EventsListResponse>("/events");
  },
  getEvent(eventId) {
    return apiRequest<Event>(`/events/${eventId}`);
  },
  createEvent(request) {
    return apiRequest<Event>("/events", { method: "POST", body: request });
  },
  updateEvent(eventId, request) {
    return apiRequest<Event>(`/events/${eventId}`, { method: "PATCH", body: request });
  },
  deleteEvent(eventId) {
    return apiRequest<void>(`/events/${eventId}`, { method: "DELETE" });
  },
};

/* ------------------------------------------------------------------ */
/* LOCAL_DEVELOPMENT — temporary mock                                  */
/*                                                                     */
/* ⚠️ No event endpoints exist yet. Delete when the backend is ready.   */
/* ------------------------------------------------------------------ */

const LATENCY_MS = 350;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mutable local store for the mock. Completely isolated from demoEvents
 * so the rest of the shell keeps working unchanged.
 */
const MOCK_EVENTS: ListEvent[] = [
  {
    id: "techfest-2026",
    name: "TechFest 2026",
    code: "TF26",
    status: "active",
    startIso: isoFromToday(24),
    endIso: isoFromToday(26, 22),
    venue: "Innovation Hall — Campus North",
    summary: "Three-day flagship technology festival with 40 sessions and a startup expo.",
    readiness: 68,
    taskCount: 25,
    volunteerCount: 48,
    attendeesExpected: 1200,
    teamSize: 48,
  },
  {
    id: "spring-gala",
    name: "Spring Volunteer Gala",
    code: "SVG26",
    status: "planned",
    startIso: isoFromToday(63, 18),
    endIso: isoFromToday(63, 23),
    venue: "Riverside Pavilion",
    summary: "Annual thank-you dinner and awards evening for the volunteer network.",
    readiness: 24,
    taskCount: 18,
    volunteerCount: 14,
    attendeesExpected: 240,
    teamSize: 14,
  },
  {
    id: "hack-night-14",
    name: "Hack Night #14",
    code: "HN14",
    status: "at-risk",
    startIso: isoFromToday(9, 17),
    endIso: isoFromToday(10, 2),
    venue: "Maker Lab B2",
    summary: "Overnight build session with mentor rotations and a morning demo round.",
    readiness: 41,
    taskCount: 12,
    volunteerCount: 9,
    attendeesExpected: 90,
    teamSize: 9,
  },
  {
    id: "alumni-summit",
    name: "Alumni Summit",
    code: "ALS25",
    status: "complete",
    startIso: isoFromToday(-38),
    endIso: isoFromToday(-37, 20),
    venue: "Grand Lecture Theatre",
    summary: "Networking summit with keynote panels and a mentoring marketplace.",
    readiness: 100,
    taskCount: 42,
    volunteerCount: 21,
    attendeesExpected: 430,
    teamSize: 21,
  },
];

/**
 * Builds a full Event from a mock ListEvent.
 */
function buildMockEvent(listEvent: ListEvent): Event {
  return {
    id: listEvent.id,
    name: listEvent.name,
    code: listEvent.code,
    status: listEvent.status,
    startIso: listEvent.startIso,
    endIso: listEvent.endIso,
    venue: listEvent.venue,
    summary: listEvent.summary,
    description:
      "This event brings together students, alumni and industry partners for a day of learning, networking and showcasing innovation.",
    attendeesExpected: listEvent.volunteerCount !== null ? listEvent.volunteerCount * 8 : null,
    teamSize: listEvent.volunteerCount,
    readiness: listEvent.readiness,
    ownerId: "usr_rahul",
    ownerName: "Rahul Kapoor",
    createdAt: isoFromToday(-45),
    updatedAt: new Date().toISOString(),
    taskCount: listEvent.taskCount,
    volunteerCount: listEvent.volunteerCount,
  };
}

const mockEventService: EventService = {
  async listEvents() {
    await wait(LATENCY_MS);
    return { events: [...MOCK_EVENTS] };
  },
  async getEvent(eventId) {
    await wait(LATENCY_MS);
    const listEvent = MOCK_EVENTS.find((e) => e.id === eventId);
    if (!listEvent) throw new Error("Event not found");
    return buildMockEvent(listEvent);
  },
  async createEvent(request) {
    await wait(LATENCY_MS);
    const id = `mock_${Date.now()}`;
    const code = request.code ?? request.name.slice(0, 4).toUpperCase().replace(/\s/g, "");
    const listEvent: ListEvent = {
      id,
      name: request.name,
      code,
      status: "draft",
      startIso: request.startIso,
      endIso: request.endIso,
      venue: request.venue,
      summary: request.summary ?? null,
      readiness: 0,
      taskCount: null,
      volunteerCount: null,
      attendeesExpected: request.attendeesExpected ?? null,
      teamSize: request.teamSize ?? null,
    };
    MOCK_EVENTS.push(listEvent);
    return buildMockEvent(listEvent);
  },
  async updateEvent(eventId, request) {
    await wait(LATENCY_MS);
    const index = MOCK_EVENTS.findIndex((e) => e.id === eventId);
    if (index === -1) throw new Error("Event not found");
    const updated = { ...MOCK_EVENTS[index], ...request };
    MOCK_EVENTS[index] = updated;
    return buildMockEvent(updated);
  },
  async deleteEvent(eventId) {
    await wait(LATENCY_MS);
    const index = MOCK_EVENTS.findIndex((e) => e.id === eventId);
    if (index !== -1) MOCK_EVENTS.splice(index, 1);
  },
};

export const eventService: EventService = isMockApi ? mockEventService : httpEventService;
