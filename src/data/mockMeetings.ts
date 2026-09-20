/**
 * LOCAL_DEVELOPMENT mock data for meetings and meeting intelligence.
 *
 * ⚠️ No meeting backend, transcription or extraction service exists yet.
 * Decisions and action items below are hand-written SAMPLE content used to
 * exercise the UI states. They are never real AI output. Delete this module
 * when the backend ships.
 */
import { isoFromToday } from "./demoEvents";
import { MOCK_MEMBERS } from "./mockTasks";
import type {
  Meeting,
  MeetingIntelligence,
  MeetingParticipant,
  MeetingTranscript,
} from "@/types";

function participant(memberId: string): MeetingParticipant {
  const member = MOCK_MEMBERS.find((entry) => entry.id === memberId);
  return { memberId, name: member?.name ?? "Unknown member", role: member?.role ?? null };
}

function at(dayOffset: number, hour: number, minute = 0): string {
  const date = new Date(isoFromToday(dayOffset, hour));
  date.setMinutes(minute, 0, 0);
  return date.toISOString();
}

const stamp = (dayOffset: number) => isoFromToday(dayOffset, 12);

export const MOCK_MEETINGS_BY_EVENT: Record<string, Meeting[]> = {
  "techfest-2026": [
    {
      id: "mtg_001",
      eventId: "techfest-2026",
      title: "Core committee sync — week 6",
      startIso: at(-2, 18),
      endIso: at(-2, 19),
      location: "Student Union, Room 204",
      organizerMemberId: "usr_aarav",
      organizerName: "Aarav Shah",
      participants: ["usr_aarav", "usr_priya", "usr_rahul", "usr_neha"].map(participant),
      agenda: "1. Venue contract status\n2. Sponsor pipeline\n3. Volunteer coverage for day 1\n4. Open risks",
      notes: null,
      status: "held",
      processingStatus: "completed",
      processingError: null,
      hasTranscript: true,
      decisionCount: 3,
      actionItemCount: 4,
      createdAt: stamp(-9),
      updatedAt: stamp(-2),
    },
    {
      id: "mtg_002",
      eventId: "techfest-2026",
      title: "Sponsor outreach review",
      startIso: at(-1, 15, 30),
      endIso: at(-1, 16, 15),
      location: "Online",
      organizerMemberId: "usr_priya",
      organizerName: "Priya Mehta",
      participants: ["usr_priya", "usr_sana"].map(participant),
      agenda: "Review tier deck feedback and confirm outreach owners.",
      notes: "Recording uploaded after the call.",
      status: "held",
      processingStatus: "processing",
      processingError: null,
      hasTranscript: true,
      decisionCount: 0,
      actionItemCount: 0,
      createdAt: stamp(-5),
      updatedAt: stamp(-1),
    },
    {
      id: "mtg_003",
      eventId: "techfest-2026",
      title: "AV & stage walkthrough",
      startIso: at(-4, 11),
      endIso: at(-4, 12, 30),
      location: "Innovation Hall — main stage",
      organizerMemberId: "usr_amit",
      organizerName: "Amit Verma",
      participants: ["usr_amit", "usr_rahul"].map(participant),
      agenda: null,
      notes: "Transcript was uploaded but the extraction job failed.",
      status: "held",
      processingStatus: "failed",
      processingError: "Extraction timed out after 120 seconds.",
      hasTranscript: true,
      decisionCount: 0,
      actionItemCount: 0,
      createdAt: stamp(-7),
      updatedAt: stamp(-4),
    },
    {
      id: "mtg_004",
      eventId: "techfest-2026",
      title: "Volunteer leads briefing",
      startIso: at(3, 17),
      endIso: at(3, 18),
      location: "Maker Lab B2",
      organizerMemberId: "usr_neha",
      organizerName: "Neha Reddy",
      participants: ["usr_neha", "usr_aarav", "usr_sana"].map(participant),
      agenda: "Shift plan sign-off, escalation contacts, check-in process.",
      notes: null,
      status: "scheduled",
      processingStatus: "not_processed",
      processingError: null,
      hasTranscript: false,
      decisionCount: 0,
      actionItemCount: 0,
      createdAt: stamp(-1),
      updatedAt: stamp(-1),
    },
    {
      id: "mtg_005",
      eventId: "techfest-2026",
      title: "Faculty advisor check-in",
      startIso: at(7, 10),
      endIso: null,
      location: "Faculty block, Office 12",
      organizerMemberId: "usr_aarav",
      organizerName: "Aarav Shah",
      participants: ["usr_aarav"].map(participant),
      agenda: null,
      notes: null,
      status: "scheduled",
      processingStatus: "not_processed",
      processingError: null,
      hasTranscript: false,
      decisionCount: 0,
      actionItemCount: 0,
      createdAt: stamp(0),
      updatedAt: stamp(0),
    },
  ],
  "spring-gala": [
    {
      id: "mtg_101",
      eventId: "spring-gala",
      title: "Gala kickoff",
      startIso: at(5, 16),
      endIso: at(5, 17),
      location: "Online",
      organizerMemberId: "usr_priya",
      organizerName: "Priya Mehta",
      participants: ["usr_priya", "usr_rahul"].map(participant),
      agenda: "Budget envelope and venue shortlist.",
      notes: null,
      status: "scheduled",
      processingStatus: "not_processed",
      processingError: null,
      hasTranscript: false,
      decisionCount: 0,
      actionItemCount: 0,
      createdAt: stamp(-2),
      updatedAt: stamp(-2),
    },
  ],
  "hack-night-14": [],
  "alumni-summit": [],
};

export const MOCK_TRANSCRIPTS: Record<string, MeetingTranscript> = {
  mtg_001: {
    meetingId: "mtg_001",
    updatedAt: stamp(-2),
    text: [
      "Aarav: Let's start with the venue. Facilities sent the revised contract yesterday; the only open point is the AV surcharge.",
      "Rahul: I spoke to them this morning. If we sign by Friday they'll waive the surcharge. I need faculty sign-off before then.",
      "Aarav: Agreed — we sign by Friday. Rahul owns the faculty approval, I'll countersign.",
      "Priya: On sponsors, two tier-2 partners upgraded. The deck needs the new logos before we send the final proposal on Thursday.",
      "Sana: I can turn the logo pack around tomorrow.",
      "Neha: Volunteer coverage is at 80%. Registration on day one is the gap — we're five people short for the morning shift.",
      "Aarav: Let's move four floaters from the expo team to registration for the opening two hours and keep one as reserve.",
      "Neha: Fine by me, I'll update the shift plan and brief the leads on Thursday.",
      "Aarav: Last item — the outdoor stage weather risk. We hold the covered hall as contingency until three days before the event.",
    ].join("\n\n"),
  },
  mtg_002: {
    meetingId: "mtg_002",
    updatedAt: stamp(-1),
    text: "Priya: Quick review of the tier deck feedback…\n\nSana: The main comment was about the platinum tier benefits being unclear.\n\nPriya: Let's tighten that section before Thursday.",
  },
  mtg_003: {
    meetingId: "mtg_003",
    updatedAt: stamp(-4),
    text: "Amit: Sound check on the main stage. The left array is under-powered.\n\nRahul: Vendor can swap it Monday. I'll confirm the slot.",
  },
};

/** SAMPLE extraction results — hand-written, not model output. */
export const MOCK_INTELLIGENCE: Record<string, MeetingIntelligence> = {
  mtg_001: {
    summary:
      "The committee agreed to sign the venue contract by Friday, reassign volunteers to close the day-one registration gap, and keep the covered hall as a weather contingency.",
    generatedAt: stamp(-2),
    decisions: [
      {
        id: "dec_1",
        text: "Sign the venue contract by Friday to secure the AV surcharge waiver.",
        context: "Requires faculty approval first; Aarav countersigns.",
      },
      {
        id: "dec_2",
        text: "Move four expo floaters to the day-one registration morning shift.",
        context: "One floater kept in reserve.",
      },
      {
        id: "dec_3",
        text: "Hold the covered hall as weather contingency until day −3.",
        context: null,
      },
    ],
    actionItems: [
      {
        id: "act_1",
        text: "Obtain faculty sign-off on the venue contract",
        ownerMemberId: "usr_rahul",
        ownerName: "Rahul Kapoor",
        dueIso: isoFromToday(2, 17),
        priority: "high",
        linkedTaskId: null,
        linkedTaskStatus: null,
      },
      {
        id: "act_2",
        text: "Deliver updated sponsor logo pack",
        ownerMemberId: "usr_sana",
        ownerName: "Sana Khan",
        dueIso: isoFromToday(1, 17),
        priority: "medium",
        linkedTaskId: null,
        linkedTaskStatus: null,
      },
      {
        id: "act_3",
        text: "Update shift plan with registration reassignment",
        ownerMemberId: "usr_neha",
        ownerName: "Neha Reddy",
        dueIso: isoFromToday(3, 17),
        priority: "high",
        linkedTaskId: null,
        linkedTaskStatus: null,
      },
      {
        id: "act_4",
        text: "Send final sponsor proposal",
        ownerMemberId: "usr_priya",
        ownerName: "Priya Mehta",
        dueIso: isoFromToday(3, 12),
        priority: null,
        linkedTaskId: null,
        linkedTaskStatus: null,
      },
    ],
  },
};

export function getInitialMeetings(eventId: string): Meeting[] {
  return structuredClone(MOCK_MEETINGS_BY_EVENT[eventId] ?? []);
}
