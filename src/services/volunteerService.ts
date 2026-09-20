import { isMockApi } from "./apiMode";
import { apiRequest } from "./http";
import { getInitialVolunteers, MOCK_CLUB_MEMBERS } from "@/data/mockVolunteers";
import type {
  ClubMemberOption,
  CreateVolunteerRequest,
  UpdateVolunteerRequest,
  Volunteer,
  VolunteersListResponse,
} from "@/types";

/**
 * Event participation API. Person identity remains a separate member record.
 *
 * GET   /events/:eventId/volunteers
 * GET   /events/:eventId/volunteers/:volunteerId
 * POST  /events/:eventId/volunteers
 * PATCH /events/:eventId/volunteers/:volunteerId
 * GET   /members?excludeEventId=:eventId
 */
export interface VolunteerService {
  listVolunteers(eventId: string): Promise<VolunteersListResponse>;
  getVolunteer(eventId: string, volunteerId: string): Promise<Volunteer>;
  addVolunteer(eventId: string, request: CreateVolunteerRequest): Promise<Volunteer>;
  updateVolunteer(
    eventId: string,
    volunteerId: string,
    request: UpdateVolunteerRequest,
  ): Promise<Volunteer>;
  listAvailableMembers(eventId: string): Promise<ClubMemberOption[]>;
}

const httpVolunteerService: VolunteerService = {
  listVolunteers(eventId) {
    return apiRequest<VolunteersListResponse>(`/events/${eventId}/volunteers`);
  },
  getVolunteer(eventId, volunteerId) {
    return apiRequest<Volunteer>(`/events/${eventId}/volunteers/${volunteerId}`);
  },
  addVolunteer(eventId, request) {
    return apiRequest<Volunteer>(`/events/${eventId}/volunteers`, {
      method: "POST",
      body: request,
    });
  },
  updateVolunteer(eventId, volunteerId, request) {
    return apiRequest<Volunteer>(`/events/${eventId}/volunteers/${volunteerId}`, {
      method: "PATCH",
      body: request,
    });
  },
  listAvailableMembers(eventId) {
    return apiRequest<ClubMemberOption[]>(`/members?excludeEventId=${encodeURIComponent(eventId)}`);
  },
};

const LATENCY_MS = 280;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const STORE = new Map<string, Volunteer[]>();

function participants(eventId: string): Volunteer[] {
  let value = STORE.get(eventId);
  if (!value) {
    value = getInitialVolunteers(eventId);
    STORE.set(eventId, value);
  }
  return value;
}

function findScoped(eventId: string, volunteerId: string): Volunteer {
  const volunteer = participants(eventId).find((entry) => entry.id === volunteerId);
  if (!volunteer) throw new Error("Volunteer not found for this event");
  return volunteer;
}

const mockVolunteerService: VolunteerService = {
  async listVolunteers(eventId) {
    await wait(LATENCY_MS);
    const volunteers = participants(eventId);
    return { volunteers: structuredClone(volunteers), totalCount: volunteers.length };
  },
  async getVolunteer(eventId, volunteerId) {
    await wait(LATENCY_MS);
    return structuredClone(findScoped(eventId, volunteerId));
  },
  async addVolunteer(eventId, request) {
    await wait(LATENCY_MS);
    const list = participants(eventId);
    if (list.some((entry) => entry.memberId === request.memberId)) {
      throw new Error("This member already participates in the event");
    }
    const member = MOCK_CLUB_MEMBERS.find((entry) => entry.id === request.memberId);
    if (!member) throw new Error("Member not found");
    const timestamp = new Date().toISOString();
    const volunteer: Volunteer = {
      id: `vol_${Date.now().toString(36)}`,
      eventId,
      memberId: member.id,
      name: member.name,
      email: member.email,
      eventRole: request.eventRole.trim(),
      availability: request.availability,
      availabilityNote: request.availabilityNote?.trim() || null,
      status: request.status ?? "active",
      notes: request.notes?.trim() || null,
      workload: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    list.unshift(volunteer);
    return structuredClone(volunteer);
  },
  async updateVolunteer(eventId, volunteerId, request) {
    await wait(LATENCY_MS);
    const list = participants(eventId);
    const index = list.findIndex((entry) => entry.id === volunteerId);
    if (index === -1) throw new Error("Volunteer not found for this event");
    const updated: Volunteer = {
      ...list[index]!,
      ...request,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    return structuredClone(updated);
  },
  async listAvailableMembers(eventId) {
    await wait(150);
    const existingIds = new Set(participants(eventId).map((entry) => entry.memberId));
    return MOCK_CLUB_MEMBERS.filter((member) => !existingIds.has(member.id));
  },
};

export const volunteerService: VolunteerService = isMockApi
  ? mockVolunteerService
  : httpVolunteerService;