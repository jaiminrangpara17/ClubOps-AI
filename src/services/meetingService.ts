import { isMockApi } from "./apiMode";
import { ApiError, apiRequest } from "./http";
import { taskService } from "./taskService";
import {
  getInitialMeetings,
  MOCK_INTELLIGENCE,
  MOCK_TRANSCRIPTS,
} from "@/data/mockMeetings";
import { MOCK_MEMBERS } from "@/data/mockTasks";
import type {
  CreateMeetingRequest,
  EventMember,
  Meeting,
  MeetingActionItem,
  MeetingIntelligence,
  MeetingsListResponse,
  MeetingTranscript,
  Task,
  UpdateMeetingRequest,
} from "@/types";

/**
 * Meeting service — the ONLY module that talks to meeting endpoints.
 *
 * Proposed contract (no backend implementation exists yet):
 *   GET   /events/:eventId/meetings                                → MeetingsListResponse
 *   POST  /events/:eventId/meetings                                → Meeting
 *   GET   /events/:eventId/meetings/:meetingId                     → Meeting
 *   PATCH /events/:eventId/meetings/:meetingId                     → Meeting
 *   GET   /events/:eventId/meetings/:meetingId/transcript          → MeetingTranscript   (404 when none)
 *   PUT   /events/:eventId/meetings/:meetingId/transcript          → MeetingTranscript   (plain text only)
 *   GET   /events/:eventId/meetings/:meetingId/intelligence        → MeetingIntelligence
 *   POST  /events/:eventId/meetings/:meetingId/process             → Meeting  (queues extraction)
 *   POST  /events/:eventId/meetings/:meetingId/action-items/:id/task → MeetingActionItem
 *
 * Deletion, file/audio upload and hard "retry" endpoints are intentionally
 * absent — they are not part of any agreed contract. Task creation reuses the
 * Part 06 taskService; nothing task-related is duplicated here.
 */
export interface MeetingService {
  listMeetings(eventId: string): Promise<MeetingsListResponse>;
  getMeeting(eventId: string, meetingId: string): Promise<Meeting>;
  createMeeting(eventId: string, request: CreateMeetingRequest): Promise<Meeting>;
  updateMeeting(eventId: string, meetingId: string, request: UpdateMeetingRequest): Promise<Meeting>;
  getMeetingTranscript(eventId: string, meetingId: string): Promise<MeetingTranscript | null>;
  saveMeetingTranscript(eventId: string, meetingId: string, text: string): Promise<MeetingTranscript>;
  getMeetingIntelligence(eventId: string, meetingId: string): Promise<MeetingIntelligence>;
  processMeeting(eventId: string, meetingId: string): Promise<Meeting>;
  createTaskFromActionItem(
    eventId: string,
    meetingId: string,
    actionItemId: string,
  ): Promise<{ actionItem: MeetingActionItem; task: Task }>;
  listMembers(eventId: string): Promise<EventMember[]>;
}

const httpMeetingService: MeetingService = {
  listMeetings(eventId) {
    return apiRequest<MeetingsListResponse>(`/events/${eventId}/meetings`);
  },
  getMeeting(eventId, meetingId) {
    return apiRequest<Meeting>(`/events/${eventId}/meetings/${meetingId}`);
  },
  createMeeting(eventId, request) {
    return apiRequest<Meeting>(`/events/${eventId}/meetings`, { method: "POST", body: request });
  },
  updateMeeting(eventId, meetingId, request) {
    return apiRequest<Meeting>(`/events/${eventId}/meetings/${meetingId}`, {
      method: "PATCH",
      body: request,
    });
  },
  async getMeetingTranscript(eventId, meetingId) {
    try {
      return await apiRequest<MeetingTranscript>(
        `/events/${eventId}/meetings/${meetingId}/transcript`,
      );
    } catch (error) {
      if (error instanceof ApiError && error.kind === "not-found") return null;
      throw error;
    }
  },
  saveMeetingTranscript(eventId, meetingId, text) {
    return apiRequest<MeetingTranscript>(`/events/${eventId}/meetings/${meetingId}/transcript`, {
      method: "PUT",
      body: { text },
    });
  },
  getMeetingIntelligence(eventId, meetingId) {
    return apiRequest<MeetingIntelligence>(
      `/events/${eventId}/meetings/${meetingId}/intelligence`,
    );
  },
  processMeeting(eventId, meetingId) {
    return apiRequest<Meeting>(`/events/${eventId}/meetings/${meetingId}/process`, {
      method: "POST",
    });
  },
  createTaskFromActionItem(eventId, meetingId, actionItemId) {
    return apiRequest<{ actionItem: MeetingActionItem; task: Task }>(
      `/events/${eventId}/meetings/${meetingId}/action-items/${actionItemId}/task`,
      { method: "POST" },
    );
  },
  listMembers(eventId) {
    return taskService.listMembers(eventId);
  },
};

/* ------------------------------------------------------------------ */
/* LOCAL_DEVELOPMENT — temporary mock                                  */
/*                                                                     */
/* ⚠️ Simulates the contract above in memory. "Processing" here is a    */
/* timer that swaps in hand-written SAMPLE intelligence — there is no   */
/* transcription or extraction model behind it. Delete when the backend */
/* ships.                                                              */
/* ------------------------------------------------------------------ */

const LATENCY_MS = 280;
const SIMULATED_PROCESSING_MS = 4_000;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MEETING_STORE = new Map<string, Meeting[]>();
const TRANSCRIPT_STORE = new Map<string, MeetingTranscript>(Object.entries(MOCK_TRANSCRIPTS));
const INTELLIGENCE_STORE = new Map<string, MeetingIntelligence>(
  Object.entries(structuredClone(MOCK_INTELLIGENCE)),
);

const EMPTY_INTELLIGENCE: MeetingIntelligence = {
  summary: null,
  decisions: [],
  actionItems: [],
  generatedAt: null,
};

function meetingsFor(eventId: string): Meeting[] {
  let list = MEETING_STORE.get(eventId);
  if (!list) {
    list = getInitialMeetings(eventId);
    MEETING_STORE.set(eventId, list);
  }
  return list;
}

/** Event scoping is enforced here: a meeting id from another event is a 404. */
function findScoped(eventId: string, meetingId: string): Meeting {
  const meeting = meetingsFor(eventId).find((entry) => entry.id === meetingId);
  if (!meeting) throw new ApiError("not-found", "Meeting not found", 404);
  return meeting;
}

function memberName(memberId: string | null | undefined): string | null {
  if (!memberId) return null;
  return MOCK_MEMBERS.find((member) => member.id === memberId)?.name ?? null;
}

function participantsFrom(memberIds: string[] | undefined) {
  return (memberIds ?? []).map((memberId) => {
    const member = MOCK_MEMBERS.find((entry) => entry.id === memberId);
    return { memberId, name: member?.name ?? "Unknown member", role: member?.role ?? null };
  });
}

/** Sample extraction used when a meeting without seeded intelligence is processed. */
function sampleIntelligenceFor(meeting: Meeting): MeetingIntelligence {
  const owner = meeting.participants[0] ?? null;
  return {
    summary: `Sample summary for "${meeting.title}". Replace with backend extraction output.`,
    generatedAt: new Date().toISOString(),
    decisions: [
      { id: `dec_${meeting.id}_1`, text: "Confirm owners for every open agenda item.", context: null },
    ],
    actionItems: [
      {
        id: `act_${meeting.id}_1`,
        text: `Circulate notes from "${meeting.title}"`,
        ownerMemberId: owner?.memberId ?? null,
        ownerName: owner?.name ?? null,
        dueIso: null,
        priority: "medium",
        linkedTaskId: null,
        linkedTaskStatus: null,
      },
    ],
  };
}

const mockMeetingService: MeetingService = {
  async listMeetings(eventId) {
    await wait(LATENCY_MS);
    const meetings = meetingsFor(eventId);
    return { meetings: structuredClone(meetings), totalCount: meetings.length };
  },

  async getMeeting(eventId, meetingId) {
    await wait(LATENCY_MS);
    return structuredClone(findScoped(eventId, meetingId));
  },

  async createMeeting(eventId, request) {
    await wait(LATENCY_MS);
    const timestamp = new Date().toISOString();
    const meeting: Meeting = {
      id: `mtg_${Date.now().toString(36)}`,
      eventId,
      title: request.title.trim(),
      startIso: request.startIso,
      endIso: request.endIso ?? null,
      location: request.location?.trim() || null,
      organizerMemberId: request.organizerMemberId ?? null,
      organizerName: memberName(request.organizerMemberId),
      participants: participantsFrom(request.participantMemberIds),
      agenda: request.agenda?.trim() || null,
      notes: request.notes?.trim() || null,
      status: request.status ?? "scheduled",
      processingStatus: "not_processed",
      processingError: null,
      hasTranscript: false,
      decisionCount: 0,
      actionItemCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    meetingsFor(eventId).unshift(meeting);
    return structuredClone(meeting);
  },

  async updateMeeting(eventId, meetingId, request) {
    await wait(LATENCY_MS);
    const list = meetingsFor(eventId);
    const index = list.findIndex((entry) => entry.id === meetingId);
    if (index === -1) throw new ApiError("not-found", "Meeting not found", 404);
    const existing = list[index]!;
    const updated: Meeting = {
      ...existing,
      title: request.title?.trim() ?? existing.title,
      startIso: request.startIso ?? existing.startIso,
      endIso: request.endIso === undefined ? existing.endIso : request.endIso,
      location: request.location === undefined ? existing.location : request.location?.trim() || null,
      organizerMemberId:
        request.organizerMemberId === undefined ? existing.organizerMemberId : request.organizerMemberId,
      organizerName:
        request.organizerMemberId === undefined
          ? existing.organizerName
          : memberName(request.organizerMemberId),
      participants:
        request.participantMemberIds === undefined
          ? existing.participants
          : participantsFrom(request.participantMemberIds),
      agenda: request.agenda === undefined ? existing.agenda : request.agenda?.trim() || null,
      notes: request.notes === undefined ? existing.notes : request.notes?.trim() || null,
      status: request.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    return structuredClone(updated);
  },

  async getMeetingTranscript(eventId, meetingId) {
    await wait(LATENCY_MS);
    findScoped(eventId, meetingId);
    const transcript = TRANSCRIPT_STORE.get(meetingId);
    return transcript ? structuredClone(transcript) : null;
  },

  async saveMeetingTranscript(eventId, meetingId, text) {
    await wait(LATENCY_MS);
    const meeting = findScoped(eventId, meetingId);
    const transcript: MeetingTranscript = {
      meetingId,
      text: text.trim(),
      updatedAt: new Date().toISOString(),
    };
    TRANSCRIPT_STORE.set(meetingId, transcript);
    meeting.hasTranscript = transcript.text.length > 0;
    meeting.updatedAt = transcript.updatedAt;
    return structuredClone(transcript);
  },

  async getMeetingIntelligence(eventId, meetingId) {
    await wait(LATENCY_MS);
    const meeting = findScoped(eventId, meetingId);
    if (meeting.processingStatus !== "completed") return structuredClone(EMPTY_INTELLIGENCE);
    return structuredClone(INTELLIGENCE_STORE.get(meetingId) ?? EMPTY_INTELLIGENCE);
  },

  async processMeeting(eventId, meetingId) {
    await wait(LATENCY_MS);
    const meeting = findScoped(eventId, meetingId);
    if (!meeting.hasTranscript) {
      throw new ApiError("unexpected", "A transcript is required before processing", 409);
    }
    meeting.processingStatus = "processing";
    meeting.processingError = null;
    meeting.updatedAt = new Date().toISOString();

    // Simulated async job: flips to completed with SAMPLE intelligence.
    window.setTimeout(() => {
      const current = meetingsFor(eventId).find((entry) => entry.id === meetingId);
      if (!current || current.processingStatus !== "processing") return;
      const intelligence = INTELLIGENCE_STORE.get(meetingId) ?? sampleIntelligenceFor(current);
      INTELLIGENCE_STORE.set(meetingId, intelligence);
      current.processingStatus = "completed";
      current.decisionCount = intelligence.decisions.length;
      current.actionItemCount = intelligence.actionItems.length;
      current.updatedAt = new Date().toISOString();
    }, SIMULATED_PROCESSING_MS);

    return structuredClone(meeting);
  },

  async createTaskFromActionItem(eventId, meetingId, actionItemId) {
    findScoped(eventId, meetingId);
    const intelligence = INTELLIGENCE_STORE.get(meetingId);
    const actionItem = intelligence?.actionItems.find((entry) => entry.id === actionItemId);
    if (!intelligence || !actionItem) {
      throw new ApiError("not-found", "Action item not found", 404);
    }
    if (actionItem.linkedTaskId) {
      throw new ApiError("unexpected", "Action item already has a task", 409);
    }

    // Reuse the Part 06 task pipeline — the task lives in the task module.
    const task = await taskService.createTask(eventId, {
      title: actionItem.text,
      description: `Created from meeting action item (${meetingId}).`,
      priority: actionItem.priority ?? "medium",
      status: "todo",
      dueIso: actionItem.dueIso,
      assigneeId: actionItem.ownerMemberId,
    });

    actionItem.linkedTaskId = task.id;
    actionItem.linkedTaskStatus = task.status;
    return { actionItem: structuredClone(actionItem), task };
  },

  listMembers(eventId) {
    return taskService.listMembers(eventId);
  },
};

export const meetingService: MeetingService = isMockApi ? mockMeetingService : httpMeetingService;
