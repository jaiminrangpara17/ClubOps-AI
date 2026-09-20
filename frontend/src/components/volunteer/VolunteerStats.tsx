import { AlertTriangle, CheckCircle2, UserCheck, Users } from "lucide-react";
import { StatCard } from "@/components/ui";
import type { VolunteerStats as VolunteerStatsData } from "@/types";

export function VolunteerStats({ stats }: { stats: VolunteerStatsData }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total volunteers" value={stats.total} hint="Event participants" icon={Users} tone="brand" />
      <StatCard label="Assigned" value={stats.assigned} hint="At least one task" icon={UserCheck} tone="info" />
      <StatCard label="Available" value={stats.available} hint="Ready for work" icon={CheckCircle2} tone="success" />
      <StatCard label="At capacity" value={stats.atCapacity} hint="High or overloaded" icon={AlertTriangle} tone="warning" />
    </div>
  );
}