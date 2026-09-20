import type { Tone } from "@/types";

/* =========================================================================
   TEMPORARY PREVIEW DATA — notification centre.
   No delivery backend exists yet; the list is illustrative only.
   ========================================================================= */

export interface DemoNotification {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
  tone: Tone;
}

export const DEMO_NOTIFICATIONS: DemoNotification[] = [
  {
    id: "n1",
    title: "Safety certificate due tomorrow",
    body: "Documents · TechFest 2026",
    timeLabel: "12m ago",
    tone: "warning",
  },
  {
    id: "n2",
    title: "8 volunteers joined the roster",
    body: "Volunteers · TechFest 2026",
    timeLabel: "2h ago",
    tone: "success",
  },
  {
    id: "n3",
    title: "Committee meeting moved to 18:00",
    body: "Meetings · TechFest 2026",
    timeLabel: "Yesterday",
    tone: "info",
  },
];
