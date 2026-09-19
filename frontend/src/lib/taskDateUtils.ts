/**
 * Task date utilities — centralized date logic for tasks.
 *
 * All overdue and due-soon calculations live here so components never
 * reimplement the rules. Backend remains authoritative for dates; this
 * module only classifies them for UI display.
 */

import { daysUntil } from "./format";
import type { DeadlineState, Task } from "@/types";

/**
 * Returns true if a task is overdue.
 *
 * A task is considered overdue ONLY when:
 * - It has a due date
 * - The due date has passed (before today)
 * - The task is NOT completed
 *
 * Backend provides the status; frontend only checks the date.
 */
export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  if (!task.dueIso) return false;
  if (task.status === "completed") return false;

  const days = daysUntil(task.dueIso, now);
  return days < 0;
}

/**
 * Classifies a task's deadline state.
 */
export function getTaskDeadlineState(task: Task, now: Date = new Date()): DeadlineState {
  if (!task.dueIso) return "any";

  if (task.status === "completed") {
    // Completed tasks are not "overdue" even if past due date.
    const days = daysUntil(task.dueIso, now);
    if (days < 0) return "any";
    if (days === 0) return "due_today";
    return "upcoming";
  }

  const days = daysUntil(task.dueIso, now);
  if (days < 0) return "overdue";
  if (days === 0) return "due_today";
  return "upcoming";
}

/**
 * Returns a human-readable label for a task's deadline.
 *
 * Examples: "Overdue by 2 days", "Due today", "Due tomorrow", "Due Sep 22".
 * Returns empty string if no due date.
 */
export function getTaskDueLabel(task: Task, now: Date = new Date()): string {
  if (!task.dueIso) return "";

  const days = daysUntil(task.dueIso, now);

  if (task.status === "completed") {
    if (days < 0) return `Completed`;
    if (days === 0) return "Completed today";
    return `Due ${formatShortDate(task.dueIso)}`;
  }

  if (days < -1) return `Overdue by ${Math.abs(days)} days`;
  if (days === -1) return "Overdue by 1 day";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 7) return `Due in ${days} days`;
  return `Due ${formatShortDate(task.dueIso)}`;
}

/** Formats an ISO date as "Sep 22". */
function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Computes task status counts from a task list.
 */
export function computeTaskStats(tasks: Task[], now: Date = new Date()): import("@/types").TaskStats {
  const stats: import("@/types").TaskStats = {
    total: tasks.length,
    open: 0,
    inProgress: 0,
    blocked: 0,
    completed: 0,
    overdue: 0,
  };

  for (const task of tasks) {
    switch (task.status) {
      case "todo":
        stats.open += 1;
        break;
      case "in_progress":
        stats.inProgress += 1;
        break;
      case "blocked":
        stats.blocked += 1;
        break;
      case "completed":
        stats.completed += 1;
        break;
    }
    if (isTaskOverdue(task, now)) {
      stats.overdue += 1;
    }
  }

  return stats;
}
