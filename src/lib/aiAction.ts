import type { AiAction, AiActionStatus } from "@/types";

export type AiActionListFilter = "all" | AiActionStatus;

export const AI_ACTION_FILTERS: readonly { value: AiActionListFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "executing", label: "Executing" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "failed", label: "Failed" },
  { value: "expired", label: "Expired" },
];

export function filterAiActions(actions: AiAction[], filter: AiActionListFilter): AiAction[] {
  if (filter === "all") return actions;
  return actions.filter((action) => action.status === filter);
}

/** Pending first, then executing, then settled records newest-first. */
export function sortAiActions(actions: AiAction[]): AiAction[] {
  const weight = (action: AiAction): number => {
    switch (action.status) {
      case "pending":
        return 0;
      case "executing":
        return 1;
      default:
        return 2;
    }
  };
  return [...actions].sort((a, b) => {
    const diff = weight(a) - weight(b);
    if (diff !== 0) return diff;
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}

export function pendingCount(actions: AiAction[]): number {
  return actions.filter((action) => action.status === "pending").length;
}

/** Review/detail route for an action. */
export function aiActionReviewPath(eventId: string, actionId: string): string {
  return `/events/${eventId}/ai/actions/${actionId}`;
}

/** List route for all AI actions pending review. */
export const aiActionsListPath = (eventId: string): string => `/events/${eventId}/ai/actions`;

/** Maps an affected entity kind to its existing detail route, if one exists. */
export function affectedEntityPath(
  eventId: string,
  entity: AiAction["affectedEntity"],
): string | null {
  if (!entity) return null;
  switch (entity.kind) {
    case "task":
      return `/events/${eventId}/tasks`;
    case "volunteer":
      return `/events/${eventId}/volunteers/${entity.id}`;
    case "meeting":
      return `/events/${eventId}/meetings/${entity.id}`;
    case "document":
      return `/events/${eventId}/documents/${entity.id}`;
    case "risk":
      return `/events/${eventId}/risks/${entity.id}`;
    case "announcement":
      return `/events/${eventId}/announcements/${entity.id}`;
    case "event":
      return `/events/${eventId}`;
    default:
      return null;
  }
}
