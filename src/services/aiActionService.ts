import { isMockApi } from "./apiMode";
import { ApiError, apiRequest, describeApiError } from "./http";
import { announcementService } from "./announcementService";
import { riskService } from "./riskService";
import { taskService } from "./taskService";
import { volunteerService } from "./volunteerService";
import { MOCK_MEMBERS } from "@/data/mockTasks";
import type {
  AiAction,
  AiActionCapabilities,
  AiActionResult,
  AiActionsListResponse,
  AnnouncementAudience,
  AnnouncementCategory,
  AnnouncementPriority,
  RiskStatus,
  TaskPriority,
  TaskStatus,
} from "@/types";

/**
 * AI Action Approval service — the ONLY module that talks to approval endpoints.
 *
 * Proposed contract (no backend exists yet — Part 14 wires it):
 *   GET   /events/:eventId/ai/actions/capabilities          → AiActionCapabilities
 *   GET   /events/:eventId/ai/actions                        → AiActionsListResponse
 *   GET   /events/:eventId/ai/actions/:actionId              → AiAction
 *   POST  /events/:eventId/ai/actions/:actionId/approve      → AiActionResult
 *   POST  /events/:eventId/ai/actions/:actionId/reject       → AiActionResult
 *
 * The frontend approving an action is NOT execution. Every action completes
 * only when the backend returns the post-execution state. Edit-before-approval
 * is gated off via capabilities.
 */
export interface AiActionService {
  getCapabilities(eventId: string): Promise<AiActionCapabilities>;
  listActions(eventId: string): Promise<AiActionsListResponse>;
  getAction(eventId: string, actionId: string): Promise<AiAction>;
  approveAction(eventId: string, actionId: string): Promise<AiActionResult>;
  rejectAction(eventId: string, actionId: string, reason?: string): Promise<AiActionResult>;
}

const httpAiActionService: AiActionService = {
  getCapabilities(eventId) {
    return apiRequest<AiActionCapabilities>(`/events/${eventId}/ai/actions/capabilities`);
  },
  listActions(eventId) {
    return apiRequest<AiActionsListResponse>(`/events/${eventId}/ai/actions`);
  },
  getAction(eventId, actionId) {
    return apiRequest<AiAction>(`/events/${eventId}/ai/actions/${actionId}`);
  },
  approveAction(eventId, actionId) {
    return apiRequest<AiActionResult>(`/events/${eventId}/ai/actions/${actionId}/approve`, {
      method: "POST",
    });
  },
  rejectAction(eventId, actionId, reason) {
    return apiRequest<AiActionResult>(`/events/${eventId}/ai/actions/${actionId}/reject`, {
      method: "POST",
      body: reason ? { reason } : {},
    });
  },
};

/* ------------------------------------------------------------------ */
/* LOCAL_DEVELOPMENT — temporary mock                                  */
/*                                                                     */
/* ⚠️ Execution here is a timer that calls the existing module services  */
/* so approval really changes those mock records. There is no backend;   */
/* approval logic is simulated. Delete when Part 14 wires the service.   */
/* ------------------------------------------------------------------ */

const LATENCY_MS = 280;
const EXECUTION_MS = 1_200;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const STORE = new Map<string, AiAction[]>();

const MOCK_CAPABILITIES: AiActionCapabilities = {
  approve: true,
  reject: true,
  rejectReason: true,
  editBeforeApproval: false,
  history: true,
};

const TASK_PRIORITIES: readonly TaskPriority[] = ["low", "medium", "high", "critical"];
const TASK_STATUSES: readonly TaskStatus[] = ["todo", "in_progress", "blocked", "completed"];
const ANN_CATEGORIES: readonly AnnouncementCategory[] = ["general", "operations", "reminder", "decision"];
const ANN_AUDIENCES: readonly AnnouncementAudience[] = ["event_team", "organizers", "volunteers"];
const ANN_PRIORITIES: readonly AnnouncementPriority[] = ["normal", "important", "urgent"];
const RISK_STATUSES: readonly RiskStatus[] = ["open", "monitoring", "mitigated", "closed"];

function asTaskPriority(value: string | undefined): TaskPriority {
  const lower = (value ?? "").toLowerCase() as TaskPriority;
  return TASK_PRIORITIES.includes(lower) ? lower : "medium";
}

function asTaskStatus(value: string | undefined): TaskStatus {
  const lower = (value ?? "").toLowerCase() as TaskStatus;
  return TASK_STATUSES.includes(lower) ? lower : "todo";
}

function asAnnCategory(value: string | undefined): AnnouncementCategory {
  const lower = (value ?? "").toLowerCase() as AnnouncementCategory;
  return ANN_CATEGORIES.includes(lower) ? lower : "general";
}

function asAnnAudience(value: string | undefined): AnnouncementAudience {
  const lower = (value ?? "").toLowerCase() as AnnouncementAudience;
  return ANN_AUDIENCES.includes(lower) ? lower : "event_team";
}

function asAnnPriority(value: string | undefined): AnnouncementPriority {
  const lower = (value ?? "").toLowerCase() as AnnouncementPriority;
  return ANN_PRIORITIES.includes(lower) ? lower : "normal";
}

function asRiskStatus(value: string | undefined): RiskStatus {
  const lower = (value ?? "").toLowerCase() as RiskStatus;
  return RISK_STATUSES.includes(lower) ? lower : "open";
}

function memberIdFor(name: string | undefined): string | null {
  if (!name) return null;
  return MOCK_MEMBERS.find((member) => member.name === name)?.id ?? null;
}

function proposedMap(action: AiAction): Record<string, string> {
  return Object.fromEntries(action.changes.map((change) => [change.field, change.proposed]));
}

function nowIso(): string {
  return new Date().toISOString();
}

function offsetIso(days: number, hour = 10): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/** Deterministic sample seed — NOT backend AI output. */
function seedActions(eventId: string): AiAction[] {
  if (eventId !== "techfest-2026") return [];

  return [
    {
      id: "act_001",
      eventId,
      type: "create_task",
      title: "Prepare sponsor briefing",
      rationale:
        "The latest sponsor outreach review identified an unresolved tier-deck update before partner packs go out.",
      status: "pending",
      affectedEntity: { kind: "meeting", id: "mtg_002", label: "Sponsor outreach review" },
      changes: [
        { field: "title", label: "Title", current: null, proposed: "Prepare sponsor briefing" },
        { field: "assignee", label: "Assignee", current: null, proposed: "Priya Mehta" },
        { field: "priority", label: "Priority", current: null, proposed: "High" },
        { field: "dueIso", label: "Due date", current: null, proposed: "Due tomorrow" },
      ],
      suggestedBy: "ClubOps AI",
      conversationId: null,
      resultMessage: null,
      rejectionReason: null,
      createdAt: offsetIso(-1),
      updatedAt: offsetIso(-1),
      expiresAt: offsetIso(14),
    },
    {
      id: "act_002",
      eventId,
      type: "update_task",
      title: "Escalate venue contract task to critical",
      rationale:
        "The hire agreement countersign deadline is within 48 hours and remains blocked by faculty approval.",
      status: "pending",
      affectedEntity: { kind: "task", id: "tsk_001", label: "Finalize venue booking" },
      changes: [
        { field: "status", label: "Status", current: "In progress", proposed: "Blocked" },
        { field: "priority", label: "Priority", current: "High", proposed: "Critical" },
      ],
      suggestedBy: "ClubOps AI",
      conversationId: null,
      resultMessage: null,
      rejectionReason: null,
      createdAt: offsetIso(0, 9),
      updatedAt: offsetIso(0, 9),
      expiresAt: offsetIso(7),
    },
    {
      id: "act_003",
      eventId,
      type: "assign_volunteer",
      title: "Reassign Neha Reddy to the registration morning shift",
      rationale:
        "Registration coverage is still five slots short for day one; Neha has availability recorded for that window.",
      status: "pending",
      affectedEntity: { kind: "volunteer", id: "vol_techfest-2026_6", label: "Neha Reddy" },
      changes: [
        { field: "eventRole", label: "Role", current: "Volunteer Lead", proposed: "Registration Lead" },
        { field: "availabilityNote", label: "Note", current: "Unavailable Friday morning", proposed: "Confirmed for opening morning" },
      ],
      suggestedBy: "ClubOps AI",
      conversationId: null,
      resultMessage: null,
      rejectionReason: null,
      createdAt: offsetIso(0, 8),
      updatedAt: offsetIso(0, 8),
      expiresAt: offsetIso(5),
    },
    {
      id: "act_004",
      eventId,
      type: "create_announcement",
      title: "Announce updated day-one check-in plan",
      rationale:
        "The registration reassignment changed the opening shift plan; affected volunteers have not been told yet.",
      status: "pending",
      affectedEntity: { kind: "announcement", id: "ann_001", label: "Day-one registration coverage" },
      changes: [
        { field: "title", label: "Title", current: null, proposed: "Day-one check-in plan updated" },
        { field: "audience", label: "Audience", current: null, proposed: "Volunteers" },
        { field: "priority", label: "Priority", current: null, proposed: "Important" },
      ],
      suggestedBy: "ClubOps AI",
      conversationId: null,
      resultMessage: null,
      rejectionReason: null,
      createdAt: offsetIso(0, 8),
      updatedAt: offsetIso(0, 8),
      expiresAt: offsetIso(4),
    },
    {
      id: "act_005",
      eventId,
      type: "update_risk",
      title: "Mark venue risk as mitigated",
      rationale: "The hire agreement was countersigned yesterday; the AV surcharge is waived.",
      status: "pending",
      affectedEntity: { kind: "risk", id: "rsk_001", label: "Venue contract may miss the countersign deadline" },
      changes: [{ field: "status", label: "Status", current: "Open", proposed: "Mitigated" }],
      suggestedBy: "ClubOps AI",
      conversationId: null,
      resultMessage: null,
      rejectionReason: null,
      createdAt: offsetIso(0, 7),
      updatedAt: offsetIso(0, 7),
      expiresAt: offsetIso(6),
    },
    {
      id: "act_006",
      eventId,
      type: "assign_task",
      title: "Assign sponsor outreach to Priya Mehta",
      rationale: "Priya owns partnerships and is the natural owner for the updated proposal pack.",
      status: "pending",
      affectedEntity: { kind: "task", id: "tsk_002", label: "Prepare sponsorship proposal" },
      changes: [{ field: "assignee", label: "Assignee", current: "Unassigned", proposed: "Priya Mehta" }],
      suggestedBy: "ClubOps AI",
      conversationId: null,
      resultMessage: null,
      rejectionReason: null,
      createdAt: offsetIso(-2),
      updatedAt: offsetIso(-2),
      expiresAt: offsetIso(1),
    },
    {
      id: "act_007",
      eventId,
      type: "create_task",
      title: "Completed sample — log venue permits",
      rationale: "Settled record for the history section.",
      status: "completed",
      affectedEntity: { kind: "task", id: "tsk_105", label: "Log venue permits" },
      changes: [{ field: "title", label: "Title", current: null, proposed: "Log venue permits" }],
      suggestedBy: "ClubOps AI",
      conversationId: null,
      resultMessage: "Created task “Log venue permits”.",
      rejectionReason: null,
      createdAt: offsetIso(-5),
      updatedAt: offsetIso(-4),
      expiresAt: null,
    },
    {
      id: "act_008",
      eventId,
      type: "update_task",
      title: "Rejected sample — move registration roster",
      rationale: "Rejected record for the history section.",
      status: "rejected",
      affectedEntity: null,
      changes: [{ field: "assignee", label: "Assignee", current: "Aarav", proposed: "Rahul" }],
      suggestedBy: "ClubOps AI",
      conversationId: null,
      resultMessage: null,
      rejectionReason: "Roster already handled manually.",
      createdAt: offsetIso(-6),
      updatedAt: offsetIso(-5),
      expiresAt: null,
    },
    {
      id: "act_009",
      eventId,
      type: "assign_volunteer",
      title: "Expired sample — swap expo floater for day two",
      rationale: "Expired record for the list.",
      status: "expired",
      affectedEntity: { kind: "volunteer", id: "vol_techfest-2026_4", label: "Sana Khan" },
      changes: [{ field: "eventRole", label: "Role", current: "Expo", proposed: "Floater" }],
      suggestedBy: "ClubOps AI",
      conversationId: null,
      resultMessage: null,
      rejectionReason: null,
      createdAt: offsetIso(-8),
      updatedAt: offsetIso(-6),
      expiresAt: offsetIso(-4),
    },
  ];
}

function actionsFor(eventId: string): AiAction[] {
  let list = STORE.get(eventId);
  if (!list) {
    list = seedActions(eventId);
    STORE.set(eventId, list);
  }
  return list;
}

/** Enforces event scoping: an action id from another event is a 404. */
function findScoped(eventId: string, actionId: string): AiAction {
  const action = actionsFor(eventId).find((entry) => entry.id === actionId);
  if (!action) throw new ApiError("not-found", "Action not found", 404);
  return action;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

/**
 * Simulated execution — the mock calls the real module services so approval
 * actually changes task/risk/volunteer/announcement mock records, then
 * returns authoritative post-execution state.
 */
async function executeInModuleServices(eventId: string, action: AiAction): Promise<AiAction> {
  const proposed = proposedMap(action);
  const updated = { ...action };

  switch (action.type) {
    case "create_task": {
      const task = await taskService.createTask(eventId, {
        title: proposed.title ?? action.title,
        description: `Suggested by ClubOps AI: ${action.rationale}`,
        priority: asTaskPriority(proposed.priority),
        status: asTaskStatus(proposed.status),
        dueIso: null,
        assigneeId: memberIdFor(proposed.assignee),
      });
      updated.affectedEntity = { kind: "task", id: task.id, label: task.title };
      updated.resultMessage = `Created task “${task.title}”.`;
      return updated;
    }
    case "update_task":
    case "assign_task": {
      const taskId = action.affectedEntity?.id ?? "";
      const task = await taskService.updateTask(eventId, taskId, {
        status: action.type === "update_task" ? asTaskStatus(proposed.status) : undefined,
        priority: action.type === "update_task" ? asTaskPriority(proposed.priority) : undefined,
        assigneeId: proposed.assignee ? memberIdFor(proposed.assignee) : null,
      });
      updated.affectedEntity = { kind: "task", id: task.id, label: task.title };
      updated.resultMessage = `Updated task “${task.title}”.`;
      return updated;
    }
    case "update_risk": {
      const riskId = action.affectedEntity?.id ?? "";
      const risk = await riskService.transitionRisk(eventId, riskId, asRiskStatus(proposed.status));
      updated.affectedEntity = { kind: "risk", id: risk.id, label: risk.title };
      updated.resultMessage = `Risk status is now ${risk.status}.`;
      return updated;
    }
    case "create_announcement": {
      const record = await announcementService.createAnnouncement(eventId, {
        title: proposed.title ?? action.title,
        body: action.rationale,
        priority: asAnnPriority(proposed.priority),
        category: asAnnCategory(proposed.category),
        audience: asAnnAudience(proposed.audience),
        publish: false,
      });
      updated.affectedEntity = { kind: "announcement", id: record.id, label: record.title };
      updated.resultMessage = `Saved announcement draft “${record.title}”.`;
      return updated;
    }
    case "assign_volunteer": {
      const volunteerId = action.affectedEntity?.id ?? "";
      const volunteer = await volunteerService.updateVolunteer(eventId, volunteerId, {
        eventRole: proposed.eventRole,
        availabilityNote: proposed.availabilityNote,
      });
      updated.affectedEntity = { kind: "volunteer", id: volunteer.id, label: volunteer.name };
      updated.resultMessage = `Updated volunteer “${volunteer.name}”.`;
      return updated;
    }
    default:
      throw new ApiError("unexpected", `Unsupported action type ${action.type}`, 500);
  }
}

const mockAiActionService: AiActionService = {
  async getCapabilities() {
    await wait(120);
    return { ...MOCK_CAPABILITIES };
  },
  async listActions(eventId) {
    await wait(LATENCY_MS);
    const actions = actionsFor(eventId);
    return { actions: clone(actions), totalCount: actions.length };
  },
  async getAction(eventId, actionId) {
    await wait(LATENCY_MS);
    return clone(findScoped(eventId, actionId));
  },
  async approveAction(eventId, actionId) {
    await wait(LATENCY_MS);
    const action = findScoped(eventId, actionId);
    if (action.status !== "pending") {
      throw new ApiError("conflict", "This action is no longer pending", 409);
    }

    // Mark executing so the UI can show progress and block double-submit.
    action.status = "executing";
    action.updatedAt = nowIso();

    await wait(EXECUTION_MS);
    try {
      const completed = { ...action, status: "completed" as const, updatedAt: nowIso() };
      const executed = await executeInModuleServices(eventId, completed);
      // Persist the backend-like post-execution result in the action store.
      // Returning completed without this assignment previously left the list
      // stuck at "executing" after navigation.
      Object.assign(action, executed, { status: "completed", updatedAt: nowIso() });
      return { action: clone(action) };
    } catch (cause: unknown) {
      // The mock models an authoritative failed execution instead of claiming
      // success or leaving an action stuck in the executing state.
      action.status = "failed";
      action.resultMessage = describeApiError(cause, "The server could not complete this action.");
      action.updatedAt = nowIso();
      return { action: clone(action) };
    }
  },
  async rejectAction(eventId, actionId, reason) {
    await wait(LATENCY_MS);
    const action = findScoped(eventId, actionId);
    if (action.status !== "pending") {
      throw new ApiError("conflict", "This action is no longer pending", 409);
    }
    action.status = "rejected";
    action.rejectionReason = reason?.trim() || null;
    action.updatedAt = nowIso();
    return { action: clone(action) };
  },
};

export const aiActionService: AiActionService = isMockApi
  ? mockAiActionService
  : httpAiActionService;
