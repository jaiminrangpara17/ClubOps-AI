import type { IconComponent } from "./ui";

export type NavSectionId = "workspace" | "operations" | "intelligence" | "system";

export interface NavSection {
  id: NavSectionId;
  label: string;
}

/**
 * A navigation destination.
 * - `global` items have an absolute path (`/dashboard`).
 * - `event` items are resolved against the current event
 *   (`/events/:eventId/<path>`); an empty path is the event overview.
 */
export interface NavItemConfig {
  id: string;
  label: string;
  description: string;
  icon: IconComponent;
  scope: "global" | "event";
  path: string;
  section?: NavSectionId;
}

export interface BreadcrumbItem {
  label: string;
  to?: string;
}
