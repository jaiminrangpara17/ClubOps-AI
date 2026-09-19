import { buildMockDailyBrief, buildMockDeadlines, buildMockPriorities, buildMockProgress, buildMockRecentActivity, buildMockRisks, buildMockSummary, buildMockVolunteerSnapshot } from "@/data/mockDashboardData";
import { DEMO_EVENTS } from "@/data/demoEvents";
import { daysUntil } from "@/lib/format";
import type {
  AIDailyBrief,
  DashboardRisk,
  DashboardSummary,
  EventProgress,
  PriorityItem,
  RecentActivityItem,
  UpcomingDeadline,
  VolunteerSnapshot,
} from "@/types/dashboard";
import { apiRequest } from "./http";
import { isMockApi } from "./apiMode";

/**
 * Dashboard service — the ONLY module that talks to dashboard endpoints.
 * Presentational components never call fetch directly.
 *
 * Contract (owned by the backend):
 *   GET /events/:eventId/dashboard/summary    → DashboardSummary
 *   GET /events/:eventId/dashboard/priorities → PriorityItem[]
 *   GET /events/:eventId/dashboard/deadlines  → UpcomingDeadline[]
 *   GET /events/:eventId/dashboard/risks      → DashboardRisk[]
 *   GET /events/:eventId/dashboard/progress   → EventProgress
 *   GET /events/:eventId/dashboard/volunteers → VolunteerSnapshot
 *   GET /events/:eventId/dashboard/brief      → AIDailyBrief
 *   GET /events/:eventId/dashboard/activity   → RecentActivityItem[]
 *
 * Sections are fetched independently so one failing endpoint cannot take down
 * the whole dashboard.
 */
export interface DashboardService {
  getDashboardSummary(eventId: string, token: string): Promise<DashboardSummary>;
  getPriorities(eventId: string, token: string): Promise<PriorityItem[]>;
  getUpcomingDeadlines(eventId: string, token: string): Promise<UpcomingDeadline[]>;
  getDashboardRisks(eventId: string, token: string): Promise<DashboardRisk[]>;
  getEventProgress(eventId: string, token: string): Promise<EventProgress>;
  getVolunteerSnapshot(eventId: string, token: string): Promise<VolunteerSnapshot>;
  getDailyBrief(eventId: string, token: string): Promise<AIDailyBrief>;
  getRecentActivity(eventId: string, token: string): Promise<RecentActivityItem[]>;
}

const httpDashboardService: DashboardService = {
  getDashboardSummary(eventId, token) {
    return apiRequest<DashboardSummary>(`/events/${eventId}/dashboard/summary`, { token });
  },
  getPriorities(eventId, token) {
    return apiRequest<PriorityItem[]>(`/events/${eventId}/dashboard/priorities`, { token });
  },
  getUpcomingDeadlines(eventId, token) {
    return apiRequest<UpcomingDeadline[]>(`/events/${eventId}/dashboard/deadlines`, { token });
  },
  getDashboardRisks(eventId, token) {
    return apiRequest<DashboardRisk[]>(`/events/${eventId}/dashboard/risks`, { token });
  },
  getEventProgress(eventId, token) {
    return apiRequest<EventProgress>(`/events/${eventId}/dashboard/progress`, { token });
  },
  getVolunteerSnapshot(eventId, token) {
    return apiRequest<VolunteerSnapshot>(`/events/${eventId}/dashboard/volunteers`, { token });
  },
  getDailyBrief(eventId, token) {
    return apiRequest<AIDailyBrief>(`/events/${eventId}/dashboard/brief`, { token });
  },
  getRecentActivity(eventId, token) {
    return apiRequest<RecentActivityItem[]>(`/events/${eventId}/dashboard/activity`, { token });
  },
};

/* ------------------------------------------------------------------ */
/* LOCAL_DEVELOPMENT — temporary mock                                  */
/*                                                                     */
/* ⚠️ No dashboard endpoints exist yet. Delete this implementation and  */
/* the data builders when the backend is available.                     */
/* ------------------------------------------------------------------ */

const LATENCY_MS = 480;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function mockEvent(eventId: string) {
  const event = DEMO_EVENTS.find((entry) => entry.id === eventId);
  if (!event) throw new Error("Event not found");
  return event;
}

const mockDashboardService: DashboardService = {
  async getDashboardSummary(eventId) {
    await wait(LATENCY_MS);
    const event = mockEvent(eventId);
    const remaining = daysUntil(event.startIso);
    return buildMockSummary(
      event,
      remaining < 0 ? null : remaining,
    );
  },
  async getPriorities(eventId) {
    await wait(LATENCY_MS + 60);
    void eventId;
    return buildMockPriorities();
  },
  async getUpcomingDeadlines(eventId) {
    await wait(LATENCY_MS + 120);
    void eventId;
    return buildMockDeadlines();
  },
  async getDashboardRisks(eventId) {
    await wait(LATENCY_MS + 180);
    void eventId;
    return buildMockRisks();
  },
  async getEventProgress(eventId) {
    await wait(LATENCY_MS + 240);
    return buildMockProgress(mockEvent(eventId).readiness);
  },
  async getVolunteerSnapshot(eventId) {
    await wait(LATENCY_MS + 300);
    void eventId;
    return buildMockVolunteerSnapshot();
  },
  async getDailyBrief(eventId) {
    await wait(LATENCY_MS + 360);
    const event = mockEvent(eventId);
    const remaining = daysUntil(event.startIso);
    return buildMockDailyBrief(remaining < 0 ? null : remaining, buildMockRisks().length);
  },
  async getRecentActivity(eventId) {
    await wait(LATENCY_MS + 420);
    void eventId;
    return buildMockRecentActivity();
  },
};

export const dashboardService: DashboardService = isMockApi
  ? mockDashboardService
  : httpDashboardService;
