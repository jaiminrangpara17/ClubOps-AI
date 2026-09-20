import { Link } from "react-router-dom";
import { Card, Skeleton } from "@/components/ui";
import { MODULE_META, modulePath } from "@/lib/dashboardModules";
import type { DashboardStat } from "@/types/dashboard";

const INDICATOR_TONE: Record<DashboardStat["indicator"], { chip: string; bar: string }> = {
  success: { chip: "bg-success-soft text-success", bar: "bg-success" },
  warning: { chip: "bg-warning-soft text-warning", bar: "bg-warning" },
  danger: { chip: "bg-danger-soft text-danger", bar: "bg-danger" },
  info: { chip: "bg-info-soft text-info", bar: "bg-info" },
  neutral: { chip: "bg-neutral-soft text-fg-muted", bar: "bg-neutral" },
};

function StatTile({ eventId, stat }: { eventId: string; stat: DashboardStat }) {
  const module = MODULE_META[stat.moduleId];
  const Icon = module.icon;

  return (
    <Link
      to={modulePath(eventId, stat.moduleId)}
      className="group block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <Card
        padding="md"
        interactive
        className="flex h-full flex-col gap-3 transition-colors group-hover:border-brand/40"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium tracking-wide text-fg-muted uppercase">{stat.label}</p>
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-control ${INDICATOR_TONE[stat.indicator]}`}
          >
            <Icon width={16} height={16} aria-hidden />
          </span>
        </div>

        <p className="text-2xl font-semibold tracking-tight text-fg tabular-nums">{stat.value}</p>

        <p className="mt-auto text-xs text-fg-subtle">{stat.secondary}</p>
      </Card>
    </Link>
  );
}

export interface OverviewStatsProps {
  eventId: string | null;
  stats: DashboardStat[];
  isLoading: boolean;
}

/** Overview statistics strip — answers "How much progress has been made?". */
export function OverviewStats({ eventId, stats, isLoading }: OverviewStatsProps) {
  if (isLoading && stats.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} padding="md" className="space-y-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-24" />
          </Card>
        ))}
      </div>
    );
  }

  if (!eventId || stats.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} padding="md" className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-fg-subtle uppercase">
              No data yet
            </p>
            <p className="text-2xl font-semibold text-fg-subtle">—</p>
            <p className="text-xs text-fg-subtle">Available once the event is active.</p>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatTile key={stat.id} eventId={eventId} stat={stat} />
      ))}
    </div>
  );
}
