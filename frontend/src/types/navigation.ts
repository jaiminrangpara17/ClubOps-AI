import type { IconComponent } from "./ui";

export interface NavItem {
  /** Stable identifier, also used as React key. */
  id: string;
  label: string;
  /** Router path. Placeholder routes are allowed during the foundation phase. */
  to: string;
  icon: IconComponent;
  /** Grouping label rendered as a section heading in the sidebar. */
  section: NavSection;
}

export type NavSection = "Operations" | "Program" | "Governance" | "Intelligence";
