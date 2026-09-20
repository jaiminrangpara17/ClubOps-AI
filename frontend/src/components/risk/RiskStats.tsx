import { AlertTriangle, CheckCircle2, CircleDotDashed, ShieldAlert, ShieldX } from "lucide-react";
import { StatCard } from "@/components/ui";
import type { RiskStats as RiskStatsData } from "@/types";

export function RiskStats({ stats }: { stats: RiskStatsData }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Total risks" value={stats.total} hint="In this event" icon={ShieldAlert} tone="brand" />
      <StatCard label="Critical" value={stats.critical} hint="Immediate attention" icon={ShieldX} tone="danger" />
      <StatCard label="High" value={stats.high} hint="Priority mitigation" icon={AlertTriangle} tone="warning" />
      <StatCard label="Open" value={stats.open} hint="Open or monitoring" icon={CircleDotDashed} tone="info" />
      <StatCard label="Mitigated" value={stats.mitigated} hint="Mitigation in place" icon={CheckCircle2} tone="success" />
    </div>
  );
}