/**
 * LOCAL_DEVELOPMENT mock data for announcements.
 *
 * ⚠️ No announcement backend, delivery pipeline, or read-receipt system
 * exists. Records below are operational communication samples used to
 * exercise UI states. They are not delivered by email, SMS or push.
 */
import { isoFromToday } from "./demoEvents";
import type { Announcement } from "@/types";

const stamp = (dayOffset: number, hour = 10) => isoFromToday(dayOffset, hour);

export const MOCK_ANNOUNCEMENTS_BY_EVENT: Record<string, Announcement[]> = {
  "techfest-2026": [
    {
      id: "ann_001",
      eventId: "techfest-2026",
      title: "Day-one registration coverage is the current priority",
      body: "The opening-morning registration desk is still five people short. Expo floaters will cover the first two hours, and volunteer leads should confirm remaining cover by Thursday briefing.\n\nIf you cannot take a morning shift, tell Neha before 18:00 tomorrow so we can rebalance the roster.",
      status: "published",
      priority: "urgent",
      category: "operations",
      audience: "event_team",
      authorMemberId: "usr_aarav",
      authorName: "Aarav Shah",
      publishedAt: stamp(-1, 18),
      createdAt: stamp(-1, 17),
      updatedAt: stamp(-1, 18),
      allowedTransitions: ["draft", "archived"],
    },
    {
      id: "ann_002",
      eventId: "techfest-2026",
      title: "Venue contract countersign deadline is Friday",
      body: "Facilities will waive the AV surcharge if the hire agreement is countersigned by Friday. Rahul owns faculty sign-off; Aarav will countersign once that is complete.\n\nDo not book external AV until the waiver is confirmed.",
      status: "published",
      priority: "important",
      category: "decision",
      audience: "organizers",
      authorMemberId: "usr_rahul",
      authorName: "Rahul Kapoor",
      publishedAt: stamp(-2, 19),
      createdAt: stamp(-2, 16),
      updatedAt: stamp(-2, 19),
      allowedTransitions: ["draft", "archived"],
    },
    {
      id: "ann_003",
      eventId: "techfest-2026",
      title: "Volunteer briefing moved to Maker Lab B2",
      body: "Thursday's volunteer leads briefing is in Maker Lab B2 at 17:00. Bring the current shift plan. Check-in process and escalation contacts are on the agenda.",
      status: "published",
      priority: "normal",
      category: "reminder",
      audience: "volunteers",
      authorMemberId: "usr_neha",
      authorName: "Neha Reddy",
      publishedAt: stamp(-3, 12),
      createdAt: stamp(-3, 11),
      updatedAt: stamp(-3, 12),
      allowedTransitions: ["draft", "archived"],
    },
    {
      id: "ann_004",
      eventId: "techfest-2026",
      title: "Sponsor proposal wording — draft for review",
      body: "Draft copy for the platinum tier benefits section. Please do not share this with partners until Priya marks it published.\n\nOpen questions: stage branding exclusivity and whether expo booth power is included.",
      status: "draft",
      priority: "important",
      category: "operations",
      audience: "organizers",
      authorMemberId: "usr_priya",
      authorName: "Priya Mehta",
      publishedAt: null,
      createdAt: stamp(-1, 9),
      updatedAt: stamp(0, 9),
      allowedTransitions: ["published", "archived"],
    },
    {
      id: "ann_005",
      eventId: "techfest-2026",
      title: "Opening ceremony run-of-show freeze",
      body: "The opening ceremony sequence is frozen as of last week's committee sync. Any further changes need Aarav's sign-off.",
      status: "archived",
      priority: "normal",
      category: "decision",
      audience: "event_team",
      authorMemberId: "usr_aarav",
      authorName: "Aarav Shah",
      publishedAt: stamp(-10, 14),
      createdAt: stamp(-11, 10),
      updatedAt: stamp(-6, 10),
      allowedTransitions: ["published"],
    },
  ],
  "spring-gala": [
    {
      id: "ann_101",
      eventId: "spring-gala",
      title: "Kickoff is scheduled — bring venue shortlist",
      body: "Gala kickoff is on the calendar. Organizers should arrive with a ranked venue shortlist and a first-pass catering envelope.",
      status: "published",
      priority: "normal",
      category: "general",
      audience: "organizers",
      authorMemberId: "usr_priya",
      authorName: "Priya Mehta",
      publishedAt: stamp(-2, 16),
      createdAt: stamp(-2, 15),
      updatedAt: stamp(-2, 16),
      allowedTransitions: ["draft", "archived"],
    },
  ],
  "hack-night-14": [],
  "alumni-summit": [],
};

export function getInitialAnnouncements(eventId: string): Announcement[] {
  return structuredClone(MOCK_ANNOUNCEMENTS_BY_EVENT[eventId] ?? []);
}
