import { Bot, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Button } from "@/components/ui";
import type { AIDailyBrief } from "@/types/dashboard";

/**
 * AI daily brief — answers "What can ClubOps AI help me with?".
 *
 * The narrative is supplied entirely by the backend (`AIDailyBrief`). This
 * component only renders it; no text is generated client-side and nothing is
 * executed from here. `isMockData` keeps development data clearly labelled so
 * sample briefs can never be mistaken for live AI output.
 */
export function AIDailyBriefPanel({
  eventId,
  brief,
  isMockData,
}: {
  eventId: string;
  brief: AIDailyBrief;
  isMockData: boolean;
}) {
  const daysAway =
    brief.daysRemaining === null
      ? null
      : brief.daysRemaining === 0
        ? "today"
        : `${brief.daysRemaining} days away`;

  return (
    <div className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand-soft-fg">
          <Bot width={17} height={17} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
            ClubOps AI
            <Badge tone={isMockData ? "warning" : "neutral"} variant="outline">
              {isMockData ? "Sample brief" : "Generated"}
            </Badge>
          </p>
          <p className="text-xs text-fg-subtle">Your operational brief</p>
        </div>
      </div>

      <div className="space-y-3 rounded-card border border-line bg-surface-subtle p-4">
        <p className="text-sm text-fg">{brief.greeting}</p>

        {daysAway && (
          <p className="text-sm text-fg-muted">
            The event is <span className="font-medium text-fg">{daysAway}</span>.
          </p>
        )}

        {brief.headlineItems.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-fg-muted">
              Your highest-priority items today are:
            </p>
            <ul className="space-y-1">
              {brief.headlineItems.map((item, index) => (
                <li key={index} className="flex gap-2 text-sm text-fg-muted">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm text-fg-muted">
          There {brief.activeRiskCount === 1 ? "is" : "are"} currently{" "}
          <span className="font-medium text-fg">{brief.activeRiskCount}</span> active{" "}
          {brief.activeRiskCount === 1 ? "risk" : "risks"}.
        </p>

        {brief.closing && <p className="text-sm text-fg-muted italic">{brief.closing}</p>}
      </div>

      <div className="mt-auto space-y-2">
        <Link to={`/events/${eventId}/ai`} className="block">
          <Button variant="secondary" size="sm" fullWidth leadingIcon={MessageSquare}>
            Ask ClubOps AI
          </Button>
        </Link>
        <p className="text-center text-[11px] text-fg-subtle">
          Briefs summarise your event data. The copilot never acts on its own.
        </p>
      </div>
    </div>
  );
}
