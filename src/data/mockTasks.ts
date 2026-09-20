/**
 * LOCAL_DEVELOPMENT mock data for tasks and event members.
 *
 * ⚠️ No task backend exists yet. This data is isolated from demo events
 * so the rest of the shell keeps working unchanged. Replace with real
 * API when the backend ships.
 */

import { isoFromToday } from "./demoEvents";
import type { EventMember, Task } from "@/types";

/**
 * Mock club members for assignee selection.
 * Stored here so the assignee selector is not hardcoded with users.
 */
export const MOCK_MEMBERS: EventMember[] = [
  { id: "usr_aarav", name: "Aarav Shah", role: "Event Head" },
  { id: "usr_priya", name: "Priya Mehta", role: "Coordinator" },
  { id: "usr_rahul", name: "Rahul Kapoor", role: "Logistics" },
  { id: "usr_sana", name: "Sana Khan", role: "Comms Lead" },
  { id: "usr_amit", name: "Amit Verma", role: "Tech Lead" },
  { id: "usr_neha", name: "Neha Reddy", role: "Volunteer Lead" },
];

/**
 * Initial task seeds per event, keyed by event id.
 * Dates are computed from `isoFromToday` so they never go stale.
 */
export const MOCK_TASKS_BY_EVENT: Record<string, Task[]> = {
  "techfest-2026": [
    {
      id: "tsk_001",
      eventId: "techfest-2026",
      title: "Finalize venue booking",
      description: "Sign the auditorium contract with the facilities team and confirm AV setup.",
      status: "in_progress",
      priority: "high",
      dueIso: isoFromToday(2),
      assigneeId: "usr_aarav",
      assigneeName: "Aarav Shah",
      blocker: "Waiting for faculty approval",
      createdAt: isoFromToday(-10),
      updatedAt: isoFromToday(-2),
    },
    {
      id: "tsk_002",
      eventId: "techfest-2026",
      title: "Prepare sponsorship proposal",
      description: "Draft the tiered sponsorship deck for outreach to corporate partners.",
      status: "todo",
      priority: "critical",
      dueIso: isoFromToday(1),
      assigneeId: "usr_priya",
      assigneeName: "Priya Mehta",
      blocker: null,
      createdAt: isoFromToday(-7),
      updatedAt: isoFromToday(-1),
    },
    {
      id: "tsk_003",
      eventId: "techfest-2026",
      title: "Design event poster",
      description: "Create the hero poster for social media and physical distribution.",
      status: "todo",
      priority: "medium",
      dueIso: isoFromToday(5),
      assigneeId: "usr_sana",
      assigneeName: "Sana Khan",
      blocker: null,
      createdAt: isoFromToday(-5),
      updatedAt: isoFromToday(-3),
    },
    {
      id: "tsk_004",
      eventId: "techfest-2026",
      title: "Assign remaining volunteers",
      description: "Fill 5 open shifts on day 1 and 3 volunteer slots.",
      status: "blocked",
      priority: "high",
      dueIso: isoFromToday(-1),
      assigneeId: "usr_neha",
      assigneeName: "Neha Reddy",
      blocker: "Waiting on faculty release for 2 volunteers",
      createdAt: isoFromToday(-14),
      updatedAt: isoFromToday(-1),
    },
    {
      id: "tsk_005",
      eventId: "techfest-2026",
      title: "Set up registration system",
      description: "Deploy the online registration form and test payment flow.",
      status: "completed",
      priority: "high",
      dueIso: isoFromToday(-3),
      assigneeId: "usr_amit",
      assigneeName: "Amit Verma",
      blocker: null,
      createdAt: isoFromToday(-20),
      updatedAt: isoFromToday(-3),
    },
    {
      id: "tsk_006",
      eventId: "techfest-2026",
      title: "Book catering for day 1",
      description: "Confirm catering vendor and menu for the opening day.",
      status: "todo",
      priority: "medium",
      dueIso: isoFromToday(7),
      assigneeId: "usr_rahul",
      assigneeName: "Rahul Kapoor",
      blocker: null,
      createdAt: isoFromToday(-6),
      updatedAt: isoFromToday(-4),
    },
    {
      id: "tsk_007",
      eventId: "techfest-2026",
      title: "Brief keynote speakers",
      description: "Share agenda, talk length, and Q&A format with the keynote speakers.",
      status: "in_progress",
      priority: "medium",
      dueIso: isoFromToday(10),
      assigneeId: "usr_priya",
      assigneeName: "Priya Mehta",
      blocker: null,
      createdAt: isoFromToday(-8),
      updatedAt: isoFromToday(-2),
    },
    {
      id: "tsk_008",
      eventId: "techfest-2026",
      title: "Confirm security plan",
      description: "Finalize crowd-control plan with campus security.",
      status: "todo",
      priority: "high",
      dueIso: isoFromToday(-2),
      assigneeId: "usr_rahul",
      assigneeName: "Rahul Kapoor",
      blocker: null,
      createdAt: isoFromToday(-12),
      updatedAt: isoFromToday(-2),
    },
    {
      id: "tsk_009",
      eventId: "techfest-2026",
      title: "Prepare volunteer handbook",
      description: "Compile roles, shift schedules, and emergency contacts.",
      status: "completed",
      priority: "low",
      dueIso: isoFromToday(-5),
      assigneeId: "usr_neha",
      assigneeName: "Neha Reddy",
      blocker: null,
      createdAt: isoFromToday(-18),
      updatedAt: isoFromToday(-5),
    },
    {
      id: "tsk_010",
      eventId: "techfest-2026",
      title: "Announce opening ceremony",
      description: "Send out the opening ceremony details to all registered attendees.",
      status: "todo",
      priority: "low",
      dueIso: isoFromToday(14),
      assigneeId: "usr_sana",
      assigneeName: "Sana Khan",
      blocker: null,
      createdAt: isoFromToday(-4),
      updatedAt: isoFromToday(-1),
    },
    {
      id: "tsk_011",
      eventId: "techfest-2026",
      title: "Test AV setup in main hall",
      description: "Run a full sound and video check with the tech team.",
      status: "in_progress",
      priority: "high",
      dueIso: isoFromToday(4),
      assigneeId: "usr_amit",
      assigneeName: "Amit Verma",
      blocker: null,
      createdAt: isoFromToday(-9),
      updatedAt: isoFromToday(-1),
    },
    {
      id: "tsk_012",
      eventId: "techfest-2026",
      title: "Create emergency contact sheet",
      description: "List of key contacts including security, medical, and venue.",
      status: "completed",
      priority: "medium",
      dueIso: isoFromToday(-8),
      assigneeId: "usr_rahul",
      assigneeName: "Rahul Kapoor",
      blocker: null,
      createdAt: isoFromToday(-15),
      updatedAt: isoFromToday(-8),
    },
  ],
  "spring-gala": [
    {
      id: "tsk_101",
      eventId: "spring-gala",
      title: "Draft invite list",
      description: "Compile the invite list of volunteers and faculty.",
      status: "todo",
      priority: "medium",
      dueIso: isoFromToday(30),
      assigneeId: "usr_priya",
      assigneeName: "Priya Mehta",
      blocker: null,
      createdAt: isoFromToday(-5),
      updatedAt: isoFromToday(-1),
    },
  ],
  "hack-night-14": [
    {
      id: "tsk_201",
      eventId: "hack-night-14",
      title: "Order overnight snacks",
      description: "Order food and drinks for the overnight session.",
      status: "in_progress",
      priority: "high",
      dueIso: isoFromToday(5),
      assigneeId: "usr_neha",
      assigneeName: "Neha Reddy",
      blocker: null,
      createdAt: isoFromToday(-3),
      updatedAt: isoFromToday(-1),
    },
  ],
  "alumni-summit": [],
};

/** Returns a copy of the tasks for an event (or empty array). */
export function getInitialTasks(eventId: string): Task[] {
  const seed = MOCK_TASKS_BY_EVENT[eventId] ?? [];
  // Return a deep copy so mutations don't leak across calls.
  return JSON.parse(JSON.stringify(seed));
}
