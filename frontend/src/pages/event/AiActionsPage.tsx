import { ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import {
  AiActionEmptyState,
  AiActionList,
  AiActionPendingBanner,
} from "@/components/aiAction";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui";
import { useCurrentEvent } from "@/hooks/useCurrentEvent";
import { useAiActionCapabilities, useAiActions } from "@/hooks/useAiActions";
import { AI_ACTION_FILTERS, filterAiActions, pendingCount, sortAiActions } from "@/lib/aiAction";
import { isMockApi } from "@/services/apiMode";
import type { AiActionListFilter } from "@/lib/aiAction";

export default function AiActionsPage() {
  const { eventId = "" } = useParams();
  const event = useCurrentEvent();
  const { capabilities } = useAiActionCapabilities(eventId);
  const { actions, error, isLoading, refetch } = useAiActions(eventId);
  const [filter, setFilter] = useState<AiActionListFilter>("all");

  const sorted = useMemo(() => sortAiActions(actions), [actions]);
  const filtered = useMemo(() => filterAiActions(sorted, filter), [sorted, filter]);
  const pending = useMemo(() => pendingCount(actions), [actions]);

  return (
    <div className="space-y-5">
      <PageHeader
        size="md"
        divider={false}
        title="AI action approval"
        description={`Review suggestions ClubOps AI made for ${event.name}. Approval sends the request to the server — nothing executes in your browser.`}
        meta={
          <>
            <Badge tone="warning">Requires review</Badge>
            {pending > 0 && <Badge tone="warning">{pending} pending</Badge>}
          </>
        }
        actions={undefined}
      />

      {isMockApi && (
        <PreviewNotice>
          <span className="font-medium text-fg">Development adapter.</span> Approval, rejection and
          history are simulated by an isolated service. No backend executes these actions; the
          approval flow exists so Part 14 can wire the real contract without UI changes.
        </PreviewNotice>
      )}

      <AiActionPendingBanner eventId={eventId} count={pending} />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-card" />
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Unable to load AI actions" description={error} onRetry={refetch} retryLabel="Retry" />
      ) : actions.length === 0 ? (
        <AiActionEmptyState />
      ) : (
        <>
          <div className="scrollbar-slim -mx-1 overflow-x-auto px-1">
            <nav aria-label="Filter AI actions" className="flex gap-1 rounded-control border border-line bg-surface-inset p-1">
              {AI_ACTION_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  aria-pressed={filter === item.value}
                  className={
                    filter === item.value
                      ? "rounded-[0.4rem] bg-surface px-3 py-1.5 text-sm font-medium text-fg shadow-xs transition-colors"
                      : "rounded-[0.4rem] px-3 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
                  }
                >
                  {item.label}
                  {item.value !== "all" && (
                    <span className="ml-1.5 rounded-full bg-surface-inset px-1.5 py-0.5 text-[11px] text-fg-muted tabular-nums">
                      {actions.filter((action) => action.status === item.value).length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {filtered.length === 0 ? (
            <Card padding="lg">
              <EmptyState
                title="No actions in this state"
                description="Choose a different filter to see more actions."
              />
            </Card>
          ) : (
            <AiActionList eventId={eventId} actions={filtered} />
          )}
        </>
      )}

      <p className="flex items-start gap-2 text-[11px] text-fg-subtle">
        <ShieldCheck width={13} height={13} aria-hidden className="mt-0.5 shrink-0" />
        Approval is only a request. The UI updates from the backend's authoritative result; it never
        pre-marks an action as successful.
        {capabilities ? "" : " Capabilities could not be loaded, so approval may be unavailable."}
      </p>
    </div>
  );
}
