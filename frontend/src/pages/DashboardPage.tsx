import { Bot, CalendarClock, Flag, ShieldAlert, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import { EventContextHeader } from "@/components/layout";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/ui";
import { useEventContext } from "@/context/EventContext";
import {
  DEMO_BRIEFING_POINTS,
  DEMO_DEADLINES,
  DEMO_PRIORITIES,
  DEMO_RISKS,
  DEMO_STATS,
} from "@/data/demoDashboard";
import { formatDueLabel } from "@/lib/format";
import { SEVERITY_LABEL, SEVERITY_TONE } from "@/lib/status";

const SECTION_LINK =
  "text-xs font-medium text-brand underline-offset-4 hover:underline";

export default function DashboardPage() {
  const { currentEvent, currentEventId } = useEventContext();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Dashboard"
        description="Overview of your club's active operations."
        meta={<Badge tone="warning">Preview data</Badge>}
        actions={
          <>
            <Button variant="outline" disabled title="Available once the API is connected">
              Export summary
            </Button>
            <Button leadingIcon={Sparkles} disabled title="AI briefing ships in a later release">
              Generate briefing
            </Button>
          </>
        }
      />

      <PreviewNotice>
        <span className="font-medium text-fg">Dashboard preview.</span> Layout and hierarchy for the
        next phase — all figures below are temporary sample values, not backend data.
      </PreviewNotice>

      <EventContextHeader event={currentEvent} variant="card" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DEMO_STATS.map((stat) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            hint={stat.hint}
            icon={stat.icon}
            tone={stat.tone}
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader
              actions={
                <Link to={`/events/${currentEventId}/tasks`} className={SECTION_LINK}>
                  View tasks
                </Link>
              }
            >
              <CardTitle className="flex items-center gap-2">
                <CalendarClock width={15} height={15} aria-hidden className="text-fg-subtle" />
                Upcoming deadlines
              </CardTitle>
            </CardHeader>
            <CardContent padding="none">
              <ul className="divide-y divide-line">
                {DEMO_DEADLINES.map((deadline) => (
                  <li
                    key={deadline.id}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">{deadline.title}</p>
                      <p className="mt-0.5 text-xs text-fg-subtle">
                        {deadline.module} · {deadline.owner}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-fg-muted">{formatDueLabel(deadline.dueIso)}</span>
                      <StatusBadge status={deadline.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              actions={
                <Link to={`/events/${currentEventId}/tasks`} className={SECTION_LINK}>
                  Open board
                </Link>
              }
            >
              <CardTitle className="flex items-center gap-2">
                <Flag width={15} height={15} aria-hidden className="text-fg-subtle" />
                Today&apos;s priorities
              </CardTitle>
            </CardHeader>
            <CardContent padding="none">
              <ul className="divide-y divide-line">
                {DEMO_PRIORITIES.map((priority) => (
                  <li key={priority.id} className="flex items-start gap-3 px-5 py-3.5">
                    <span
                      aria-hidden
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand"
                      style={{ opacity: priority.priority === "low" ? 0.4 : 1 }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg">{priority.title}</p>
                      <p className="mt-0.5 text-xs text-fg-subtle">
                        {priority.context} · {priority.owner}
                      </p>
                    </div>
                    <Badge tone={SEVERITY_TONE[priority.priority]}>
                      {SEVERITY_LABEL[priority.priority]}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader
              actions={
                <Link to={`/events/${currentEventId}/risks`} className={SECTION_LINK}>
                  All risks
                </Link>
              }
            >
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert width={15} height={15} aria-hidden className="text-fg-subtle" />
                Active risks
              </CardTitle>
            </CardHeader>
            <CardContent padding="none">
              <ul className="divide-y divide-line">
                {DEMO_RISKS.map((risk) => (
                  <li key={risk.id} className="space-y-1.5 px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-fg">{risk.title}</p>
                      <Badge tone={SEVERITY_TONE[risk.severity]} dot>
                        {SEVERITY_LABEL[risk.severity]}
                      </Badge>
                    </div>
                    <p className="text-xs text-fg-subtle">
                      {risk.area} · {risk.mitigation}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card variant="subtle">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot width={15} height={15} aria-hidden className="text-fg-subtle" />
                AI briefing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-fg-subtle">
                Placeholder copy — the copilot is not connected yet.
              </p>
              <ul className="mt-3 space-y-2.5">
                {DEMO_BRIEFING_POINTS.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm text-fg-muted">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                leadingIcon={Sparkles}
                disabled
                title="Connects to the AI service in a later release"
              >
                Refresh briefing
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
