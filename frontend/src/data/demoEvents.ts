import type { ClubEvent } from "@/types";

/* =========================================================================
   TEMPORARY PREVIEW DATA
   Development/demo content only — there is no backend connected yet.
   Replace this module with API data in a later commit; no component
   imports these constants directly except through EventContext / pages.
   ========================================================================= */

/** Builds an ISO date offset from today so preview content never goes stale. */
export function isoFromToday(dayOffset: number, hour = 9): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString();
}

export const DEMO_EVENTS: ClubEvent[] = [
  {
    id: "techfest-2026",
    name: "TechFest 2026",
    code: "TF26",
    status: "active",
    startIso: isoFromToday(24),
    endIso: isoFromToday(26, 22),
    venue: "Innovation Hall — Campus North",
    summary: "Three-day flagship technology festival with 40 sessions and a startup expo.",
    attendeesExpected: 1200,
    teamSize: 48,
    readiness: 68,
  },
  {
    id: "spring-gala",
    name: "Spring Volunteer Gala",
    code: "SVG26",
    status: "planned",
    startIso: isoFromToday(63, 18),
    endIso: isoFromToday(63, 23),
    venue: "Riverside Pavilion",
    summary: "Annual thank-you dinner and awards evening for the volunteer network.",
    attendeesExpected: 240,
    teamSize: 14,
    readiness: 24,
  },
  {
    id: "hack-night-14",
    name: "Hack Night #14",
    code: "HN14",
    status: "at-risk",
    startIso: isoFromToday(9, 17),
    endIso: isoFromToday(10, 2),
    venue: "Maker Lab B2",
    summary: "Overnight build session with mentor rotations and a morning demo round.",
    attendeesExpected: 90,
    teamSize: 9,
    readiness: 41,
  },
  {
    id: "alumni-summit",
    name: "Alumni Summit",
    code: "ALS25",
    status: "complete",
    startIso: isoFromToday(-38),
    endIso: isoFromToday(-37, 20),
    venue: "Grand Lecture Theatre",
    summary: "Networking summit with keynote panels and a mentoring marketplace.",
    attendeesExpected: 430,
    teamSize: 21,
    readiness: 100,
  },
];

export const DEFAULT_EVENT_ID = "techfest-2026";
