import { isTaskOverdue } from "./taskDateUtils";
import type {
  Task,
  Tone,
  VolunteerAvailability,
  VolunteerFilters,
  VolunteerStats,
  VolunteerStatus,
  VolunteerWithTasks,
  VolunteerWorkloadLevel,
  VolunteerWorkloadSummary,
} from "@/types";

export const AVAILABILITY_LABEL: Record<VolunteerAvailability, string> = {
  available: "Available",
  partially_available: "Partially available",
  unavailable: "Unavailable",
};

export const AVAILABILITY_TONE: Record<VolunteerAvailability, Tone> = {
  available: "success",
  partially_available: "warning",
  unavailable: "neutral",
};

export const VOLUNTEER_STATUS_LABEL: Record<VolunteerStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

export const VOLUNTEER_STATUS_TONE: Record<VolunteerStatus, Tone> = {
  active: "brand",
  inactive: "neutral",
};

export const WORKLOAD_LABEL: Record<VolunteerWorkloadLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  overloaded: "Overloaded",
};

export const WORKLOAD_TONE: Record<VolunteerWorkloadLevel, Tone> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  overloaded: "danger",
};

/**
 * Temporary workload adapter used only when the backend returns no workload.
 * Thresholds are isolated here and are not product-authoritative.
 */
export function deriveVolunteerWorkload(tasks: Task[]): VolunteerWorkloadSummary {
  const completed = tasks.filter((task) => task.status === "completed").length;
  const pending = tasks.length - completed;
  const overdue = tasks.filter((task) => isTaskOverdue(task)).length;

  let level: VolunteerWorkloadLevel = "low";
  if (pending >= 9) level = "overloaded";
  else if (pending >= 6) level = "high";
  else if (pending >= 3) level = "medium";

  return { level, assigned: tasks.length, completed, pending, overdue };
}

export function computeVolunteerStats(volunteers: VolunteerWithTasks[]): VolunteerStats {
  return {
    total: volunteers.length,
    assigned: volunteers.filter((volunteer) => volunteer.workload.assigned > 0).length,
    available: volunteers.filter((volunteer) => volunteer.availability === "available").length,
    atCapacity: volunteers.filter((volunteer) =>
      volunteer.workload.level === "high" || volunteer.workload.level === "overloaded",
    ).length,
  };
}

export function filterVolunteers(
  volunteers: VolunteerWithTasks[],
  filters: VolunteerFilters,
): VolunteerWithTasks[] {
  const query = filters.search.trim().toLowerCase();
  return volunteers.filter((volunteer) => {
    if (query && !`${volunteer.name} ${volunteer.eventRole}`.toLowerCase().includes(query)) return false;
    if (filters.status !== "all" && volunteer.status !== filters.status) return false;
    if (filters.role !== "all" && volunteer.eventRole !== filters.role) return false;
    if (filters.availability !== "all" && volunteer.availability !== filters.availability) return false;
    if (filters.workload !== "all" && volunteer.workload.level !== filters.workload) return false;
    return true;
  });
}

export const EMPTY_VOLUNTEER_FILTERS: VolunteerFilters = {
  search: "",
  status: "all",
  role: "all",
  availability: "all",
  workload: "all",
};