import { ArrowRight, CalendarDays, CircleDotDashed } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { affectedEntityPath } from "@/lib/aiAction";
import type { AiAction } from "@/types";
import { AiActionStatusBadge, AiActionTypeBadge } from "./AiActionBadges";

function EntityPill({ eventId, entity }: { eventId: string; entity: AiAction["affectedEntity"] }) {
  if (!entity) {
    return <span className="text-xs text-fg-subtle">No linked record</span>;
  }
  const path = affectedEntityPath(eventId, entity);
  if (!path) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-xs text-fg-muted">
        <CircleDotDashed width={11} height={11} aria-hidden />
        <span className="max-w-[14rem] truncate">
          {entity.kind}: {entity.label}
        </span>
      </span>
    );
  }
  return (
    <Link
      to={path}
      onClick={(event) => event.stopPropagation()}
      className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-xs text-fg-muted hover:border-brand/40 hover:text-brand"
    >
      <CircleDotDashed width={11} height={11} aria-hidden />
      <span className="max-w-[14rem] truncate">
        {entity.kind}: {entity.label}
      </span>
    </Link>
  );
}

export function AiActionList({
  eventId,
  actions,
}: {
  eventId: string;
  actions: AiAction[];
}) {
  return (
    <ul className="space-y-3" role="list">
      {actions.map((action) => (
        <li key={action.id}>
          <Link
            to={`/events/${eventId}/ai/actions/${action.id}`}
            className="block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <Card interactive padding="md" className="transition-colors hover:border-brand/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <AiActionTypeBadge type={action.type} />
                    <AiActionStatusBadge status={action.status} />
                  </div>
                  <h3 className="text-sm font-semibold text-fg">{action.title}</h3>
                  <p className="line-clamp-2 text-xs text-fg-muted">{action.rationale}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  <span className="text-xs text-fg-subtle">{action.suggestedBy}</span>
                  <EntityPill eventId={eventId} entity={action.affectedEntity} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[11px] text-fg-subtle">
                <span className="flex items-center gap-1">
                  <CalendarDays width={11} height={11} aria-hidden />
                  {formatDate(action.createdAt)}
                </span>
                {action.expiresAt && <span>Expires {formatDate(action.expiresAt)}</span>}
                <ArrowRight width={13} height={13} aria-hidden className="text-fg-subtle" />
              </div>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function AiActionPendingBanner({ eventId, count }: { eventId: string; count: number }) {
  if (count === 0) return null;
  return (
    <Card variant="subtle" padding="md" className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-fg">
        <span className="tabular-nums">{count}</span> AI-suggested {count === 1 ? "action requires" : "actions require"} your approval.
      </p>
      <Link
        to={`/events/${eventId}/ai/actions`}
        className="text-xs font-medium text-brand underline-offset-4 hover:underline"
      >
        Review all
      </Link>
    </Card>
  );
}

export function AiActionEmptyState() {
  return (
    <Card padding="lg" className="text-center">
      <CardContent className="mx-auto max-w-md space-y-2">
        <p className="text-sm font-semibold text-fg">No actions need your approval.</p>
        <p className="text-sm text-fg-muted">
          ClubOps AI has no pending actions for this event. New suggestions will appear here when
          Copilot identifies work that needs a human decision.
        </p>
      </CardContent>
    </Card>
  );
}
