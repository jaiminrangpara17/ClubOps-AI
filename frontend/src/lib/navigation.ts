import {
  Bot,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Megaphone,
  ShieldAlert,
  SquareCheckBig,
  Users,
  Video,
} from "lucide-react";
import type { NavItem, NavSection } from "@/types";

/**
 * Primary product navigation.
 * Destinations are registered in `src/routes` as placeholders during the
 * foundation phase; each module ships in a later commit.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", to: "/", icon: LayoutDashboard, section: "Operations" },
  { id: "events", label: "Events", to: "/events", icon: CalendarDays, section: "Operations" },
  { id: "tasks", label: "Tasks", to: "/tasks", icon: SquareCheckBig, section: "Operations" },
  { id: "volunteers", label: "Volunteers", to: "/volunteers", icon: Users, section: "Program" },
  { id: "meetings", label: "Meetings", to: "/meetings", icon: Video, section: "Program" },
  { id: "documents", label: "Documents", to: "/documents", icon: FileText, section: "Governance" },
  { id: "risks", label: "Risks", to: "/risks", icon: ShieldAlert, section: "Governance" },
  {
    id: "announcements",
    label: "Announcements",
    to: "/announcements",
    icon: Megaphone,
    section: "Governance",
  },
  { id: "copilot", label: "AI Copilot", to: "/copilot", icon: Bot, section: "Intelligence" },
];

export const NAV_SECTION_ORDER: NavSection[] = [
  "Operations",
  "Program",
  "Governance",
  "Intelligence",
];

export function getNavItemsBySection(section: NavSection): NavItem[] {
  return NAV_ITEMS.filter((item) => item.section === section);
}
