import { CalendarDays, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge, Card, StatusBadge } from "@/components/ui";
import type { IconComponent } from "@/types";
import type { DashboardSummary } from "@/types/dashboard";

function Meta({ icon: Icon, children }: { icon: IconComponent; children: ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-sm text-fg-muted">
      <Icon width={15} height={15} aria-hidden className="shrink-0 text-fg-subtle" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function daysLabel(days: number): string {
  if (days === 1) return "1 DAY REMAINING";
  return `${days} DAYS REMAINING`;
}

export interface DashboardHeaderProps {
  summary: DashboardSummary;
}

/**
 * Event context banner — answers "What event am I managing?".
 * All content comes from the summary payload; nothing is hardcoded.
 */
export function DashboardHeader({ summary }: DashboardHeaderProps) {
  const event = summary.event;
  if (!event) return null;

  const isActive = event.status === "active";
  const upcoming = event.daysRemaining !== null && event.daysRemaining > 0;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
              Command center
            </p>
            <Badge tone="neutral" variant="outline" className="font-mono">
              {event.code}
            </Badge>
          </div>

          <h1 className="truncate text-xl font-semibold tracking-tight text-fg sm:text-2xl">
            {event.name}
          </h1>
          <p className="max-w-2xl text-sm text-fg-muted">{event.description}</p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
            <Meta icon={CalendarDays}>{event.dateLabel}</Meta>
            <Meta icon={MapPin}>{event.venue}</Meta>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 border-t border-line pt-4 lg:items-end lg:border-t-0 lg:pt-0 lg:pl-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-fg-subtle">Status</span>
            <StatusBadge status={event.status} />
          </div>

          {upcoming && (
            <p
              className={
                isActive
                  ? "rounded-full bg-success-soft px-3 py-1 text-xs font-semibold tracking-wide text-success"
                  : "rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold tracking-wide text-brand-soft-fg"
              }
            >
              {daysLabel(event.daysRemaining!)}
            </p>
          )}

          <Link
            to={`/events/${event.id}`}
            className="text-xs font-medium text-brand underline-offset-4 hover:underline"
          >
            Open event workspace →
          </Link>
        </div>
      </div>
    </Card>
  );
}
