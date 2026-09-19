/**
 * Task stats summary — compact operational snapshot.
 *
 * Renders small stat cards for total, open, overdue, blocked, completed.
 * Designed to fit in the page header's meta area.
 */
import { AlertCircle, CheckCircle2, CircleDashed, ListChecks, SquareCheckBig } from "lucide-react";
import { StatCard } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { TaskStats } from "@/types";

export interface TaskStatsProps {
  stats: TaskStats;
  isLoading?: boolean;
  className?: string;
}

export function TaskStats({ stats, isLoading = false, className }: TaskStatsProps) {
  if (isLoading) {
    return (
      <div className={cn("grid gap-3 sm:grid-cols-3 lg:grid-cols-5", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-control bg-surface-inset"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-3 lg:grid-cols-5", className)}>
      <StatCard
        label="Total"
        value={stats.total}
        icon={ListChecks}
        tone="neutral"
        hint="All tasks"
      />
      <StatCard
        label="Open"
        value={stats.open + stats.inProgress}
        icon={CircleDashed}
        tone="brand"
        hint={`${stats.open} to do · ${stats.inProgress} in progress`}
      />
      <StatCard
        label="Overdue"
        value={stats.overdue}
        icon={AlertCircle}
        tone="danger"
        hint={stats.overdue > 0 ? "Needs attention" : "On track"}
      />
      <StatCard
        label="Blocked"
        value={stats.blocked}
        icon={SquareCheckBig}
        tone="warning"
        hint={stats.blocked > 0 ? "Waiting on dependencies" : "No blockers"}
      />
      <StatCard
        label="Completed"
        value={stats.completed}
        icon={CheckCircle2}
        tone="success"
        hint={stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}% done` : "No tasks"}
      />
    </div>
  );
}
