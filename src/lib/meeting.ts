import type {
  Meeting,
  MeetingFilters,
  MeetingProcessingStatus,
  MeetingStats,
  MeetingStatus,
  Tone,
} from "@/types";

export const MEETING_STATUS_LABEL: Record<MeetingStatus, string> = {
  scheduled: "Scheduled",
  held: "Held",
  cancelled: "Cancelled",
};

export const MEETING_STATUS_TONE: Record<MeetingStatus, Tone> = {
  scheduled: "info",
  held: "success",
  cancelled: "neutral",
};

export const PROCESSING_LABEL: Record<MeetingProcessingStatus, string> = {
  not_processed: "Not processed",
  processing: "Processing",
  completed: "Intelligence ready",
  failed: "Processing failed",
};

export const PROCESSING_TONE: Record<MeetingProcessingStatus, Tone> = {
  not_processed: "neutral",
  processing: "warning",
  completed: "brand",
  failed: "danger",
};

export const EMPTY_MEETING_FILTERS: MeetingFilters = {
  search: "",
  status: "all",
  processingStatus: "all",
  timeframe: "all",
};

export function isUpcomingMeeting(meeting: Meeting, now: Date = new Date()): boolean {
  return meeting.status === "scheduled" && Date.parse(meeting.startIso) >= now.getTime();
}

/** Display-only counts derived from already-fetched records. */
export function computeMeetingStats(meetings: Meeting[]): MeetingStats {
  return {
    total: meetings.length,
    upcoming: meetings.filter((meeting) => isUpcomingMeeting(meeting)).length,
    processing: meetings.filter((meeting) => meeting.processingStatus === "processing").length,
    decisions: meetings.reduce((sum, meeting) => sum + meeting.decisionCount, 0),
    actionItems: meetings.reduce((sum, meeting) => sum + meeting.actionItemCount, 0),
  };
}

export function filterMeetings(meetings: Meeting[], filters: MeetingFilters): Meeting[] {
  const query = filters.search.trim().toLowerCase();
  return meetings.filter((meeting) => {
    if (query && !meeting.title.toLowerCase().includes(query)) return false;
    if (filters.status !== "all" && meeting.status !== filters.status) return false;
    if (
      filters.processingStatus !== "all" &&
      meeting.processingStatus !== filters.processingStatus
    ) {
      return false;
    }
    if (filters.timeframe === "upcoming" && !isUpcomingMeeting(meeting)) return false;
    if (filters.timeframe === "past" && isUpcomingMeeting(meeting)) return false;
    return true;
  });
}

/** Most recent first — meetings are consumed as a chronological log. */
export function sortMeetings(meetings: Meeting[]): Meeting[] {
  return [...meetings].sort((a, b) => Date.parse(b.startIso) - Date.parse(a.startIso));
}

const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

export function formatMeetingTime(startIso: string, endIso: string | null): string {
  const start = TIME.format(new Date(startIso));
  return endIso ? `${start} – ${TIME.format(new Date(endIso))}` : start;
}
