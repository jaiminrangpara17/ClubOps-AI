import { ArrowRight, CalendarCheck2, Clock3, Target, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import { Card, CardContent, CardHeader, CardTitle, PageHeader, Progress, StatCard } from "@/components/ui";
import { useCurrentEvent } from "@/hooks/useCurrentEvent";
import { daysUntil, formatDate } from "@/lib/format";
import { NAV_ITEMS, resolveNavPath } from "@/lib/navigation";

const EVENT_MODULES = NAV_ITEMS.filter((item) => item.scope === "event");

function countdownValue(startIso: string): string {
  const days = daysUntil(startIso);
  if (days > 1) return `${days} days`;
  if (days === 1) return "Tomorrow";
  if (days === 0) return "Today";
  return "Finished";
}

export default function EventOverviewPage() {
  const event = useCurrentEvent();

  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        title="Overview"
        description="Operational snapshot for this event and quick access to every module."
        divider={false}
      />

      <PreviewNotice />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Readiness"
          value={`${event.readiness}%`}
          hint="Weighted across all modules"
          icon={Target}
          tone="success"
        />
        <StatCard
          label="Countdown"
          value={countdownValue(event.startIso)}
          hint={formatDate(event.startIso)}
          icon={Clock3}
          tone="brand"
        />
        <StatCard
          label="Crew assigned"
          value={event.teamSize ?? "—"}
          hint="Organisers and volunteers"
          icon={CalendarCheck2}
          tone="info"
        />
        <StatCard
          label="Expected attendees"
          value={event.attendeesExpected?.toLocaleString() ?? "—"}
          hint="Capacity planning baseline"
          icon={Users}
          tone="neutral"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Event modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {EVENT_MODULES.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.id}
                    to={resolveNavPath(module, event.id)}
                    className="group flex gap-3 rounded-control border border-line bg-surface p-3.5 transition-colors hover:border-brand/40 hover:bg-surface-inset"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand-soft-fg">
                      <Icon width={16} height={16} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-fg">
                        {module.label}
                        <ArrowRight
                          width={13}
                          height={13}
                          aria-hidden
                          className="text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </span>
                      <span className="mt-0.5 block text-xs text-fg-muted">{module.description}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card variant="subtle">
          <CardHeader>
            <CardTitle>Key dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { label: "Event starts", value: formatDate(event.startIso) },
                { label: "Event ends", value: formatDate(event.endIso) },
                { label: "Venue", value: event.venue },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-3">
                  <span className="text-xs text-fg-subtle">{row.label}</span>
                  <span className="text-right text-xs font-medium text-fg">{row.value}</span>
                </div>
              ))}
            </div>
            <Progress value={event.readiness} label="Readiness" showValue />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
