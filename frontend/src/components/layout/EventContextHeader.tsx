import { CalendarDays, MapPin, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge, Card, Progress, StatusBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatCountdown, formatDateRange } from "@/lib/format";
import type { ClubEvent, IconComponent } from "@/types";

function MetaItem({ icon: Icon, children }: { icon: IconComponent; children: ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-xs text-fg-muted">
      <Icon width={14} height={14} aria-hidden className="shrink-0 text-fg-subtle" />
      <span className="truncate">{children}</span>
    </span>
  );
}

export interface EventContextHeaderProps {
  event: ClubEvent;
  /** `page` is the event route header (h1); `card` embeds it on the dashboard. */
  variant?: "page" | "card";
  actions?: ReactNode;
  className?: string;
}

/** Shared presentation of the event the workspace is operating on. */
export function EventContextHeader({
  event,
  variant = "page",
  actions,
  className,
}: EventContextHeaderProps) {
  const Title = variant === "page" ? "h1" : "h2";

  const body = (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <Title
            className={cn(
              "text-fg",
              variant === "page" ? "text-xl font-semibold sm:text-2xl" : "text-base font-semibold",
            )}
          >
            {event.name}
          </Title>
          <Badge tone="neutral" variant="outline" className="font-mono">
            {event.code}
          </Badge>
          <StatusBadge status={event.status} />
        </div>

        <p className="max-w-2xl text-sm text-fg-muted">{event.summary}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <MetaItem icon={CalendarDays}>
            {formatDateRange(event.startIso, event.endIso)} · {formatCountdown(event.startIso)}
          </MetaItem>
          <MetaItem icon={MapPin}>{event.venue}</MetaItem>
          <MetaItem icon={Users}>
            {event.attendeesExpected.toLocaleString()} expected · {event.teamSize} crew
          </MetaItem>
        </div>
      </div>

      <div className="w-full shrink-0 space-y-3 lg:w-64">
        <Progress value={event.readiness} label="Event readiness" showValue />
        {(actions || variant === "card") && (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            {variant === "card" && (
              <Link
                to={`/events/${event.id}`}
                className="inline-flex h-8 items-center rounded-control border border-line-strong bg-surface px-3 text-xs font-medium text-fg shadow-xs transition-colors hover:bg-surface-inset"
              >
                Open event workspace
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (variant === "card") {
    return (
      <Card padding="md" className={className}>
        {body}
      </Card>
    );
  }

  return <section className={cn("border-b border-line pb-5", className)}>{body}</section>;
}
