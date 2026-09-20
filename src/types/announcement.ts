/**
 * Announcement domain types.
 *
 * No backend announcement contract exists yet. These types document the
 * adapter contract. Delivery, scheduling, attachments and read receipts are
 * capability-gated and are not implemented unless the backend advertises them.
 */

export type AnnouncementStatus = "draft" | "published" | "archived";
export type AnnouncementPriority = "normal" | "important" | "urgent";
export type AnnouncementAudience = "event_team" | "organizers" | "volunteers";
export type AnnouncementCategory = "general" | "operations" | "reminder" | "decision";

export interface Announcement {
  id: string;
  eventId: string;
  title: string;
  /** Plain text only — never treated as HTML. */
  body: string;
  status: AnnouncementStatus;
  priority: AnnouncementPriority;
  category: AnnouncementCategory;
  audience: AnnouncementAudience;
  authorMemberId: string | null;
  authorName: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Backend-supplied allowed transitions. */
  allowedTransitions: AnnouncementStatus[];
}

export interface CreateAnnouncementRequest {
  title: string;
  body: string;
  priority: AnnouncementPriority;
  category: AnnouncementCategory;
  audience: AnnouncementAudience;
  /** If true, the backend publishes immediately; otherwise the record stays a draft. */
  publish?: boolean;
}

export type UpdateAnnouncementRequest = Partial<Omit<CreateAnnouncementRequest, "publish">>;

export interface AnnouncementsListResponse {
  announcements: Announcement[];
  totalCount: number;
}

export interface AnnouncementCapabilities {
  create: boolean;
  update: boolean;
  delete: boolean;
  publish: boolean;
  unpublish: boolean;
  archive: boolean;
  /** Not implemented unless the backend advertises this. */
  schedule: boolean;
  attachments: boolean;
  readState: boolean;
}

export interface AnnouncementFilters {
  search: string;
  status: AnnouncementStatus | "all";
  priority: AnnouncementPriority | "all";
  category: AnnouncementCategory | "all";
  audience: AnnouncementAudience | "all";
}

export interface AnnouncementStats {
  total: number;
  published: number;
  drafts: number;
  archived: number;
}
