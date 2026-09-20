import { FileText, Megaphone, ShieldAlert, SquareCheckBig, Users, Video } from "lucide-react";
import type { IconComponent } from "@/types";
import type { DashboardModuleId } from "@/types/dashboard";

/** Presentation metadata for dashboard modules (icons + deep links). */
export const MODULE_META: Record<
  DashboardModuleId,
  { label: string; icon: IconComponent; path: string }
> = {
  tasks: { label: "Tasks", icon: SquareCheckBig, path: "tasks" },
  volunteers: { label: "Volunteers", icon: Users, path: "volunteers" },
  meetings: { label: "Meetings", icon: Video, path: "meetings" },
  documents: { label: "Documents", icon: FileText, path: "documents" },
  risks: { label: "Risks", icon: ShieldAlert, path: "risks" },
  announcements: { label: "Announcements", icon: Megaphone, path: "announcements" },
};

/** Absolute route for a module of a given event. */
export function modulePath(eventId: string, moduleId: DashboardModuleId): string {
  return `/events/${eventId}/${MODULE_META[moduleId].path}`;
}
