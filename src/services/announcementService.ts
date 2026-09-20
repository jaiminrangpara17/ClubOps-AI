import { isMockApi } from "./apiMode";
import { ApiError, apiRequest } from "./http";
import { getInitialAnnouncements } from "@/data/mockAnnouncements";
import { taskService } from "./taskService";
import type {
  Announcement,
  AnnouncementCapabilities,
  AnnouncementsListResponse,
  AnnouncementStatus,
  CreateAnnouncementRequest,
  EventMember,
  UpdateAnnouncementRequest,
} from "@/types";

/**
 * Announcement service — all API operations remain centralized here.
 *
 * Proposed contract (no backend implementation exists yet):
 *   GET   /events/:eventId/announcements/capabilities
 *   GET   /events/:eventId/announcements
 *   POST  /events/:eventId/announcements
 *   GET   /events/:eventId/announcements/:announcementId
 *   PATCH /events/:eventId/announcements/:announcementId
 *   POST  /events/:eventId/announcements/:announcementId/publish
 *   POST  /events/:eventId/announcements/:announcementId/unpublish
 *   POST  /events/:eventId/announcements/:announcementId/archive
 *
 * Schedule, attachments, delete and read-state endpoints are intentionally
 * absent — they are not part of any agreed contract and capabilities stay
 * false so the UI never offers them.
 */
export interface AnnouncementService {
  getCapabilities(eventId: string): Promise<AnnouncementCapabilities>;
  listAnnouncements(eventId: string): Promise<AnnouncementsListResponse>;
  getAnnouncement(eventId: string, announcementId: string): Promise<Announcement>;
  createAnnouncement(eventId: string, request: CreateAnnouncementRequest): Promise<Announcement>;
  updateAnnouncement(
    eventId: string,
    announcementId: string,
    request: UpdateAnnouncementRequest,
  ): Promise<Announcement>;
  publishAnnouncement(eventId: string, announcementId: string): Promise<Announcement>;
  unpublishAnnouncement(eventId: string, announcementId: string): Promise<Announcement>;
  archiveAnnouncement(eventId: string, announcementId: string): Promise<Announcement>;
  listMembers(eventId: string): Promise<EventMember[]>;
}

const httpAnnouncementService: AnnouncementService = {
  getCapabilities(eventId) {
    return apiRequest<AnnouncementCapabilities>(`/events/${eventId}/announcements/capabilities`);
  },
  listAnnouncements(eventId) {
    return apiRequest<AnnouncementsListResponse>(`/events/${eventId}/announcements`);
  },
  getAnnouncement(eventId, announcementId) {
    return apiRequest<Announcement>(`/events/${eventId}/announcements/${announcementId}`);
  },
  createAnnouncement(eventId, request) {
    return apiRequest<Announcement>(`/events/${eventId}/announcements`, {
      method: "POST",
      body: request,
    });
  },
  updateAnnouncement(eventId, announcementId, request) {
    return apiRequest<Announcement>(`/events/${eventId}/announcements/${announcementId}`, {
      method: "PATCH",
      body: request,
    });
  },
  publishAnnouncement(eventId, announcementId) {
    return apiRequest<Announcement>(`/events/${eventId}/announcements/${announcementId}/publish`, {
      method: "POST",
    });
  },
  unpublishAnnouncement(eventId, announcementId) {
    return apiRequest<Announcement>(
      `/events/${eventId}/announcements/${announcementId}/unpublish`,
      { method: "POST" },
    );
  },
  archiveAnnouncement(eventId, announcementId) {
    return apiRequest<Announcement>(`/events/${eventId}/announcements/${announcementId}/archive`, {
      method: "POST",
    });
  },
  listMembers(eventId) {
    return taskService.listMembers(eventId);
  },
};

/* ------------------------------------------------------------------ */
/* LOCAL_DEVELOPMENT — temporary mock                                  */
/*                                                                     */
/* ⚠️ No delivery, scheduling, attachments or read receipts. Publish    */
/* only flips status after this adapter confirms success.               */
/* ------------------------------------------------------------------ */

const LATENCY_MS = 280;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const STORE = new Map<string, Announcement[]>();

const MOCK_CAPABILITIES: AnnouncementCapabilities = {
  create: true,
  update: true,
  delete: false,
  publish: true,
  unpublish: true,
  archive: true,
  schedule: false,
  attachments: false,
  readState: false,
};

function recordsFor(eventId: string): Announcement[] {
  let list = STORE.get(eventId);
  if (!list) {
    list = getInitialAnnouncements(eventId);
    STORE.set(eventId, list);
  }
  return list;
}

function findScoped(eventId: string, announcementId: string): Announcement {
  const record = recordsFor(eventId).find((entry) => entry.id === announcementId);
  if (!record) throw new ApiError("not-found", "Announcement not found", 404);
  return record;
}

function transitionsFor(status: AnnouncementStatus): AnnouncementStatus[] {
  switch (status) {
    case "draft":
      return ["published", "archived"];
    case "published":
      return ["draft", "archived"];
    case "archived":
      return ["published"];
    default:
      return [];
  }
}

const mockAnnouncementService: AnnouncementService = {
  async getCapabilities() {
    await wait(120);
    return { ...MOCK_CAPABILITIES };
  },
  async listAnnouncements(eventId) {
    await wait(LATENCY_MS);
    const announcements = recordsFor(eventId);
    return { announcements: structuredClone(announcements), totalCount: announcements.length };
  },
  async getAnnouncement(eventId, announcementId) {
    await wait(LATENCY_MS);
    return structuredClone(findScoped(eventId, announcementId));
  },
  async createAnnouncement(eventId, request) {
    await wait(LATENCY_MS);
    const timestamp = new Date().toISOString();
    const members = await taskService.listMembers(eventId);
    const author = members[0] ?? null;
    const published = Boolean(request.publish);
    const record: Announcement = {
      id: `ann_${Date.now().toString(36)}`,
      eventId,
      title: request.title.trim(),
      body: request.body.trim(),
      status: published ? "published" : "draft",
      priority: request.priority,
      category: request.category,
      audience: request.audience,
      authorMemberId: author?.id ?? null,
      authorName: author?.name ?? null,
      publishedAt: published ? timestamp : null,
      createdAt: timestamp,
      updatedAt: timestamp,
      allowedTransitions: transitionsFor(published ? "published" : "draft"),
    };
    recordsFor(eventId).unshift(record);
    return structuredClone(record);
  },
  async updateAnnouncement(eventId, announcementId, request) {
    await wait(LATENCY_MS);
    const list = recordsFor(eventId);
    const index = list.findIndex((entry) => entry.id === announcementId);
    if (index === -1) throw new ApiError("not-found", "Announcement not found", 404);
    const existing = list[index]!;
    const updated: Announcement = {
      ...existing,
      title: request.title?.trim() ?? existing.title,
      body: request.body?.trim() ?? existing.body,
      priority: request.priority ?? existing.priority,
      category: request.category ?? existing.category,
      audience: request.audience ?? existing.audience,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    return structuredClone(updated);
  },
  async publishAnnouncement(eventId, announcementId) {
    await wait(LATENCY_MS);
    const record = findScoped(eventId, announcementId);
    if (!record.allowedTransitions.includes("published")) {
      throw new ApiError("conflict", "Publish is not allowed in the current state", 409);
    }
    record.status = "published";
    record.publishedAt = new Date().toISOString();
    record.updatedAt = record.publishedAt;
    record.allowedTransitions = transitionsFor("published");
    return structuredClone(record);
  },
  async unpublishAnnouncement(eventId, announcementId) {
    await wait(LATENCY_MS);
    const record = findScoped(eventId, announcementId);
    if (record.status !== "published") {
      throw new ApiError("conflict", "Only published announcements can be unpublished", 409);
    }
    record.status = "draft";
    record.updatedAt = new Date().toISOString();
    record.allowedTransitions = transitionsFor("draft");
    return structuredClone(record);
  },
  async archiveAnnouncement(eventId, announcementId) {
    await wait(LATENCY_MS);
    const record = findScoped(eventId, announcementId);
    if (!record.allowedTransitions.includes("archived")) {
      throw new ApiError("conflict", "Archive is not allowed in the current state", 409);
    }
    record.status = "archived";
    record.updatedAt = new Date().toISOString();
    record.allowedTransitions = transitionsFor("archived");
    return structuredClone(record);
  },
  listMembers(eventId) {
    return taskService.listMembers(eventId);
  },
};

export const announcementService: AnnouncementService = isMockApi
  ? mockAnnouncementService
  : httpAnnouncementService;
