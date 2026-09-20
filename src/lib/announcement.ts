import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementCategory,
  AnnouncementFilters,
  AnnouncementPriority,
  AnnouncementStats,
  AnnouncementStatus,
  Tone,
} from "@/types";

export const ANNOUNCEMENT_STATUS_LABEL: Record<AnnouncementStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const ANNOUNCEMENT_STATUS_TONE: Record<AnnouncementStatus, Tone> = {
  draft: "neutral",
  published: "success",
  archived: "neutral",
};

export const ANNOUNCEMENT_PRIORITY_LABEL: Record<AnnouncementPriority, string> = {
  normal: "Normal",
  important: "Important",
  urgent: "Urgent",
};

export const ANNOUNCEMENT_PRIORITY_TONE: Record<AnnouncementPriority, Tone> = {
  normal: "neutral",
  important: "warning",
  urgent: "danger",
};

export const ANNOUNCEMENT_AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  event_team: "Entire event team",
  organizers: "Organizers",
  volunteers: "Volunteers",
};

export const ANNOUNCEMENT_CATEGORY_LABEL: Record<AnnouncementCategory, string> = {
  general: "General",
  operations: "Operations",
  reminder: "Reminder",
  decision: "Decision",
};

export const EMPTY_ANNOUNCEMENT_FILTERS: AnnouncementFilters = {
  search: "",
  status: "all",
  priority: "all",
  category: "all",
  audience: "all",
};

export function computeAnnouncementStats(announcements: Announcement[]): AnnouncementStats {
  return {
    total: announcements.length,
    published: announcements.filter((item) => item.status === "published").length,
    drafts: announcements.filter((item) => item.status === "draft").length,
    archived: announcements.filter((item) => item.status === "archived").length,
  };
}

export function filterAnnouncements(
  announcements: Announcement[],
  filters: AnnouncementFilters,
): Announcement[] {
  const query = filters.search.trim().toLowerCase();
  return announcements.filter((item) => {
    if (query && !`${item.title} ${item.body}`.toLowerCase().includes(query)) return false;
    if (filters.status !== "all" && item.status !== filters.status) return false;
    if (filters.priority !== "all" && item.priority !== filters.priority) return false;
    if (filters.category !== "all" && item.category !== filters.category) return false;
    if (filters.audience !== "all" && item.audience !== filters.audience) return false;
    return true;
  });
}

export function sortAnnouncements(announcements: Announcement[]): Announcement[] {
  return [...announcements].sort((a, b) => {
    const aTime = Date.parse(a.publishedAt ?? a.updatedAt);
    const bTime = Date.parse(b.publishedAt ?? b.updatedAt);
    return bTime - aTime;
  });
}

/** Status copy — never implied from colour. */
export function announcementVisibilityCopy(status: AnnouncementStatus): string {
  switch (status) {
    case "draft":
      return "Only visible to authorized editors.";
    case "published":
      return "Published to the configured audience.";
    case "archived":
      return "Archived. No longer shown as a current update.";
    default:
      return "";
  }
}
