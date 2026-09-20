import type { CopilotEntityKind, CopilotSource, CopilotSuggestedAction } from "@/types";

const ENTITY_LABEL: Record<CopilotEntityKind, string> = {
  task: "Task",
  volunteer: "Volunteer",
  meeting: "Meeting",
  document: "Document",
  risk: "Risk",
  announcement: "Announcement",
  event: "Event",
};

export function sourceKindLabel(kind: CopilotEntityKind): string {
  return ENTITY_LABEL[kind];
}

/**
 * Resolves a cited record to an existing route. Only routes that are
 * registered in AppRoutes are produced; tasks currently have no detail route,
 * so they open the task workspace.
 */
export function sourcePath(eventId: string, source: CopilotSource): string {
  switch (source.kind) {
    case "task":
      return `/events/${eventId}/tasks`;
    case "volunteer":
      return `/events/${eventId}/volunteers/${source.id}`;
    case "meeting":
      return `/events/${eventId}/meetings/${source.id}`;
    case "document":
      return `/events/${eventId}/documents/${source.id}`;
    case "risk":
      return `/events/${eventId}/risks/${source.id}`;
    case "announcement":
      return `/events/${eventId}/announcements/${source.id}`;
    case "event":
      return `/events/${eventId}`;
    default:
      return `/events/${eventId}`;
  }
}

/** Suggested actions only navigate; nothing is executed. */
export function suggestedActionPath(eventId: string, action: CopilotSuggestedAction): string {
  if (action.moduleId === "event") return `/events/${eventId}`;
  const base = `/events/${eventId}/${action.moduleId}`;
  // Tasks have no detail route yet; every other module does.
  if (!action.entityId || action.moduleId === "tasks") return base;
  return `${base}/${action.entityId}`;
}

/** Prompt suggestions scoped to modules that exist in the product. */
export const QUICK_PROMPTS: readonly string[] = [
  "What needs my attention today?",
  "Which tasks are overdue?",
  "What risks need attention?",
  "What came out of the latest meeting?",
  "Which volunteers are overloaded?",
  "What deadlines are approaching?",
  "Summarize the latest announcements.",
];
