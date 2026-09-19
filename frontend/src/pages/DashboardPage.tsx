import { useState } from "react";
import {
  Bot,
  CalendarClock,
  Check,
  Copy,
  Download,
  Flag,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
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
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [briefingPoints, setBriefingPoints] = useState<string[]>(DEMO_BRIEFING_POINTS);
  const [copied, setCopied] = useState(false);

  const handleRefreshBriefing = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setBriefingPoints([
        `Event readiness index for ${currentEvent.name} is currently holding at ${currentEvent.readiness}%.`,
        "Volunteer coverage improved to 80% — registration and expo desks remain the two gaps.",
        "Two documents block the finance sign-off; both sit with the venue liaison.",
        "Day-1 morning registration staffing remains the highest priority operational risk.",
      ]);
      setIsGenerating(false);
    }, 600);
  };

  const handleCopyBriefing = () => {
    const text = briefingPoints.map((p) => `• ${p}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportSummary = () => {
    const summaryData = {
      event: currentEvent.name,
      code: currentEvent.code,
      venue: currentEvent.venue,
      readiness: currentEvent.readiness,
      stats: DEMO_STATS.map((s) => ({ label: s.label, value: s.value })),
      briefing: briefingPoints,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(summaryData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentEvent.code}-operations-summary.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Dashboard"
        description="Overview of your club's active operations."
        meta={<Badge tone="brand">Live Operations</Badge>}
        actions={
          <>
            <Button
              variant="outline"
              leadingIcon={Download}
              onClick={handleExportSummary}
              title="Export operational summary as JSON"
            >
              Export summary
            </Button>
            <Button
              leadingIcon={Sparkles}
              onClick={() => {
                handleRefreshBriefing();
                setIsBriefingModalOpen(true);
              }}
              title="Generate comprehensive AI operational briefing"
            >
              Generate briefing
            </Button>
          </>
        }
      />

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
                  View all deadlines →
                </Link>
              }
            >
              <CardTitle className="flex items-center gap-2">
                <CalendarClock width={15} height={15} aria-hidden className="text-fg-subtle" />
                Upcoming deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-line">
                {DEMO_DEADLINES.map((item) => {
                  const due = formatDueLabel(item.dueIso);
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{item.title}</p>
                        <p className="text-xs text-fg-subtle">
                          {item.module} · {item.owner}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-fg-muted">{due.label}</span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              actions={
                <Link to={`/events/${currentEventId}/tasks`} className={SECTION_LINK}>
                  Open tasks →
                </Link>
              }
            >
              <CardTitle className="flex items-center gap-2">
                <Flag width={15} height={15} aria-hidden className="text-fg-subtle" />
                Priority actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-line">
                {DEMO_PRIORITIES.map((priority) => (
                  <li
                    key={priority.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{priority.title}</p>
                      <p className="text-xs text-fg-subtle">
                        {priority.context} · {priority.owner}
                      </p>
                    </div>
                    <Badge
                      tone={
                        priority.priority === "high"
                          ? "danger"
                          : priority.priority === "medium"
                          ? "warning"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {priority.priority}
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
                  Risk register →
                </Link>
              }
            >
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert width={15} height={15} aria-hidden className="text-fg-subtle" />
                Critical risks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-line">
                {DEMO_RISKS.map((risk) => (
                  <li key={risk.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-fg">{risk.title}</span>
                      <Badge tone={SEVERITY_TONE[risk.severity]} dot size="sm">
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
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bot width={15} height={15} aria-hidden className="text-brand" />
                  AI Executive Briefing
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-fg-subtle">
                Real-time operational summary synthesized from active modules:
              </p>
              <ul className="mt-3 space-y-2.5">
                {briefingPoints.map((point, index) => (
                  <li key={index} className="flex gap-2.5 text-xs text-fg leading-relaxed">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  leadingIcon={Sparkles}
                  disabled={isGenerating}
                  onClick={handleRefreshBriefing}
                >
                  {isGenerating ? "Synthesizing..." : "Refresh briefing"}
                </Button>
                <Link to={`/events/${currentEventId}/ai`}>
                  <Button size="sm" variant="subtle" title="Open Copilot">
                    Chat
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full AI Briefing Modal */}
      {isBriefingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white shadow-xs">
                  <Sparkles width={16} height={16} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-fg">AI Executive Briefing</h3>
                  <p className="text-xs text-fg-subtle">{currentEvent.name} ({currentEvent.code})</p>
                </div>
              </div>
              <button
                onClick={() => setIsBriefingModalOpen(false)}
                className="text-fg-subtle hover:text-fg p-1 rounded-lg hover:bg-surface-subtle"
              >
                <X width={18} height={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl border border-line bg-surface-subtle p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-fg">
                  <span>Current Readiness Assessment</span>
                  <span className="text-emerald-600 font-bold">{currentEvent.readiness}% Target</span>
                </div>
                <p className="text-fg-muted leading-relaxed">
                  Preparation is advancing steadily. Active bottleneck analysis indicates venue certification and registration desk staffing require coordinator attention within 48 hours.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-fg text-xs uppercase tracking-wider text-fg-subtle">
                  Synthesized Operational Bulletins
                </h4>
                <ul className="space-y-2">
                  {briefingPoints.map((point, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 rounded-lg border border-line/60 bg-surface p-2.5 text-xs text-fg shadow-2xs"
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-line mt-6">
                <button
                  onClick={handleCopyBriefing}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted hover:text-fg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check width={14} height={14} className="text-emerald-500" />
                      <span className="text-emerald-600 font-semibold">Copied to clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy width={14} height={14} />
                      <span>Copy Briefing</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <Link to={`/events/${currentEventId}/ai`}>
                    <Button size="sm" variant="outline" onClick={() => setIsBriefingModalOpen(false)}>
                      Open in Copilot
                    </Button>
                  </Link>
                  <Button size="sm" onClick={() => setIsBriefingModalOpen(false)}>
                    Done
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
