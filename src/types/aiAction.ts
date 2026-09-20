/**
 * AI Action Approval types.
 *
 * No backend approval contract exists yet. These types document the adapter
 * contract Part 14 wires to the real service. Approved actions never execute
 * in the frontend — approval always waits on a backend result.
 */

import type { CopilotEntityKind } from "./ai";

/** Consequential action kinds the backend may propose. */
export type AiActionType =
  | "create_task"
  | "update_task"
  | "assign_task"
  | "update_risk"
  | "create_announcement"
  | "assign_volunteer";

export type AiActionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "executing"
  | "completed"
  | "failed"
  | "expired";

/** One field the backend wants to change, with authoritative before/after values. */
export interface AiActionChange {
  field: string;
  label: string;
  current: string | null;
  proposed: string;
}

/** A single AI-suggested action awaiting review. */
export interface AiAction {
  id: string;
  eventId: string;
  type: AiActionType;
  title: string;
  /** Why the AI proposed it — plain text, never executable. */
  rationale: string;
  status: AiActionStatus;
  affectedEntity: { kind: CopilotEntityKind; id: string; label: string } | null;
  changes: AiActionChange[];
  suggestedBy: string;
  /** Conversation the action originated from, when the backend supplies it. */
  conversationId: string | null;
  /** Server-side result text after execution completes or fails. */
  resultMessage: string | null;
  /** Refusal reason recorded on rejection, when supported. */
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface AiActionsListResponse {
  actions: AiAction[];
  totalCount: number;
}

/** Returned by approve — the authoritative post-execution state. */
export interface AiActionResult {
  action: AiAction;
}

export interface AiActionCapabilities {
  approve: boolean;
  reject: boolean;
  /** Rejection reasons are accepted by the backend. */
  rejectReason: boolean;
  /** Editing proposed changes before approval (not implemented when false). */
  editBeforeApproval: boolean;
  /** Server-side history is available. */
  history: boolean;
}
