import type { IconComponent, StatusKind, Tone } from "./ui";

/**
 * Shapes used by the temporary preview/demo content that powers the shell
 * while the API is not yet connected. Kept separate from domain types so the
 * preview layer can be deleted in one step.
 */

export type Severity = "high" | "medium" | "low";

export interface PreviewStat {
  id: string;
  label: string;
  value: string;
  hint: string;
  icon: IconComponent;
  tone: Tone;
  trend?: { direction: "up" | "down" | "flat"; label: string; tone: Tone };
}

export interface PreviewDeadline {
  id: string;
  title: string;
  module: string;
  owner: string;
  dueIso: string;
  status: StatusKind;
}

export interface PreviewPriority {
  id: string;
  title: string;
  context: string;
  owner: string;
  priority: Severity;
}

export interface PreviewRisk {
  id: string;
  title: string;
  area: string;
  severity: Severity;
  mitigation: string;
}

export interface PreviewNotification {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
  tone: Tone;
}
