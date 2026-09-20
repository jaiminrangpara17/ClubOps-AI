import { isMockApi } from "./apiMode";
import { ApiError, apiRequest } from "./http";
import { getInitialRisks } from "@/data/mockRisks";
import { taskService } from "./taskService";
import type {
  CreateRiskRequest,
  EventMember,
  Risk,
  RiskCapabilities,
  RiskMitigation,
  RisksListResponse,
  RiskStatus,
  Task,
  UpdateRiskRequest,
} from "@/types";

/**
 * Risk service — all API operations remain centralized here.
 *
 * Proposed contract (no backend risk implementation exists yet):
 *   GET   /events/:eventId/risks/capabilities              → RiskCapabilities
 *   GET   /events/:eventId/risks                           → RisksListResponse
 *   POST  /events/:eventId/risks                           → Risk
 *   GET   /events/:eventId/risks/:riskId                   → Risk
 *   PATCH /events/:eventId/risks/:riskId                   → Risk
 *   POST  /events/:eventId/risks/:riskId/transition         → Risk
 *   POST  /events/:eventId/risks/:riskId/mitigation-task    → { risk, task }
 *
 * No delete method is present because no deletion contract is defined.
 * Source, score, relations and transition rules are backend-supplied only.
 */
export interface RiskService {
  getCapabilities(eventId: string): Promise<RiskCapabilities>;
  listRisks(eventId: string): Promise<RisksListResponse>;
  getRisk(eventId: string, riskId: string): Promise<Risk>;
  createRisk(eventId: string, request: CreateRiskRequest): Promise<Risk>;
  updateRisk(eventId: string, riskId: string, request: UpdateRiskRequest): Promise<Risk>;
  transitionRisk(eventId: string, riskId: string, status: RiskStatus): Promise<Risk>;
  createMitigationTask(eventId: string, riskId: string): Promise<{ risk: Risk; task: Task }>;
  listMembers(eventId: string): Promise<EventMember[]>;
}

const httpRiskService: RiskService = {
  getCapabilities(eventId) {
    return apiRequest<RiskCapabilities>(`/events/${eventId}/risks/capabilities`);
  },
  listRisks(eventId) {
    return apiRequest<RisksListResponse>(`/events/${eventId}/risks`);
  },
  getRisk(eventId, riskId) {
    return apiRequest<Risk>(`/events/${eventId}/risks/${riskId}`);
  },
  createRisk(eventId, request) {
    return apiRequest<Risk>(`/events/${eventId}/risks`, { method: "POST", body: request });
  },
  updateRisk(eventId, riskId, request) {
    return apiRequest<Risk>(`/events/${eventId}/risks/${riskId}`, {
      method: "PATCH",
      body: request,
    });
  },
  transitionRisk(eventId, riskId, status) {
    return apiRequest<Risk>(`/events/${eventId}/risks/${riskId}/transition`, {
      method: "POST",
      body: { status },
    });
  },
  createMitigationTask(eventId, riskId) {
    return apiRequest<{ risk: Risk; task: Task }>(
      `/events/${eventId}/risks/${riskId}/mitigation-task`,
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
/* ⚠️ No risk API or AI detector exists. All seed records have explicit */
/* human/task/meeting/document sources. No mock risk is AI-detected.   */
/* Delete when the backend ships.                                      */
/* ------------------------------------------------------------------ */

const LATENCY_MS = 300;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const STORE = new Map<string, Risk[]>();

const MOCK_CAPABILITIES: RiskCapabilities = {
  manualCreation: true,
  delete: false,
  transitions: true,
  createMitigationTask: true,
  likelihood: true,
  impact: true,
  mitigation: true,
  linkedTask: true,
  linkedMeeting: true,
  linkedDocument: true,
  linkedVolunteer: true,
};

function risksFor(eventId: string): Risk[] {
  let risks = STORE.get(eventId);
  if (!risks) {
    risks = getInitialRisks(eventId);
    STORE.set(eventId, risks);
  }
  return risks;
}

function findScoped(eventId: string, riskId: string): Risk {
  const risk = risksFor(eventId).find((entry) => entry.id === riskId);
  if (!risk) throw new ApiError("not-found", "Risk not found", 404);
  return risk;
}

async function resolveMember(eventId: string, memberId: string | null | undefined): Promise<string | null> {
  if (!memberId) return null;
  const members = await taskService.listMembers(eventId);
  return members.find((member) => member.id === memberId)?.name ?? null;
}

function mitigationFrom(request: CreateRiskRequest, ownerName: string | null): RiskMitigation | null {
  const hasMitigation = Boolean(
    request.mitigationStrategy || request.mitigationOwnerMemberId || request.mitigationDueIso,
  );
  if (!hasMitigation) return null;
  return {
    strategy: request.mitigationStrategy ?? null,
    ownerMemberId: request.mitigationOwnerMemberId ?? null,
    ownerName,
    dueIso: request.mitigationDueIso ?? null,
    status: null,
    taskId: request.linkedTaskId ?? null,
    taskTitle: null,
    taskStatus: null,
    taskPriority: null,
    taskDueIso: null,
  };
}

const mockRiskService: RiskService = {
  async getCapabilities() {
    await wait(120);
    return { ...MOCK_CAPABILITIES };
  },
  async listRisks(eventId) {
    await wait(LATENCY_MS);
    const risks = risksFor(eventId);
    return { risks: structuredClone(risks), totalCount: risks.length };
  },
  async getRisk(eventId, riskId) {
    await wait(LATENCY_MS);
    return structuredClone(findScoped(eventId, riskId));
  },
  async createRisk(eventId, request) {
    await wait(LATENCY_MS);
    const timestamp = new Date().toISOString();
    const ownerName = await resolveMember(eventId, request.ownerMemberId);
    const mitigationOwnerName = await resolveMember(eventId, request.mitigationOwnerMemberId);
    const risk: Risk = {
      id: `rsk_${Date.now().toString(36)}`,
      eventId,
      title: request.title.trim(),
      description: request.description?.trim() || null,
      status: "open",
      severity: request.severity,
      likelihood: request.likelihood ?? null,
      impact: request.impact ?? null,
      score: null,
      ownerMemberId: request.ownerMemberId ?? null,
      ownerName,
      mitigation: mitigationFrom(request, mitigationOwnerName),
      source: "manual",
      sourceLabel: null,
      references: {
        taskId: request.linkedTaskId ?? null,
        meetingId: null,
        meetingTitle: null,
        documentId: null,
        documentName: null,
        volunteerId: null,
        volunteerName: null,
      },
      allowedTransitions: ["monitoring", "mitigated", "closed"],
      identifiedAt: timestamp,
      updatedAt: timestamp,
    };
    risksFor(eventId).unshift(risk);
    return structuredClone(risk);
  },
  async updateRisk(eventId, riskId, request) {
    await wait(LATENCY_MS);
    const risks = risksFor(eventId);
    const index = risks.findIndex((entry) => entry.id === riskId);
    if (index === -1) throw new ApiError("not-found", "Risk not found", 404);
    const existing = risks[index]!;
    const ownerMemberId = request.ownerMemberId === undefined ? existing.ownerMemberId : request.ownerMemberId;
    const ownerName = await resolveMember(eventId, ownerMemberId);
    const mitigationOwnerMemberId = request.mitigationOwnerMemberId === undefined
      ? existing.mitigation?.ownerMemberId ?? null
      : request.mitigationOwnerMemberId;
    const mitigationOwnerName = await resolveMember(eventId, mitigationOwnerMemberId);

    const mitigationRequested =
      request.mitigationStrategy !== undefined ||
      request.mitigationOwnerMemberId !== undefined ||
      request.mitigationDueIso !== undefined ||
      request.linkedTaskId !== undefined;
    const mitigation = mitigationRequested
      ? {
          strategy: request.mitigationStrategy === undefined ? existing.mitigation?.strategy ?? null : request.mitigationStrategy,
          ownerMemberId: mitigationOwnerMemberId,
          ownerName: mitigationOwnerName,
          dueIso: request.mitigationDueIso === undefined ? existing.mitigation?.dueIso ?? null : request.mitigationDueIso,
          status: existing.mitigation?.status ?? null,
          taskId: request.linkedTaskId === undefined ? existing.mitigation?.taskId ?? null : request.linkedTaskId,
          taskTitle: existing.mitigation?.taskTitle ?? null,
          taskStatus: existing.mitigation?.taskStatus ?? null,
          taskPriority: existing.mitigation?.taskPriority ?? null,
          taskDueIso: existing.mitigation?.taskDueIso ?? null,
        }
      : existing.mitigation;

    const updated: Risk = {
      ...existing,
      title: request.title?.trim() ?? existing.title,
      description: request.description === undefined ? existing.description : request.description?.trim() || null,
      severity: request.severity ?? existing.severity,
      likelihood: request.likelihood === undefined ? existing.likelihood : request.likelihood,
      impact: request.impact === undefined ? existing.impact : request.impact,
      ownerMemberId,
      ownerName,
      mitigation,
      references: {
        ...existing.references,
        taskId: request.linkedTaskId === undefined ? existing.references.taskId : request.linkedTaskId,
      },
      updatedAt: new Date().toISOString(),
    };
    risks[index] = updated;
    return structuredClone(updated);
  },
  async transitionRisk(eventId, riskId, status) {
    await wait(LATENCY_MS);
    const risk = findScoped(eventId, riskId);
    if (!risk.allowedTransitions.includes(status)) {
      throw new ApiError("conflict", "Transition not allowed", 409);
    }
    risk.status = status;
    risk.updatedAt = new Date().toISOString();
    return structuredClone(risk);
  },
  async createMitigationTask(eventId, riskId) {
    await wait(LATENCY_MS);
    const risk = findScoped(eventId, riskId);
    if (risk.mitigation?.taskId) {
      throw new ApiError("conflict", "Mitigation task already exists", 409);
    }
    const mitigation = risk.mitigation;
    const task = await taskService.createTask(eventId, {
      title: mitigation?.strategy || `Mitigate risk: ${risk.title}`,
      description: `Created from risk ${risk.id}.`,
      priority: risk.severity === "critical" ? "critical" : risk.severity === "high" ? "high" : "medium",
      status: "todo",
      dueIso: mitigation?.dueIso ?? null,
      assigneeId: mitigation?.ownerMemberId ?? risk.ownerMemberId,
    });
    risk.mitigation = {
      strategy: mitigation?.strategy ?? null,
      ownerMemberId: mitigation?.ownerMemberId ?? risk.ownerMemberId,
      ownerName: mitigation?.ownerName ?? risk.ownerName,
      dueIso: mitigation?.dueIso ?? null,
      status: "Created",
      taskId: task.id,
      taskTitle: task.title,
      taskStatus: task.status,
      taskPriority: task.priority,
      taskDueIso: task.dueIso,
    };
    risk.references.taskId = task.id;
    risk.updatedAt = new Date().toISOString();
    return { risk: structuredClone(risk), task };
  },
  listMembers(eventId) {
    return taskService.listMembers(eventId);
  },
};

export const riskService: RiskService = isMockApi ? mockRiskService : httpRiskService;