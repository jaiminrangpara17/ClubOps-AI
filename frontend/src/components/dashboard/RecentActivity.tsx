import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui";
import { MODULE_META, modulePath } from "@/lib/dashboardModules";
import type { RecentActivityItem } from "@/types/dashboard";

/** Compact activity feed. Renders only what the activity API returns. */
export function RecentActivityList({
  eventId,
  activity,
}: {
  eventId: string;
  activity: RecentActivityItem[];
}) {
  if (activity.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          title="No recent activity"
          description="Completions, assignments and system events for this event will appear here."
        />
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {activity.map((entry) => {
        const module = MODULE_META[entry.moduleId];
        const Icon = module.icon;
        const isSystem = entry.actor === "System";

        return (
          <li
            key={entry.id}
            className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-subtle"
          >
            <span
              className={
                isSystem
                  ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-inset text-fg-subtle"
                  : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand-soft-fg"
              }
              aria-hidden
            >
              {isSystem ? <Icon width={13} height={13} /> : entry.actor.slice(0, 2).toUpperCase()}
            </span>

            <p className="min-w-0 flex-1 truncate text-sm text-fg-muted">
              <span className="font-medium text-fg">{entry.actor}</span> {entry.action}{" "}
              <Link
                to={modulePath(eventId, entry.moduleId)}
                className="rounded-sm font-medium text-brand underline-offset-4 hover:underline"
              >
                {entry.target}
              </Link>
            </p>

            <span className="shrink-0 text-[11px] text-fg-subtle">{entry.timeLabel}</span>
          </li>
        );
      })}
    </ul>
  );
}
