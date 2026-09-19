import { Link } from "react-router-dom";
import { Badge, EmptyState } from "@/components/ui";
import { MODULE_META, modulePath } from "@/lib/dashboardModules";
import { compareByDueDate, dueBucket, dueBucketHeading } from "@/lib/format";
import type { UpcomingDeadline } from "@/types/dashboard";

const BUCKET_TONE = {
  overdue: "danger",
  today: "warning",
  tomorrow: "brand",
  "due-soon": "neutral",
  future: "neutral",
} as const;

const BUCKET_ORDER = {
  overdue: 0,
  today: 1,
  tomorrow: 2,
  "due-soon": 3,
  future: 4,
} as const;

/**
 * Upcoming deadlines — answers "What deadlines are approaching?".
 * Deadlines are grouped under a bucket heading (TODAY / TOMORROW / 25 SEP)
 * and sorted by real date, most urgent first.
 */
export function UpcomingDeadlines({
  eventId,
  deadlines,
}: {
  eventId: string;
  deadlines: UpcomingDeadline[];
}) {
  if (deadlines.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          title="No upcoming deadlines"
          description="Deadlines from tasks, documents and meetings are collected here."
        />
      </div>
    );
  }

  const sorted = [...deadlines].sort((a, b) => {
    const byBucket = BUCKET_ORDER[dueBucket(a.dueIso)] - BUCKET_ORDER[dueBucket(b.dueIso)];
    if (byBucket !== 0) return byBucket;
    return compareByDueDate(a.dueIso, b.dueIso);
  });

  // Group consecutive deadlines that share the same bucket heading.
  const groups: Array<{ heading: string; tone: keyof typeof BUCKET_TONE; items: UpcomingDeadline[] }> = [];
  for (const deadline of sorted) {
    const bucket = dueBucket(deadline.dueIso);
    const heading = dueBucketHeading(deadline.dueIso);
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) {
      last.items.push(deadline);
    } else {
      groups.push({ heading, tone: bucket, items: [deadline] });
    }
  }

  return (
    <div className="scrollbar-slim max-h-[26rem] divide-y divide-line overflow-y-auto">
      {groups.map((group) => (
        <section key={group.heading} className="px-5 py-3">
          <h3 className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-fg-subtle uppercase">
              {group.heading}
            </span>
            <Badge tone={BUCKET_TONE[group.tone]} variant="outline">
              {group.items.length}
            </Badge>
          </h3>

          <ul className="space-y-1">
            {group.items.map((deadline) => {
              const module = MODULE_META[deadline.moduleId];
              const bucket = dueBucket(deadline.dueIso);
              return (
                <li
                  key={deadline.id}
                  className="flex items-center justify-between gap-3 rounded-control px-2 py-1.5 transition-colors hover:bg-surface-subtle"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-fg">{deadline.title}</p>
                    <p className="truncate text-xs text-fg-subtle">
                      {deadline.owner} ·{" "}
                      <Link
                        to={modulePath(eventId, deadline.moduleId)}
                        className="rounded-sm text-brand underline-offset-4 hover:underline"
                      >
                        {module.label}
                      </Link>
                    </p>
                  </div>

                  <span
                    aria-hidden
                    className={
                      bucket === "overdue"
                        ? "h-2 w-2 shrink-0 rounded-full bg-danger"
                        : bucket === "today"
                          ? "h-2 w-2 shrink-0 rounded-full bg-warning"
                          : "h-2 w-2 shrink-0 rounded-full bg-line-strong"
                    }
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
