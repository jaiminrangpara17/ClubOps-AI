import {
  Bot,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldAlert,
  SquareCheckBig,
  Users,
  Video,
} from "lucide-react";
import type { NavItemConfig, NavSection, NavSectionId } from "@/types";

export const NAV_SECTIONS: NavSection[] = [
  { id: "workspace", label: "Workspace" },
  { id: "operations", label: "Operations" },
  { id: "intelligence", label: "Intelligence" },
  { id: "system", label: "System" },
];

/** Event overview tab — not shown in the sidebar, only in the event tab bar. */
export const EVENT_OVERVIEW_ITEM: NavItemConfig = {
  id: "overview",
  label: "Overview",
  description: "Operational snapshot for the selected event.",
  icon: LayoutDashboard,
  scope: "event",
  path: "",
};

export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Overview of your club's active operations.",
    icon: LayoutDashboard,
    scope: "global",
    path: "/dashboard",
    section: "workspace",
  },
  {
    id: "events",
    label: "Events",
    description: "Plan and manage your club events.",
    icon: CalendarDays,
    scope: "global",
    path: "/events",
    section: "workspace",
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Manage responsibilities, deadlines and task progress.",
    icon: SquareCheckBig,
    scope: "event",
    path: "tasks",
    section: "workspace",
  },
  {
    id: "volunteers",
    label: "Volunteers",
    description: "Coordinate volunteer rosters, roles and shift coverage.",
    icon: Users,
    scope: "event",
    path: "volunteers",
    section: "workspace",
  },
  {
    id: "meetings",
    label: "Meetings",
    description: "Schedule meetings and keep agendas, minutes and follow-ups together.",
    icon: Video,
    scope: "event",
    path: "meetings",
    section: "workspace",
  },
  {
    id: "documents",
    label: "Documents",
    description: "Store permits, contracts, run sheets and policies in one library.",
    icon: FileText,
    scope: "event",
    path: "documents",
    section: "workspace",
  },
  {
    id: "risks",
    label: "Risks",
    description: "Track operational risks, their severity and mitigation owners.",
    icon: ShieldAlert,
    scope: "event",
    path: "risks",
    section: "operations",
  },
  {
    id: "announcements",
    label: "Announcements",
    description: "Publish updates to members, volunteers and stakeholders.",
    icon: Megaphone,
    scope: "event",
    path: "announcements",
    section: "operations",
  },
  {
    id: "ai",
    label: "AI Copilot",
    description: "Ask questions and draft operational work from your event data.",
    icon: Bot,
    scope: "event",
    path: "ai",
    section: "intelligence",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Workspace preferences, members and integrations.",
    icon: Settings,
    scope: "global",
    path: "/settings",
    section: "system",
  },
];

/** Tabs rendered inside an event: overview followed by every event module. */
export const EVENT_TABS: NavItemConfig[] = [
  EVENT_OVERVIEW_ITEM,
  ...NAV_ITEMS.filter((item) => item.scope === "event"),
];

export function getNavItemsBySection(section: NavSectionId): NavItemConfig[] {
  return NAV_ITEMS.filter((item) => item.section === section);
}

export function getNavItem(id: string): NavItemConfig | undefined {
  return [...NAV_ITEMS, EVENT_OVERVIEW_ITEM].find((item) => item.id === id);
}

/** Builds the concrete URL for a navigation item. */
export function resolveNavPath(item: NavItemConfig, eventId: string): string {
  if (item.scope === "global") return item.path;
  return item.path ? `/events/${eventId}/${item.path}` : `/events/${eventId}`;
}

/**
 * Active-state matching.
 * `/events/:id` keeps "Events" active, while `/events/:id/tasks` activates
 * the "Tasks" item regardless of which event is selected.
 */
export function isNavItemActive(item: NavItemConfig, pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);

  if (item.scope === "event") {
    if (segments[0] !== "events" || segments.length < 2) return false;
    if (item.path === "") return segments.length === 2;
    return segments.length >= 3 && segments[2] === item.path;
  }

  if (item.path === "/events") {
    return segments[0] === "events" && segments.length <= 2;
  }

  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}
