/**
 * Task domain types — the single source of truth for tasks.
 *
 * Tasks are the core operational entity in ClubOps AI. They represent
 * assigned work with deadlines, priorities, and status tracking.
 */

/** Task status values (backend-defined, frontend must accept these exactly). */
export type TaskStatus = "todo" | "in_progress" | "blocked" | "completed";

/** Task priority levels (backend-defined). */
export type TaskPriority = "low" | "medium" | "high" | "critical";

/** Deadline state for filtering purposes. */
export type DeadlineState = "overdue" | "due_today" | "upcoming" | "any";

/** Task filters for list views. */
export interface TaskFilters {
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  assigneeId?: string | "all";
  deadlineState?: DeadlineState;
  search?: string;
}

/** Sorting options for task lists. */
export type TaskSortField = "due_date" | "priority" | "created_at" | "title";
export type TaskSortDirection = "asc" | "desc";

export interface TaskSort {
  field: TaskSortField;
  direction: TaskSortDirection;
}

/** A single task. */
export interface Task {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueIso: string | null;
  /** The user ID assigned to this task. */
  assigneeId: string | null;
  /** Resolved assignee display name (from backend). */
  assigneeName: string | null;
  /** Optional blocker/dependency description. */
  blocker: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Request payload to create a task. */
export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority: TaskPriority;
  dueIso?: string | null;
  assigneeId?: string | null;
  blocker?: string;
}

/** Request payload to update a task. */
export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueIso?: string | null;
  assigneeId?: string | null;
  blocker?: string | null;
}

/** Response envelope for task lists. */
export interface TasksListResponse {
  tasks: Task[];
  totalCount: number;
}

/** Task summary statistics (for the header). */
export interface TaskStats {
  total: number;
  open: number;
  inProgress: number;
  blocked: number;
  completed: number;
  overdue: number;
}

/** A club member / event team member (for assignee selection). */
export interface EventMember {
  id: string;
  name: string;
  role?: string;
}
