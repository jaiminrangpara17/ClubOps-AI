/**
 * Risk domain types — the single source of truth for event risk management.
 *
 * No backend risk contract exists yet. These types document the adapter
 * contract and keep all backend-derived scoring/transition rules explicit.
 */

import type { TaskPriority, TaskStatus } from "./task";

export type RiskStatus = "open" | "monitoring" | "mitigated" | "closed";
export type RiskSeverity = "low" | "medium" | "high" | "critical";
export type RiskLikelihood = "low" | "medium" | "high";
export type RiskImpact = "low" | "medium" | "high";
export type RiskSource = "manual" | "task" | "meeting" | "document" | "ai_detected";

export interface RiskMitigation {
  strategy: string | null;
  ownerMemberId: string | null;
  ownerName: string | null;
  dueIso: string | null;
  status: string | null;
  /** Backend-linked mitigation task — not inferred by the frontend. */
  taskId: string | null;
  taskTitle: string | null;
  taskStatus: TaskStatus | null;
  taskPriority: TaskPriority | null;
  taskDueIso: string | null;
}

export interface RiskReferences {
  taskId: string | null;
  meetingId: string | null;
  meetingTitle: string | null;
  documentId: string | null;
  documentName: string | null;
  volunteerId: string | null;
  volunteerName: string | null;
}

export interface Risk {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  status: RiskStatus;
  severity: RiskSeverity;
  /** Backend-provided likelihood; null when unsupported. */
  likelihood: RiskLikelihood | null;
  /** Backend-provided impact; null when unsupported. */
  impact: RiskImpact | null;
  /** Backend score if defined — never calculated in the frontend. */
  score: number | null;
  ownerMemberId: string | null;
  ownerName: string | null;
  mitigation: RiskMitigation | null;
  source: RiskSource;
  sourceLabel: string | null;
  references: RiskReferences;
  /** Explicit allowed transitions supplied by the backend. */
  allowedTransitions: RiskStatus[];
  identifiedAt: string;
  updatedAt: string;
}

export interface CreateRiskRequest {
  title: string;
  description?: string | null;
  severity: RiskSeverity;
  likelihood?: RiskLikelihood | null;
  impact?: RiskImpact | null;
  ownerMemberId?: string | null;
  mitigationStrategy?: string | null;
  mitigationOwnerMemberId?: string | null;
  mitigationDueIso?: string | null;
  linkedTaskId?: string | null;
}

export type UpdateRiskRequest = Partial<CreateRiskRequest>;

export interface RisksListResponse {
  risks: Risk[];
  totalCount: number;
}

export interface RiskCapabilities {
  manualCreation: boolean;
  delete: boolean;
  transitions: boolean;
  createMitigationTask: boolean;
  likelihood: boolean;
  impact: boolean;
  mitigation: boolean;
  linkedTask: boolean;
  linkedMeeting: boolean;
  linkedDocument: boolean;
  linkedVolunteer: boolean;
}

export interface RiskFilters {
  search: string;
  status: RiskStatus | "all";
  severity: RiskSeverity | "all";
  likelihood: RiskLikelihood | "all";
  ownerMemberId: string | "all";
  source: RiskSource | "all";
}

export interface RiskStats {
  total: number;
  critical: number;
  high: number;
  open: number;
  mitigated: number;
}