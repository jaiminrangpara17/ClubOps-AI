/**
 * LOCAL_DEVELOPMENT mock data for documents.
 *
 * ⚠️ No document backend, OCR engine, extraction pipeline, embeddings or
 * search index exists. The "extracted content" and "intelligence" below are
 * hand-written SAMPLE strings used to exercise UI states — they are never
 * produced by a model. Delete this module when the backend ships.
 */
import { isoFromToday } from "./demoEvents";
import type {
  ClubDocument,
  DocumentContent,
  DocumentIntelligence,
  DocumentRelations,
} from "@/types";

const stamp = (dayOffset: number) => isoFromToday(dayOffset, 11);

export const MOCK_DOCUMENTS_BY_EVENT: Record<string, ClubDocument[]> = {
  "techfest-2026": [
    {
      id: "doc_001",
      eventId: "techfest-2026",
      name: "Venue hire agreement.pdf",
      kind: "pdf",
      mimeType: "application/pdf",
      sizeBytes: 486_233,
      status: "ready",
      uploadedByName: "Rahul Kapoor",
      uploadedAt: stamp(-9),
      updatedAt: stamp(-8),
      tags: ["Contract", "Venue"],
      processingError: null,
      hasFile: true,
      hasExtractedContent: true,
      description: "Signed hire agreement for Innovation Hall including AV terms.",
    },
    {
      id: "doc_002",
      eventId: "techfest-2026",
      name: "Safety certificate.pdf",
      kind: "pdf",
      mimeType: "application/pdf",
      sizeBytes: 231_884,
      status: "processing",
      uploadedByName: "Priya Mehta",
      uploadedAt: stamp(-1),
      updatedAt: stamp(-1),
      tags: ["Permit"],
      processingError: null,
      hasFile: true,
      hasExtractedContent: false,
      description: null,
    },
    {
      id: "doc_003",
      eventId: "techfest-2026",
      name: "Sponsor tiers.xlsx",
      kind: "spreadsheet",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      sizeBytes: 74_120,
      status: "ready",
      uploadedByName: "Priya Mehta",
      uploadedAt: stamp(-5),
      updatedAt: stamp(-5),
      tags: ["Sponsorship"],
      processingError: null,
      hasFile: true,
      hasExtractedContent: true,
      description: "Tier pricing and benefits grid for partner outreach.",
    },
    {
      id: "doc_004",
      eventId: "techfest-2026",
      name: "Stage plan scan.png",
      kind: "image",
      mimeType: "image/png",
      sizeBytes: 1_942_331,
      status: "failed",
      uploadedByName: "Amit Verma",
      uploadedAt: stamp(-3),
      updatedAt: stamp(-3),
      tags: ["Logistics"],
      processingError: "Text extraction produced no readable content.",
      hasFile: true,
      hasExtractedContent: false,
      description: null,
    },
    {
      id: "doc_005",
      eventId: "techfest-2026",
      name: "Volunteer briefing pack.pdf",
      kind: "pdf",
      mimeType: "application/pdf",
      sizeBytes: 320_551,
      status: "queued",
      uploadedByName: "Neha Reddy",
      uploadedAt: stamp(0),
      updatedAt: stamp(0),
      tags: ["Volunteers"],
      processingError: null,
      hasFile: true,
      hasExtractedContent: false,
      description: null,
    },
  ],
  "spring-gala": [
    {
      id: "doc_101",
      eventId: "spring-gala",
      name: "Catering quote.pdf",
      kind: "pdf",
      mimeType: "application/pdf",
      sizeBytes: 98_440,
      status: "ready",
      uploadedByName: "Rahul Kapoor",
      uploadedAt: stamp(-2),
      updatedAt: stamp(-2),
      tags: ["Budget"],
      processingError: null,
      hasFile: true,
      hasExtractedContent: false,
      description: null,
    },
  ],
  "hack-night-14": [],
  "alumni-summit": [],
};

/** SAMPLE extracted text — hand-written, not OCR output. */
export const MOCK_CONTENT: Record<string, DocumentContent> = {
  doc_001: {
    documentId: "doc_001",
    pageCount: 4,
    extractedAt: stamp(-8),
    text: [
      "VENUE HIRE AGREEMENT",
      "This agreement is made between the Students' Union (the \"Hirer\") and Campus Facilities (the \"Provider\") for use of Innovation Hall, Campus North.",
      "1. HIRE PERIOD. The hall is reserved for three consecutive days including one setup day. Access begins at 07:00 and ends at 23:00 on each day.",
      "2. AUDIO VISUAL. The in-house AV rig is included. An additional surcharge applies to external rigging unless the agreement is countersigned before the stated deadline.",
      "3. CANCELLATION. Cancellation within fourteen days of the hire period forfeits the deposit in full.",
      "4. INSURANCE. The Hirer must maintain public liability cover for the duration of the hire period and provide evidence on request.",
    ].join("\n\n"),
  },
  doc_003: {
    documentId: "doc_003",
    pageCount: null,
    extractedAt: stamp(-5),
    text: "Tier,Price,Benefits\nPlatinum,5000,Main stage branding; 6 passes; expo booth\nGold,2500,Expo booth; 4 passes\nSilver,1000,2 passes; logo on programme",
  },
};

/** SAMPLE structured extraction — hand-written, not model output. */
export const MOCK_INTELLIGENCE: Record<string, DocumentIntelligence> = {
  doc_001: {
    documentId: "doc_001",
    summary:
      "A three-day hire agreement for Innovation Hall. In-house AV is included, but external rigging carries a surcharge unless countersigned before the deadline. Cancellation inside fourteen days forfeits the deposit.",
    keyPoints: [
      "Access runs 07:00–23:00 across three days including setup.",
      "External AV rigging incurs a surcharge unless countersigned in time.",
      "Cancellation within 14 days forfeits the deposit in full.",
      "Public liability insurance must be maintained for the hire period.",
    ],
    importantDates: [{ label: "Countersign deadline", iso: isoFromToday(2, 17) }],
    generatedAt: stamp(-8),
  },
  doc_003: {
    documentId: "doc_003",
    summary: "Sponsorship tier grid listing three tiers with pricing and benefits.",
    keyPoints: ["Three tiers: Platinum, Gold, Silver.", "Platinum includes main stage branding."],
    importantDates: [],
    generatedAt: stamp(-5),
  },
};

/** Relations the "backend" explicitly stores. */
export const MOCK_RELATIONS: Record<string, DocumentRelations> = {
  doc_001: { relatedTaskIds: ["tsk_001"], relatedMeetingIds: ["mtg_001"] },
  doc_003: { relatedTaskIds: ["tsk_002"], relatedMeetingIds: ["mtg_002"] },
};

export function getInitialDocuments(eventId: string): ClubDocument[] {
  return structuredClone(MOCK_DOCUMENTS_BY_EVENT[eventId] ?? []);
}
