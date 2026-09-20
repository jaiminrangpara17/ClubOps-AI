import { isMockApi } from "./apiMode";
import { announcementService } from "./announcementService";
import { ApiError, apiRequest } from "./http";
import { meetingService } from "./meetingService";
import { riskService } from "./riskService";
import { taskService } from "./taskService";
import { volunteerService } from "./volunteerService";
import { deriveVolunteerWorkload } from "@/lib/volunteer";
import { formatDueLabel } from "@/lib/format";
import { isTaskOverdue } from "@/lib/taskDateUtils";
import type {
  CopilotCapabilities,
  CopilotConversation,
  CopilotMessage,
  CopilotSendRequest,
  CopilotSendResponse,
  CopilotSource,
  CopilotSuggestedAction,
} from "@/types";

/**
 * AI Copilot service — the ONLY module that talks to the copilot endpoints.
 *
 * Proposed contract (no backend AI service exists yet — Part 14 wires it):
 *   GET    /events/:eventId/ai/capabilities                 → CopilotCapabilities
 *   POST   /events/:eventId/ai/conversations                → CopilotConversation
 *   GET    /events/:eventId/ai/conversations/:id            → CopilotConversation
 *   DELETE /events/:eventId/ai/conversations/:id            → 204
 *   POST   /events/:eventId/ai/conversations/:id/messages   → CopilotSendResponse
 *
 * The event id is always part of the path so the backend answers strictly
 * from the current event. Streaming and feedback endpoints are intentionally
 * absent — they are not part of any agreed contract and their capability
 * flags stay false so the UI never offers them.
 *
 * Nothing in this service executes a consequential action. Suggested actions
 * are navigation hints only; Part 13 owns approval/execution.
 */
export interface AiService {
  getCapabilities(eventId: string): Promise<CopilotCapabilities>;
  createConversation(eventId: string): Promise<CopilotConversation>;
  getConversation(eventId: string, conversationId: string): Promise<CopilotConversation>;
  clearConversation(eventId: string, conversationId: string): Promise<void>;
  sendMessage(request: CopilotSendRequest): Promise<CopilotSendResponse>;
}

const httpAiService: AiService = {
  getCapabilities(eventId) {
    return apiRequest<CopilotCapabilities>(`/events/${eventId}/ai/capabilities`);
  },
  createConversation(eventId) {
    return apiRequest<CopilotConversation>(`/events/${eventId}/ai/conversations`, {
      method: "POST",
    });
  },
  getConversation(eventId, conversationId) {
    return apiRequest<CopilotConversation>(
      `/events/${eventId}/ai/conversations/${conversationId}`,
    );
  },
  async clearConversation(eventId, conversationId) {
    await apiRequest<void>(`/events/${eventId}/ai/conversations/${conversationId}`, {
      method: "DELETE",
    });
  },
  sendMessage({ eventId, conversationId, message }) {
    return apiRequest<CopilotSendResponse>(
      `/events/${eventId}/ai/conversations/${conversationId}/messages`,
      { method: "POST", body: { message } },
    );
  },
};

/* ------------------------------------------------------------------ */
/* LOCAL_DEVELOPMENT — temporary mock                                  */
/*                                                                     */
/* ⚠️ THIS IS NOT AN AI MODEL. It is a deterministic retrieval stub:    */
/* it matches a few keywords, reads real records from the existing     */
/* module services for the current event, and formats them as text.    */
/* Every reply states this. No language model, embeddings, RAG or       */
/* generation is involved. Delete when Part 14 wires the backend.       */
/* ------------------------------------------------------------------ */

const LATENCY_MS = 650;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const CONVERSATIONS = new Map<string, CopilotConversation>();

const MOCK_CAPABILITIES: CopilotCapabilities = {
  chat: true,
  streaming: false,
  persistence: false,
  sources: true,
  suggestedActions: true,
  feedback: false,
};

const STUB_NOTE = "_Development stub: this reply lists records from your event data. No AI model was used._";

const nowIso = () => new Date().toISOString();
const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

function assistant(
  content: string,
  sources: CopilotSource[] = [],
  suggestedActions: CopilotSuggestedAction[] = [],
): CopilotMessage {
  return {
    id: newId("msg"),
    role: "assistant",
    content: `${content}\n\n${STUB_NOTE}`,
    createdAt: nowIso(),
    sources,
    suggestedActions,
    isEmpty: false,
    error: null,
  };
}

function scopedConversation(eventId: string, conversationId: string): CopilotConversation {
  const conversation = CONVERSATIONS.get(conversationId);
  if (!conversation || conversation.eventId !== eventId) {
    throw new ApiError("not-found", "Conversation not found", 404);
  }
  return conversation;
}

async function answerFromEventData(eventId: string, question: string): Promise<CopilotMessage> {
  const q = question.toLowerCase();

  if (/(overdue|late|behind)/.test(q) || (/task/.test(q) && /attention|today/.test(q))) {
    const { tasks } = await taskService.listTasks(eventId);
    const overdue = tasks.filter((task) => isTaskOverdue(task));
    if (overdue.length === 0) {
      return assistant("**No tasks are overdue** for this event right now.", [], [
        { id: "a1", label: "Open tasks", description: null, moduleId: "tasks", entityId: null },
      ]);
    }
    const lines = overdue.map(
      (task) => `- **${task.title}** — ${task.assigneeName ?? "unassigned"}, ${formatDueLabel(task.dueIso ?? "")}`,
    );
    return assistant(
      `**${overdue.length} task${overdue.length === 1 ? " is" : "s are"} overdue:**\n\n${lines.join("\n")}`,
      overdue.map((task) => ({ kind: "task", id: task.id, label: task.title })),
      [{ id: "a1", label: "View overdue tasks", description: "Open the task workspace filtered to overdue work.", moduleId: "tasks", entityId: null }],
    );
  }

  if (/risk/.test(q)) {
    const { risks } = await riskService.listRisks(eventId);
    const open = risks.filter((risk) => risk.status === "open" || risk.status === "monitoring");
    if (open.length === 0) return assistant("**No open risks** are recorded for this event.");
    const lines = open.map(
      (risk) => `- **${risk.title}** — ${risk.severity} severity, ${risk.status}${risk.ownerName ? `, owned by ${risk.ownerName}` : ""}`,
    );
    return assistant(
      `**${open.length} open risk${open.length === 1 ? "" : "s"}:**\n\n${lines.join("\n")}`,
      open.map((risk) => ({ kind: "risk", id: risk.id, label: risk.title })),
      open
        .filter((risk) => risk.severity === "critical" || risk.severity === "high")
        .slice(0, 2)
        .map((risk) => ({ id: `r_${risk.id}`, label: `Review: ${risk.title}`, description: "Open the risk record and mitigation plan.", moduleId: "risks", entityId: risk.id })),
    );
  }

  if (/volunteer|overloaded|capacity|workload/.test(q)) {
    const [{ volunteers }, { tasks }] = await Promise.all([
      volunteerService.listVolunteers(eventId),
      taskService.listTasks(eventId),
    ]);
    const loaded = volunteers
      .map((volunteer) => ({
        volunteer,
        workload: volunteer.workload ?? deriveVolunteerWorkload(tasks.filter((task) => task.assigneeId === volunteer.memberId)),
      }))
      .filter(({ workload }) => workload.level === "high" || workload.level === "overloaded");
    if (loaded.length === 0) {
      return assistant(`**No volunteers are at high or overloaded workload.** ${volunteers.length} volunteers are on this event.`);
    }
    const lines = loaded.map(({ volunteer, workload }) => `- **${volunteer.name}** — ${workload.level}, ${workload.pending} pending task${workload.pending === 1 ? "" : "s"}`);
    return assistant(
      `**${loaded.length} volunteer${loaded.length === 1 ? " is" : "s are"} at or near capacity:**\n\n${lines.join("\n")}`,
      loaded.map(({ volunteer }) => ({ kind: "volunteer", id: volunteer.id, label: volunteer.name })),
      [{ id: "a1", label: "Review volunteers", description: "Open the roster to rebalance manually.", moduleId: "volunteers", entityId: null }],
    );
  }

  if (/meeting|decision|action item/.test(q)) {
    const { meetings } = await meetingService.listMeetings(eventId);
    const latest = [...meetings]
      .filter((meeting) => meeting.status === "held")
      .sort((a, b) => Date.parse(b.startIso) - Date.parse(a.startIso))[0];
    if (!latest) return assistant("**No held meetings** are recorded for this event yet.");
    if (latest.processingStatus !== "completed") {
      return assistant(
        `The latest meeting, **${latest.title}**, has not finished processing (status: ${latest.processingStatus}), so no decisions or action items are available yet.`,
        [{ kind: "meeting", id: latest.id, label: latest.title }],
      );
    }
    const intelligence = await meetingService.getMeetingIntelligence(eventId, latest.id);
    const decisions = intelligence.decisions.map((decision) => `- ${decision.text}`);
    const actions = intelligence.actionItems.map((item) => `- ${item.text}${item.ownerName ? ` (${item.ownerName})` : ""}`);
    return assistant(
      `**${latest.title}**\n\n**Decisions**\n${decisions.length ? decisions.join("\n") : "- None recorded"}\n\n**Action items**\n${actions.length ? actions.join("\n") : "- None recorded"}`,
      [{ kind: "meeting", id: latest.id, label: latest.title }],
      [{ id: "a1", label: "Open meeting", description: "Review the transcript and create tasks from action items.", moduleId: "meetings", entityId: latest.id }],
    );
  }

  if (/announcement|announced|update/.test(q)) {
    const { announcements } = await announcementService.listAnnouncements(eventId);
    const published = announcements
      .filter((item) => item.status === "published")
      .sort((a, b) => Date.parse(b.publishedAt ?? "") - Date.parse(a.publishedAt ?? ""))
      .slice(0, 3);
    if (published.length === 0) return assistant("**No announcements have been published** for this event.");
    const lines = published.map((item) => `- **${item.title}** — ${item.priority}, ${item.authorName ?? "unknown author"}`);
    return assistant(
      `**Latest published announcements:**\n\n${lines.join("\n")}`,
      published.map((item) => ({ kind: "announcement", id: item.id, label: item.title })),
      [{ id: "a1", label: "Open announcements", description: null, moduleId: "announcements", entityId: null }],
    );
  }

  if (/deadline|due|upcoming|week/.test(q)) {
    const { tasks } = await taskService.listTasks(eventId);
    const upcoming = tasks
      .filter((task) => task.dueIso && task.status !== "completed" && !isTaskOverdue(task))
      .sort((a, b) => Date.parse(a.dueIso!) - Date.parse(b.dueIso!))
      .slice(0, 5);
    if (upcoming.length === 0) return assistant("**No upcoming deadlines** are recorded on open tasks.");
    const lines = upcoming.map((task) => `- **${task.title}** — ${formatDueLabel(task.dueIso!)}${task.assigneeName ? `, ${task.assigneeName}` : ""}`);
    return assistant(
      `**Next ${upcoming.length} deadline${upcoming.length === 1 ? "" : "s"}:**\n\n${lines.join("\n")}`,
      upcoming.map((task) => ({ kind: "task", id: task.id, label: task.title })),
      [{ id: "a1", label: "View tasks", description: null, moduleId: "tasks", entityId: null }],
    );
  }

  return assistant(
    "I can only answer from this event's recorded data in this development build. Try asking about **overdue tasks**, **risks**, **volunteer workload**, **the latest meeting**, **announcements** or **upcoming deadlines**.",
  );
}

const mockAiService: AiService = {
  async getCapabilities() {
    await wait(120);
    return { ...MOCK_CAPABILITIES };
  },
  async createConversation(eventId) {
    await wait(120);
    const conversation: CopilotConversation = {
      id: newId("conv"),
      eventId,
      messages: [],
      createdAt: nowIso(),
    };
    CONVERSATIONS.set(conversation.id, conversation);
    return structuredClone(conversation);
  },
  async getConversation(eventId, conversationId) {
    await wait(120);
    return structuredClone(scopedConversation(eventId, conversationId));
  },
  async clearConversation(eventId, conversationId) {
    await wait(120);
    scopedConversation(eventId, conversationId);
    CONVERSATIONS.delete(conversationId);
  },
  async sendMessage({ eventId, conversationId, message }) {
    const conversation = scopedConversation(eventId, conversationId);
    const trimmed = message.trim();
    if (!trimmed) throw new ApiError("validation", "Message is empty", 400);
    if (trimmed.length > 2000) throw new ApiError("validation", "Message too long", 400);

    conversation.messages.push({
      id: newId("msg"),
      role: "user",
      content: trimmed,
      createdAt: nowIso(),
      sources: [],
      suggestedActions: [],
      isEmpty: false,
      error: null,
    });

    await wait(LATENCY_MS);
    const reply = await answerFromEventData(eventId, trimmed);
    conversation.messages.push(reply);
    return { message: structuredClone(reply) };
  },
};

export const aiService: AiService = isMockApi ? mockAiService : httpAiService;
