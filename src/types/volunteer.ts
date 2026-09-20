/** Event-specific participation for an existing club member. */
export type VolunteerStatus = "active" | "inactive";

export type VolunteerAvailability = "available" | "partially_available" | "unavailable";

/** Supplied by the backend when available; otherwise derived by the mock adapter. */
export type VolunteerWorkloadLevel = "low" | "medium" | "high" | "overloaded";

export interface VolunteerWorkloadSummary {
  level: VolunteerWorkloadLevel;
  assigned: number;
  completed: number;
  pending: number;
  overdue: number;
}

/** A person's participation in one event, not their global user identity. */
export interface Volunteer {
  id: string;
  eventId: string;
  memberId: string;
  name: string;
  email: string | null;
  eventRole: string;
  availability: VolunteerAvailability;
  availabilityNote: string | null;
  status: VolunteerStatus;
  notes: string | null;
  workload: VolunteerWorkloadSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVolunteerRequest {
  memberId: string;
  eventRole: string;
  availability: VolunteerAvailability;
  availabilityNote?: string;
  status?: VolunteerStatus;
  notes?: string;
}

/** Global identity fields are intentionally not editable here. */
export interface UpdateVolunteerRequest {
  eventRole?: string;
  availability?: VolunteerAvailability;
  availabilityNote?: string | null;
  status?: VolunteerStatus;
  notes?: string | null;
}

export interface VolunteersListResponse {
  volunteers: Volunteer[];
  totalCount: number;
}

export interface ClubMemberOption {
  id: string;
  name: string;
  email: string | null;
  clubRole: string | null;
}

export interface VolunteerFilters {
  search: string;
  status: VolunteerStatus | "all";
  role: string | "all";
  availability: VolunteerAvailability | "all";
  workload: VolunteerWorkloadLevel | "all";
}

export interface VolunteerStats {
  total: number;
  assigned: number;
  available: number;
  atCapacity: number;
}

/** View model combining participation with tasks from Part 06. */
export interface VolunteerWithTasks extends Volunteer {
  workload: VolunteerWorkloadSummary;
}