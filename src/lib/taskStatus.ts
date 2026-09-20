/**
 * Task status and priority definitions.
 *
 * Task statuses and priorities are backend-defined. This module maps them to
 * design-system tokens for consistent UI rendering. The backend remains
 * authoritative for valid values.
 */

import type { TaskPriority, TaskStatus, Tone } from "@/types";

export interface TaskStatusDefinition {
  value: TaskStatus;
  label: string;
  /** Short label for compact UI (e.g. badge). */
  shortLabel: string;
  tone: Tone;
}

export interface TaskPriorityDefinition {
  value: TaskPriority;
  label: string;
  tone: Tone;
  /** Numeric weight used for sorting (higher = more urgent). */
  weight: number;
}

export const TASK_STATUS_DEFINITIONS: TaskStatusDefinition[] = [
  { value: "todo", label: "To do", shortLabel: "To do", tone: "neutral" },
  { value: "in_progress", label: "In progress", shortLabel: "In progress", tone: "brand" },
  { value: "blocked", label: "Blocked", shortLabel: "Blocked", tone: "danger" },
  { value: "completed", label: "Completed", shortLabel: "Done", tone: "success" },
];

export const TASK_PRIORITY_DEFINITIONS: TaskPriorityDefinition[] = [
  { value: "low", label: "Low", tone: "neutral", weight: 0 },
  { value: "medium", label: "Medium", tone: "info", weight: 1 },
  { value: "high", label: "High", tone: "warning", weight: 2 },
  { value: "critical", label: "Critical", tone: "danger", weight: 3 },
];

export const TASK_STATUS_MAP: Record<TaskStatus, TaskStatusDefinition> =
  Object.fromEntries(TASK_STATUS_DEFINITIONS.map((d) => [d.value, d])) as Record<
    TaskStatus,
    TaskStatusDefinition
  >;

export const TASK_PRIORITY_MAP: Record<TaskPriority, TaskPriorityDefinition> =
  Object.fromEntries(TASK_PRIORITY_DEFINITIONS.map((d) => [d.value, d])) as Record<
    TaskPriority,
    TaskPriorityDefinition
  >;

export function getTaskStatusDefinition(status: TaskStatus): TaskStatusDefinition {
  return TASK_STATUS_MAP[status];
}

export function getTaskPriorityDefinition(priority: TaskPriority): TaskPriorityDefinition {
  return TASK_PRIORITY_MAP[priority];
}

/**
 * Returns the next allowed status for quick transitions.
 * Backend remains authoritative for valid transitions; this is only a
 * frontend hint for the quick-action UI.
 */
export function getNextQuickStatus(current: TaskStatus): TaskStatus | null {
  switch (current) {
    case "todo":
      return "in_progress";
    case "in_progress":
      return "completed";
    case "blocked":
      return "in_progress";
    case "completed":
      return null;
    default:
      return null;
  }
}
