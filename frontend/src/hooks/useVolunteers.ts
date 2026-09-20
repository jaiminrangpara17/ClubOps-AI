import { useCallback, useEffect, useMemo, useState } from "react";
import { deriveVolunteerWorkload } from "@/lib/volunteer";
import { describeApiError } from "@/services/http";
import { taskService } from "@/services/taskService";
import { volunteerService } from "@/services/volunteerService";
import type {
  ClubMemberOption,
  CreateVolunteerRequest,
  Task,
  UpdateVolunteerRequest,
  Volunteer,
  VolunteerWithTasks,
} from "@/types";

export function useVolunteers(eventId: string) {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    Promise.all([volunteerService.listVolunteers(eventId), taskService.listTasks(eventId)])
      .then(([volunteerResponse, taskResponse]) => {
        if (!active) return;
        setVolunteers(volunteerResponse.volunteers);
        setTasks(taskResponse.tasks);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeApiError(cause, "Unable to load volunteers."));
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId, nonce]);

  const data = useMemo<VolunteerWithTasks[]>(
    () => volunteers.map((volunteer) => {
      const assigned = tasks.filter((task) => task.assigneeId === volunteer.memberId);
      return {
        ...volunteer,
        workload: volunteer.workload ?? deriveVolunteerWorkload(assigned),
      };
    }),
    [volunteers, tasks],
  );

  return { data, tasks, error, isLoading, refetch: () => setNonce((value) => value + 1) };
}

export function useVolunteer(eventId: string, volunteerId: string) {
  const [participation, setParticipation] = useState<Volunteer | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setTasksLoading(true);
    setError(null);
    setTaskError(null);

    volunteerService.getVolunteer(eventId, volunteerId)
      .then((result) => {
        if (!active) return;
        setParticipation(result);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeApiError(cause, "Unable to load this volunteer."));
        setIsLoading(false);
      });

    taskService.listTasks(eventId)
      .then((taskResponse) => {
        if (!active) return;
        // The participant may still be loading; store the event-scoped tasks
        // and filter once both sources are present below.
        setAssignedTasks(taskResponse.tasks);
        setTasksLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setTaskError(describeApiError(cause, "Unable to load assigned tasks."));
        setTasksLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId, volunteerId, nonce]);

  const scopedTasks = useMemo(
    () => participation
      ? assignedTasks.filter((task) => task.assigneeId === participation.memberId)
      : [],
    [assignedTasks, participation],
  );
  const volunteer = useMemo<VolunteerWithTasks | null>(
    () => participation
      ? {
          ...participation,
          workload: participation.workload ?? deriveVolunteerWorkload(scopedTasks),
        }
      : null,
    [participation, scopedTasks],
  );

  return {
    volunteer,
    assignedTasks: scopedTasks,
    error,
    taskError,
    isLoading,
    tasksLoading,
    refetch: () => setNonce((value) => value + 1),
  };
}

export function useAvailableMembers(eventId: string) {
  const [members, setMembers] = useState<ClubMemberOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    volunteerService.listAvailableMembers(eventId)
      .then((result) => {
        if (!active) return;
        setMembers(result);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeApiError(cause, "Unable to load club members."));
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  return { members, error, isLoading };
}

export function useVolunteerMutations() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = useCallback(async (eventId: string, request: CreateVolunteerRequest) => {
    setIsSaving(true);
    setError(null);
    try {
      return await volunteerService.addVolunteer(eventId, request);
    } catch (cause: unknown) {
      setError(describeApiError(cause, "Unable to add this volunteer."));
      throw cause;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const update = useCallback(async (
    eventId: string,
    volunteerId: string,
    request: UpdateVolunteerRequest,
  ) => {
    setIsSaving(true);
    setError(null);
    try {
      return await volunteerService.updateVolunteer(eventId, volunteerId, request);
    } catch (cause: unknown) {
      setError(describeApiError(cause, "Unable to update this volunteer."));
      throw cause;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { add, update, isSaving, error, clearError: () => setError(null) };
}