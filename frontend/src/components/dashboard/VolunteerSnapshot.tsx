import { Link } from "react-router-dom";
import { Avatar, Badge, Button, Progress } from "@/components/ui";
import { modulePath } from "@/lib/dashboardModules";
import { SEVERITY_LABEL, SEVERITY_TONE } from "@/lib/status";
import type { VolunteerSnapshot as VolunteerSnapshotData, VolunteerWorkload } from "@/types/dashboard";

const LOAD_TONE = {
  high: "danger",
  medium: "brand",
  low: "neutral",
} as const;

function WorkloadRow({ entry }: { entry: VolunteerWorkload }) {
  return (
    <li className="flex items-center gap-3">
      <Avatar name={entry.name} size="xs" tone="neutral" />
      <span className="w-16 shrink-0 truncate text-xs text-fg">{entry.name}</span>
      <span className="min-w-0 flex-1" aria-hidden>
        <Progress value={entry.loadPct} tone={LOAD_TONE[entry.level]} size="sm" />
      </span>
      <span className="w-14 shrink-0 text-right text-[11px] font-medium text-fg-muted tabular-nums">
        {entry.shiftCount} shift{entry.shiftCount === 1 ? "" : "s"}
      </span>
      <Badge tone={SEVERITY_TONE[entry.level]} variant="outline" className="hidden sm:inline-flex">
        {SEVERITY_LABEL[entry.level]}
      </Badge>
    </li>
  );
}

/**
 * Volunteer snapshot — answers "What is the volunteer situation?".
 * Workload is only rendered when the backend supplies it; otherwise a neutral
 * placeholder is shown rather than a client-side guess.
 */
export function VolunteerSnapshotPanel({
  eventId,
  snapshot,
}: {
  eventId: string;
  snapshot: VolunteerSnapshotData;
}) {
  const coverageTone =
    snapshot.coveragePct >= 85 ? "success" : snapshot.coveragePct >= 60 ? "brand" : "danger";

  const counters = [
    { label: "Assigned", value: snapshot.assigned, tone: "info" as const },
    { label: "Available", value: snapshot.available, tone: "success" as const },
    { label: "Overloaded", value: snapshot.overloaded, tone: "warning" as const },
  ];

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-fg-muted">Active volunteers</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight text-fg tabular-nums">
              {snapshot.active}
            </span>
          </p>
        </div>
        <div className="text-right">
          <Badge tone={coverageTone} dot>
            {snapshot.coveragePct}% coverage
          </Badge>
        </div>
      </div>

      <Progress value={snapshot.coveragePct} tone={coverageTone} />

      <div className="grid grid-cols-3 gap-3">
        {counters.map((counter) => (
          <div
            key={counter.label}
            className="rounded-control border border-line bg-surface-subtle px-3 py-2.5 text-center"
          >
            <p className="text-lg font-semibold text-fg tabular-nums">{counter.value}</p>
            <p className="mt-0.5 text-[11px] text-fg-subtle">{counter.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2.5 border-t border-line pt-4">
        <p className="text-xs font-semibold text-fg">Workload</p>
        {snapshot.workload === null ? (
          <p className="rounded-control border border-dashed border-line-strong bg-surface-subtle px-3 py-3 text-xs text-fg-muted">
            Workload is calculated by the backend and is not available for this event yet.
          </p>
        ) : snapshot.workload.length === 0 ? (
          <p className="text-xs text-fg-subtle">No volunteers assigned yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {snapshot.workload.map((entry) => (
              <WorkloadRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </div>

      <Link to={modulePath(eventId, "volunteers")} className="block">
        <Button variant="outline" size="sm" fullWidth>
          Open volunteer roster
        </Button>
      </Link>
    </div>
  );
}
