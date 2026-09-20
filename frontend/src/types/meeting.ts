/**
 * Meeting domain types — single source of truth for meeting intelligence.
 *
 * No backend meeting contract exists yet. These types describe the contract
 * the frontend is prepared to consume; sync with the API team when it ships.
 * Task references reuse the Part 06 Task model — nothing is duplicated here.
 */
import type { TaskPriority, TaskStatus } from "./task";

export type MeetingStatus = "scheduled" | "held" | "cancelled";

/** Asynchronous intelligence extraction state, owned by the backend. */
export type MeetingProcessingStatus = "not_processed" | "processing" | "completed" | "failed";

export interface MeetingParticipant {
  /** Global member id; may or may not be an event volunteer. */
  memberId: string;
  name: string;
  /** Event-specific role when known; null for guests/faculty. */
  role: string | null;
}

export interface MeetingDecision {
  id: string;
  text: string;
  /** Context supplied by extraction when available. */
  context: string | null;
}

export interface MeetingActionItem {
  id: string;
  text: string;
  ownerMemberId: string | null;
  ownerName: string | null;
  dueIso: string | null;
  priority: TaskPriority | null;
  /** Id of the operational task created/linked from this item. */
  linkedTaskId: string | null;
  /** Snapshot of the linked task status when the backend resolves it. */
  linkedTaskStatus: TaskStatus | null;
}

export interface MeetingIntelligence {
  summary: string | null;
  decisions: MeetingDecision[];
  actionItems: MeetingActionItem[];
  generatedAt: string | null;
}

/** List/detail representation. Transcript is fetched separately on demand. */
export interface Meeting {
  id: string;
  eventId: string;
  title: string;
  startIso: string;
  endIso: string | null;
  location: string | null;
  organizerMemberId: string | null;
  organizerName: string | null;
  participants: MeetingParticipant[];
  agenda: string | null;
  notes: string | null;
  status: MeetingStatus;
  processingStatus: MeetingProcessingStatus;
  processingError: string | null;
  hasTranscript: boolean;
  decisionCount: number;
  actionItemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingTranscript {
  meetingId: string;
  /** Plain text; paragraphs separated by blank lines. */
  text: string;
  updatedAt: string;
}

export interface CreateMeetingRequest {
  title: string;
  startIso: string;
  endIso?: string | null;
  location?: string | null;
  organizerMemberId?: string | null;
  participantMemberIds?: string[];
  agenda?: string | null;
  notes?: string | null;
  status?: MeetingStatus;
}

export type UpdateMeetingRequest = Partial<CreateMeetingRequest>;

export interface MeetingsListResponse {
  meetings: Meeting[];
  totalCount: number;
}

export interface MeetingFilters {
  search: string;
  status: MeetingStatus | "all";
  processingStatus: MeetingProcessingStatus | "all";
  timeframe: "all" | "upcoming" | "past";
}

export interface MeetingStats {
  total: number;
  upcoming: number;
  processing: number;
  decisions: number;
  actionItems: number;
}
