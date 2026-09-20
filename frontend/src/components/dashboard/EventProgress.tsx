import { Link } from "react-router-dom";
import { Progress } from "@/components/ui";
import { modulePath } from "@/lib/dashboardModules";
import type { EventProgress as EventProgressData } from "@/types/dashboard";

function tone(pct: number) {
  if (pct >= 85) return "success" as const;
  if (pct >= 50) return "brand" as const;
  return "warning" as const;
}

/**
 * Event progress — overall completion plus the three operational drivers.
 * Compact indicators only; no large chart.
 */
export function EventProgressPanel({
  eventId,
  progress,
}: {
  eventId: string;
  progress: EventProgressData;
}) {
  const rows = [
    { id: "tasks", label: "Tasks", pct: progress.tasksPct, moduleId: "tasks" as const },
    {
      id: "volunteers",
      label: "Volunteer assignment",
      pct: progress.volunteerAssignmentPct,
      moduleId: "volunteers" as const,
    },
    { id: "deadlines", label: "Deadlines", pct: progress.deadlinesPct, moduleId: "tasks" as const },
  ];

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="text-xs font-medium text-fg-muted">Overall</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight text-fg tabular-nums">
              {progress.overallPct}
            </span>
            <span className="text-sm text-fg-subtle">%</span>
          </p>
        </div>
        <div className="w-40 shrink-0 sm:w-48">
          <Progress value={progress.overallPct} tone={tone(progress.overallPct)} />
        </div>
      </div>

      <ul className="space-y-3.5">
        {rows.map((row) => (
          <li key={row.id} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <Link
                to={modulePath(eventId, row.moduleId)}
                className="rounded-sm text-sm text-fg-muted underline-offset-4 hover:text-brand hover:underline"
              >
                {row.label}
              </Link>
              <span className="text-xs font-medium text-fg tabular-nums">{row.pct}%</span>
            </div>
            <Progress value={row.pct} tone={tone(row.pct)} size="sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}
