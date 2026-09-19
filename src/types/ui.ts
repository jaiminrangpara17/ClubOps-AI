import type { ComponentType, SVGProps } from "react";

/** Icon contract used across the design system (lucide-react compatible). */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/** Shared control sizing scale. */
export type ControlSize = "sm" | "md" | "lg";

/** Semantic meaning applied to badges, statuses and feedback surfaces. */
export type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

/** Operational status vocabulary shared by future ClubOps modules. */
export type StatusKind =
  | "draft"
  | "planned"
  | "active"
  | "blocked"
  | "at-risk"
  | "complete"
  | "cancelled";

/** Theme modes supported by the shell. */
export type ThemeMode = "light" | "dark";
