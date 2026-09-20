/**
 * AI Copilot types.
 *
 * No backend AI contract exists yet. These types document the adapter
 * contract Part 14 will wire to the real service. Structured fields
 * (sources, suggested actions, related entities) are optional because
 * the backend may not populate them; the UI never fabricates them.
 */

import type { DashboardModuleId } from "./dashboard";

export type CopilotRole = "user" | "assistant";

export type CopilotEntityKind =
  | "task"
  | "volunteer"
  | "meeting"
  | "document"
  | "risk"
  | "announcement"
  | "event";

/** A record the backend cited or referenced. Navigation only — never executes anything. */
export interface CopilotSource {
  kind: CopilotEntityKind;
  id: string;
  label: string;
}

/**
 * A recommendation surfaced by the backend. Clicking navigates to a screen;
 * Part 13 owns any approval/execution flow.
 */
export interface CopilotSuggestedAction {
  id: string;
  label: string;
  description: string | null;
  /** Module the action lives in; used to build a navigation target. */
  moduleId: DashboardModuleId | "event";
  /** Optional specific record inside the module. */
  entityId: string | null;
}

export interface CopilotMessage {
  id: string;
  role: CopilotRole;
  /** Plain text / light markdown; rendered through the safe renderer only. */
  content: string;
  createdAt: string;
  sources: CopilotSource[];
  suggestedActions: CopilotSuggestedAction[];
  /** True when the backend returned no usable content. */
  isEmpty: boolean;
  /** Set on assistant messages that failed; the content holds a safe message. */
  error: string | null;
}

export interface CopilotConversation {
  id: string;
  eventId: string;
  messages: CopilotMessage[];
  createdAt: string;
}

export interface CopilotSendRequest {
  eventId: string;
  conversationId: string;
  message: string;
}

export interface CopilotSendResponse {
  message: CopilotMessage;
}

export interface CopilotCapabilities {
  chat: boolean;
  /** Server-sent streaming. When false the UI uses request/response only. */
  streaming: boolean;
  /** Server-side conversation persistence. */
  persistence: boolean;
  sources: boolean;
  suggestedActions: boolean;
  feedback: boolean;
}

export type CopilotStatus = "idle" | "thinking" | "streaming" | "error";
