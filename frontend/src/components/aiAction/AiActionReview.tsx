import { ArrowDown, ArrowRight, CalendarDays, Link2, Sparkles, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { affectedEntityPath } from "@/lib/aiAction";
import type { AiAction } from "@/types";

/** One before/after row from the backend's structured change list. */
function ChangeRow({ current, proposed }: { current: string | null; proposed: string }) {
  return (
    <div className="grid grid-cols-1 gap-2 rounded-control border border-line bg-surface-subtle p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-wide text-fg-subtle uppercase">Current</p>
        <p className="mt-1 text-sm text-fg">{current ?? <span className="text-fg-subtle">—</span>}</p>
      </div>
      <div className="hidden items-center justify-center sm:flex">
        <ArrowRight width={16} height={16} aria-hidden className="text-brand" />
      </div>
      <div className="hidden items-center justify-center sm:hidden">
        <ArrowDown width={16} height={16} aria-hidden className="text-brand" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-wide text-brand uppercase">Proposed</p>
        <p className="mt-1 text-sm font-medium text-fg">{proposed}</p>
      </div>
    </div>
  );
}

/**
 * Backed-out structured change diff. Renders only what the backend returned;
 * it never fabricates a diff from free text. Field labels are backend-sourced.
 */
export function AiActionChanges({ action }: { action: AiAction }) {
  if (action.changes.length === 0) {
    return (
      <p className="text-sm text-fg-muted">
        The backend did not provide a structured change list for this action.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-card border border-line">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line bg-surface px-3 py-2 sm:grid-cols-[1fr_auto_1fr]">
          <p className="text-[11px] font-semibold text-fg-subtle">Field</p>
          <p className="sr-only">→</p>
          <p className="text-[11px] font-semibold text-fg-subtle">Change</p>
        </div>
      </div>
      <div className="space-y-2">
        {action.changes.map((change) => (
          <div key={change.field}>
            <p className="mb-1 text-xs font-medium text-fg-muted">{change.label}</p>
            <ChangeRow current={change.current} proposed={change.proposed} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AiActionContextPanel({
  eventId,
  action,
}: {
  eventId: string;
  action: AiAction;
}) {
  const entityPath = affectedEntityPath(eventId, action.affectedEntity);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Context</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="space-y-3">
          <div className="flex items-start gap-2">
            <UserRound width={15} height={15} aria-hidden className="mt-0.5 shrink-0 text-fg-subtle" />
            <div>
              <dt className="text-xs text-fg-subtle">Suggested by</dt>
              <dd className="text-sm text-fg">{action.suggestedBy}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CalendarDays width={15} height={15} aria-hidden className="mt-0.5 shrink-0 text-fg-subtle" />
            <div>
              <dt className="text-xs text-fg-subtle">Created</dt>
              <dd className="text-sm text-fg">{formatDate(action.createdAt)}</dd>
            </div>
          </div>
          {action.expiresAt && (
            <div className="flex items-start gap-2">
              <CalendarDays width={15} height={15} aria-hidden className="mt-0.5 shrink-0 text-fg-subtle" />
              <div>
                <dt className="text-xs text-fg-subtle">Expires</dt>
                <dd className="text-sm text-fg">{formatDate(action.expiresAt)}</dd>
              </div>
            </div>
          )}
        </dl>

        {action.affectedEntity && (
          <div className="border-t border-line pt-3">
            <p className="text-xs font-medium text-fg-muted">Affected record</p>
            {entityPath ? (
              <Link
                to={entityPath}
                className="mt-1 inline-flex items-center gap-1.5 text-sm text-brand underline-offset-4 hover:underline"
              >
                <Link2 width={13} height={13} aria-hidden />
                {action.affectedEntity.kind}: {action.affectedEntity.label}
              </Link>
            ) : (
              <p className="mt-1 text-sm text-fg-muted">
                {action.affectedEntity.kind}: {action.affectedEntity.label}
              </p>
            )}
          </div>
        )}

        <div className="border-t border-line pt-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
            <Sparkles width={12} height={12} aria-hidden />
            Why AI suggested this
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-fg">{action.rationale}</p>
        </div>
      </CardContent>
    </Card>
  );
}
