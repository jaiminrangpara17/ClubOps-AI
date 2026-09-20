import { Link } from "react-router-dom";
import { Badge, EmptyState, StatusBadge } from "@/components/ui";
import { MODULE_META, modulePath } from "@/lib/dashboardModules";
import { dueBucket, formatDueLabel } from "@/lib/format";
import { SEVERITY_LABEL, SEVERITY_TONE } from "@/lib/status";
import type { PriorityItem } from "@/types/dashboard";

const SEVERITY_WEIGHT = { high: 0, medium: 1, low: 2 } as const;

function sortPriorities(items: PriorityItem[]): PriorityItem[] {
  return [...items].sort((a, b) => {
    const bySeverity = SEVERITY_WEIGHT[a.priority] - SEVERITY_WEIGHT[b.priority];
    if (bySeverity !== 0) return bySeverity;
    return Date.parse(a.dueIso) - Date.parse(b.dueIso);
  });
}

export interface PriorityTasksProps {
  eventId: string;
  priorities: PriorityItem[];
}

/** Today's priorities — answers "What needs attention today?". */
export function PriorityTasks({ eventId, priorities }: PriorityTasksProps) {
  const sorted = sortPriorities(priorities);
  const highCount = sorted.filter((item) => item.priority === "high").length;

  if (sorted.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          title="Nothing urgent today"
          description="Items that need a decision today will surface here automatically."
        />
      </div>
    );
  }

  return (
    <div>
      {highCount > 0 && (
        <div className="flex items-center gap-2 border-b border-line bg-danger-soft/50 px-5 py-2.5">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-danger" />
          <p className="text-xs font-medium text-danger">
            {highCount} {highCount === 1 ? "item" : "items"} need urgent attention today
          </p>
        </div>
      )}

      <ul className="divide-y divide-line">
        {sorted.map((item) => {
          const module = MODULE_META[item.moduleId];
          const bucket = dueBucket(item.dueIso);

          return (
            <li
              key={item.id}
              className="flex flex-wrap items-start gap-x-3 gap-y-2 px-5 py-3.5 transition-colors hover:bg-surface-subtle"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium text-fg">{item.title}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
                  <span className="font-medium text-fg-muted">{item.owner}</span>
                  <span aria-hidden>·</span>
                  <span
                    className={
                      bucket === "overdue"
                        ? "font-medium text-danger"
                        : bucket === "today"
                          ? "font-medium text-warning"
                          : undefined
                    }
                  >
                    {formatDueLabel(item.dueIso)}
                  </span>
                  <span aria-hidden>·</span>
                  <Link
                    to={modulePath(eventId, item.moduleId)}
                    className="rounded-sm text-brand underline-offset-4 hover:underline"
                  >
                    {module.label}
                  </Link>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={item.status} />
                <Badge tone={SEVERITY_TONE[item.priority]} dot>
                  {SEVERITY_LABEL[item.priority]}
                </Badge>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
