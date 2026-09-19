import { ArrowRight, CalendarDays, MapPin, Plus, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import {
  Badge,
  Button,
  Card,
  Input,
  PageHeader,
  Progress,
  StatusBadge,
} from "@/components/ui";
import { useEventContext } from "@/context/EventContext";
import { formatCountdown, formatDateRange } from "@/lib/format";
import type { ClubEvent, IconComponent } from "@/types";

function Meta({ icon: Icon, children }: { icon: IconComponent; children: ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-xs text-fg-muted">
      <Icon width={13} height={13} aria-hidden className="shrink-0 text-fg-subtle" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function EventCard({ event }: { event: ClubEvent }) {
  return (
    <Card interactive padding="md" className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-fg">{event.name}</h3>
            <Badge tone="neutral" variant="outline" className="font-mono">
              {event.code}
            </Badge>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm text-fg-muted">{event.summary}</p>
        </div>
        <StatusBadge status={event.status} />
      </div>

      <div className="space-y-1.5">
        <Meta icon={CalendarDays}>
          {formatDateRange(event.startIso, event.endIso)} · {formatCountdown(event.startIso)}
        </Meta>
        <Meta icon={MapPin}>{event.venue}</Meta>
        <Meta icon={Users}>
          {event.attendeesExpected.toLocaleString()} expected · {event.teamSize} crew
        </Meta>
      </div>

      <div className="mt-auto space-y-3">
        <Progress value={event.readiness} label="Readiness" showValue size="sm" />
        <Link
          to={`/events/${event.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand underline-offset-4 hover:underline"
        >
          Open workspace
          <ArrowRight width={13} height={13} aria-hidden />
        </Link>
      </div>
    </Card>
  );
}

export default function EventsPage() {
  const { events } = useEventContext();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Events"
        description="Plan and manage your club events."
        meta={
          <>
            <Badge tone="brand">{events.length} events</Badge>
            <Badge tone="warning">Preview data</Badge>
          </>
        }
        actions={
          <Button leadingIcon={Plus} disabled title="Event creation ships with the events module">
            New event
          </Button>
        }
      />

      <PreviewNotice />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          containerClassName="sm:max-w-xs"
          placeholder="Filter events…"
          aria-label="Filter events (preview)"
          disabled
        />
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" tone="neutral">
            All
          </Badge>
          <Badge variant="outline" tone="brand">
            Active
          </Badge>
          <Badge variant="outline" tone="info">
            Planned
          </Badge>
          <Badge variant="outline" tone="neutral">
            Complete
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
