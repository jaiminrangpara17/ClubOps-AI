/**
 * Hook for loading and managing tasks for an event.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { describeApiError } from "@/services/http";
import { taskService } from "@/services/taskService";
import type { Task } from "@/types";

interface TasksState {
  data: Task[];
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
}

const initialState: TasksState = {
  data: [],
  error: null,
  isLoading: true,
  isRefreshing: false,
};

export interface UseTasksResult extends TasksState {
  refetch: () => void;
  createTask: (request: Parameters<typeof taskService.createTask>[1]) => Promise<Task>;
  updateTask: (
    taskId: string,
    request: Parameters<typeof taskService.updateTask>[2],
  ) => Promise<Task>;
  updateStatus: (taskId: string, status: Task["status"]) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
}

export function useTasks(eventId: string): UseTasksResult {
  const [state, setState] = useState<TasksState>(initialState);
  const requestIdRef = useRef(0);

  const fetchTasks = useCallback(async (isRefresh = false) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setState((current) => ({
      ...current,
      error: null,
      isLoading: !isRefresh && current.data.length === 0,
      isRefreshing: isRefresh || current.data.length > 0,
    }));

    try {
      const response = await taskService.listTasks(eventId);
      if (requestId !== requestIdRef.current) return;
      setState({
        data: response.tasks,
        error: null,
        isLoading: false,
        isRefreshing: false,
      });
    } catch (cause: unknown) {
      if (requestId !== requestIdRef.current) return;
      setState((current) => ({
        data: current.data,
        error: describeApiError(cause, "Unable to load tasks."),
        isLoading: false,
        isRefreshing: false,
      }));
    }
  }, [eventId]);

  useEffect(() => {
    fetchTasks(false);
  }, [fetchTasks]);

  const refetch = useCallback(() => fetchTasks(true), [fetchTasks]);

  const createTask: UseTasksResult["createTask"] = useCallback(
    async (request) => {
      const task = await taskService.createTask(eventId, request);
      setState((current) => ({ ...current, data: [task, ...current.data] }));
      return task;
    },
    [eventId],
  );

  const updateTask: UseTasksResult["updateTask"] = useCallback(
    async (taskId, request) => {
      const updated = await taskService.updateTask(eventId, taskId, request);
      setState((current) => ({
        ...current,
        data: current.data.map((t) => (t.id === taskId ? updated : t)),
      }));
      return updated;
    },
    [eventId],
  );

  const updateStatus: UseTasksResult["updateStatus"] = useCallback(
    async (taskId, status) => {
      const updated = await taskService.updateTaskStatus(eventId, taskId, status);
      setState((current) => ({
        ...current,
        data: current.data.map((t) => (t.id === taskId ? updated : t)),
      }));
      return updated;
    },
    [eventId],
  );

  const deleteTask: UseTasksResult["deleteTask"] = useCallback(
    async (taskId) => {
      await taskService.deleteTask(eventId, taskId);
      setState((current) => ({
        ...current,
        data: current.data.filter((t) => t.id !== taskId),
      }));
    },
    [eventId],
  );

  return {
    ...state,
    refetch,
    createTask,
    updateTask,
    updateStatus,
    deleteTask,
  };
}
