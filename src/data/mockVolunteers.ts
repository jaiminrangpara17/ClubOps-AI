import { MOCK_MEMBERS } from "./mockTasks";
import type { ClubMemberOption, Volunteer } from "@/types";

const now = () => new Date().toISOString();

export const MOCK_CLUB_MEMBERS: ClubMemberOption[] = MOCK_MEMBERS.map((member, index) => ({
  id: member.id,
  name: member.name,
  email: `${member.name.toLowerCase().replace(/\s+/g, ".")}@club.edu`,
  clubRole: member.role ?? (index === 0 ? "Member" : null),
}));

const BASE_PARTICIPANTS: Omit<Volunteer, "id" | "eventId" | "createdAt" | "updatedAt">[] = [
  {
    memberId: "usr_aarav",
    name: "Aarav Shah",
    email: "aarav.shah@club.edu",
    eventRole: "Event Coordinator",
    availability: "available",
    availabilityNote: "Available 10:00 AM – 6:00 PM",
    status: "active",
    notes: "Primary venue and speaker contact.",
    workload: null,
  },
  {
    memberId: "usr_priya",
    name: "Priya Mehta",
    email: "priya.mehta@club.edu",
    eventRole: "Partnerships Lead",
    availability: "partially_available",
    availabilityNote: "Available after 1:00 PM",
    status: "active",
    notes: "Coordinates sponsors and partner communications.",
    workload: null,
  },
  {
    memberId: "usr_rahul",
    name: "Rahul Kapoor",
    email: "rahul.kapoor@club.edu",
    eventRole: "Logistics Lead",
    availability: "available",
    availabilityNote: "Available all event days",
    status: "active",
    notes: "Owns logistics, safety and catering.",
    workload: null,
  },
  {
    memberId: "usr_sana",
    name: "Sana Khan",
    email: "sana.khan@club.edu",
    eventRole: "Communications Lead",
    availability: "partially_available",
    availabilityNote: "Remote mornings; on-site afternoons",
    status: "active",
    notes: null,
    workload: null,
  },
  {
    memberId: "usr_amit",
    name: "Amit Verma",
    email: "amit.verma@club.edu",
    eventRole: "Technical Lead",
    availability: "available",
    availabilityNote: "Available 9:00 AM – 8:00 PM",
    status: "active",
    notes: "Owns AV and registration systems.",
    workload: null,
  },
  {
    memberId: "usr_neha",
    name: "Neha Reddy",
    email: "neha.reddy@club.edu",
    eventRole: "Volunteer Lead",
    availability: "unavailable",
    availabilityNote: "Unavailable Friday morning",
    status: "active",
    notes: "Coordinates volunteer shifts and briefings.",
    workload: null,
  },
];

function participant(eventId: string, index: number): Volunteer {
  const base = BASE_PARTICIPANTS[index]!;
  return {
    ...base,
    id: `vol_${eventId}_${index + 1}`,
    eventId,
    createdAt: now(),
    updatedAt: now(),
  };
}

export const MOCK_VOLUNTEERS_BY_EVENT: Record<string, Volunteer[]> = {
  "techfest-2026": BASE_PARTICIPANTS.map((_, index) => participant("techfest-2026", index)),
  "spring-gala": [participant("spring-gala", 0), participant("spring-gala", 2)],
  "hack-night-14": [participant("hack-night-14", 4), participant("hack-night-14", 5)],
  "alumni-summit": [],
};

export function getInitialVolunteers(eventId: string): Volunteer[] {
  return structuredClone(MOCK_VOLUNTEERS_BY_EVENT[eventId] ?? []);
}