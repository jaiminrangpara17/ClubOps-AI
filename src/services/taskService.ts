import { isMockApi } from "./apiMode";
import { apiRequest } from "./http";
import { MOCK_MEMBERS, getInitialTasks } from "@/data/mockTasks";
import type {
  CreateTaskRequest,
  EventMember,
  Task,
  TaskStatus,
  TasksListResponse,
  UpdateTaskRequest,
} from "@/types";

/**
 * Task service — the ONLY module that talks to task endpoints.
 *
 * Contract (owned by the backend):
 *   GET    /events/:eventId/tasks          → TasksListResponse
 *   POST   /events/:eventId/tasks          → Task
 *   GET    /events/:eventId/tasks/:taskId  → Task
 *   PATCH  /events/:eventId/tasks/:taskId  → Task
 *   PATCH  /events/:eventId/tasks/:taskId/status → Task
 *   DELETE /events/:eventId/tasks/:taskId  → 204  (only if supported)
 *   GET    /events/:eventId/members        → EventMember[]
 *
 * While endpoints are unavailable the LOCAL_DEVELOPMENT mock is used.
 */
export interface TaskService {
  listTasks(eventId: string): Promise<TasksListResponse>;
  getTask(eventId: string, taskId: string): Promise<Task>;
  createTask(eventId: string, request: CreateTaskRequest): Promise<Task>;
  updateTask(eventId: string, taskId: string, request: UpdateTaskRequest): Promise<Task>;
  updateTaskStatus(eventId: string, taskId: string, status: TaskStatus): Promise<Task>;
  deleteTask(eventId: string, taskId: string): Promise<void>;
  listMembers(eventId: string): Promise<EventMember[]>;
}

const httpTaskService: TaskService = {
  listTasks(eventId) {
    return apiRequest<TasksListResponse>(`/events/${eventId}/tasks`);
  },
  getTask(eventId, taskId) {
    return apiRequest<Task>(`/events/${eventId}/tasks/${taskId}`);
  },
  createTask(eventId, request) {
    return apiRequest<Task>(`/events/${eventId}/tasks`, { method: "POST", body: request });
  },
  updateTask(eventId, taskId, request) {
    return apiRequest<Task>(`/events/${eventId}/tasks/${taskId}`, {
      method: "PATCH",
      body: request,
    });
  },
  updateTaskStatus(eventId, taskId, status) {
    return apiRequest<Task>(`/events/${eventId}/tasks/${taskId}/status`, {
      method: "PATCH",
      body: { status },
    });
  },
  deleteTask(eventId, taskId) {
    return apiRequest<void>(`/events/${eventId}/tasks/${taskId}`, { method: "DELETE" });
  },
  listMembers(eventId) {
    return apiRequest<EventMember[]>(`/events/${eventId}/members`);
  },
};

/* ------------------------------------------------------------------ */
/* LOCAL_DEVELOPMENT — temporary mock                                  */
/*                                                                     */
/* ⚠️ No task endpoints exist yet. Delete when the backend is ready.   */
/* ------------------------------------------------------------------ */

const LATENCY_MS = 300;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mutable task store per event. Seeded on first access so the UI can persist
 * changes across navigations within the same session.
 */
const TASK_STORE = new Map<string, Task[]>();

function ensureSeeded(eventId: string): Task[] {
  let tasks = TASK_STORE.get(eventId);
  if (!tasks) {
    tasks = getInitialTasks(eventId);
    TASK_STORE.set(eventId, tasks);
  }
  return tasks;
}

function generateId(): string {
  return `tsk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

const mockTaskService: TaskService = {
  async listTasks(eventId) {
    await wait(LATENCY_MS);
    const tasks = ensureSeeded(eventId);
    return { tasks: [...tasks], totalCount: tasks.length };
  },

  async getTask(eventId, taskId) {
    await wait(LATENCY_MS);
    const tasks = ensureSeeded(eventId);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");
    return { ...task };
  },

  async createTask(eventId, request) {
    await wait(LATENCY_MS);
    const tasks = ensureSeeded(eventId);
    const assignee = request.assigneeId
      ? MOCK_MEMBERS.find((m) => m.id === request.assigneeId)
      : undefined;

    const task: Task = {
      id: generateId(),
      eventId,
      title: request.title,
      description: request.description ?? null,
      status: request.status ?? "todo",
      priority: request.priority,
      dueIso: request.dueIso ?? null,
      assigneeId: request.assigneeId ?? null,
      assigneeName: assignee?.name ?? null,
      blocker: request.blocker ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    tasks.unshift(task);
    return task;
  },

  async updateTask(eventId, taskId, request) {
    await wait(LATENCY_MS);
    const tasks = ensureSeeded(eventId);
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error("Task not found");

    const existing = tasks[index];
    const assignee = request.assigneeId
      ? MOCK_MEMBERS.find((m) => m.id === request.assigneeId)
      : request.assigneeId === null
        ? undefined
        : existing.assigneeId
          ? MOCK_MEMBERS.find((m) => m.id === existing.assigneeId)
          : undefined;

    const updated: Task = {
      ...existing,
      ...request,
      assigneeName: assignee?.name ?? null,
      updatedAt: nowIso(),
    };

    tasks[index] = updated;
    return updated;
  },

  async updateTaskStatus(eventId, taskId, status) {
    return this.updateTask(eventId, taskId, { status });
  },

  async deleteTask(eventId, taskId) {
    await wait(LATENCY_MS);
    const tasks = ensureSeeded(eventId);
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error("Task not found");
    tasks.splice(index, 1);
  },

  async listMembers(eventId) {
    await wait(150);
    void eventId;
    return [...MOCK_MEMBERS];
  },
};

export const taskService: TaskService = isMockApi ? mockTaskService : httpTaskService;
