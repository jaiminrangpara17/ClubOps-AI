import { ArrowLeft, Check, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import {
  AiActionChanges,
  AiActionContextPanel,
  AiActionOutcome,
  ApproveActionDialog,
  RejectActionDialog,
  AiActionStatusBadge,
  AiActionTypeBadge,
} from "@/components/aiAction";
import { Badge, Button, Card, CardContent, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useAiAction, useAiActionCapabilities, useAiActionMutations } from "@/hooks/useAiActions";
import { affectedEntityPath } from "@/lib/aiAction";
import { isMockApi } from "@/services/apiMode";
import { Link } from "react-router-dom";

export default function AiActionReviewPage() {
  const { eventId = "", actionId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { capabilities } = useAiActionCapabilities(eventId);
  const { action, error, isLoading, refetch, applyAction } = useAiAction(eventId, actionId);
  const mutations = useAiActionMutations();
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);

  const canWrite =
    user?.role === "PRESIDENT" || user?.role === "EVENT_HEAD" || user?.role === "FACULTY";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-card" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-card" />
          <Skeleton className="h-64 rounded-card lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!action || error) {
    return (
      <ErrorState
        title="Unable to load action"
        description={error ?? "This action does not belong to the current event."}
        onRetry={refetch}
        actions={
          <Button variant="ghost" onClick={() => navigate(`/events/${eventId}/ai/actions`)}>
            Back to AI actions
          </Button>
        }
      />
    );
  }

  const isPending = action.status === "pending";
  const canApprove = canWrite && Boolean(capabilities?.approve) && isPending;
  const canReject = canWrite && Boolean(capabilities?.reject) && isPending;

  const handleApprove = async () => {
    try {
      const updated = await mutations.run("approve", eventId, actionId);
      applyAction(updated);
      setDialog(null);
      // Refresh the list so the pending count reflects the authoritative result.
      void refetch();
    } catch {
      setDialog(null);
    }
  };

  const handleReject = async (reason?: string) => {
    try {
      const updated = await mutations.run("reject", eventId, actionId, reason);
      applyAction(updated);
      setDialog(null);
      void refetch();
    } catch {
      setDialog(null);
    }
  };

  const entityPath = affectedEntityPath(eventId, action.affectedEntity);

  return (
    <div className="space-y-5">
      <PageHeader
        size="md"
        divider={false}
        title={action.title}
        description={`${action.suggestedBy} · ${action.status}`}
        meta={
          <>
            <AiActionTypeBadge type={action.type} />
            <AiActionStatusBadge status={action.status} />
            {isPending && <Badge tone="warning">Awaiting approval</Badge>}
          </>
        }
        actions={
          <>
            <Button variant="outline" leadingIcon={ArrowLeft} onClick={() => navigate(`/events/${eventId}/ai/actions`)}>
              Back
            </Button>
            {canApprove && (
              <Button leadingIcon={Check} onClick={() => setDialog("approve")}>
                Review &amp; approve
              </Button>
            )}
            {canReject && (
              <Button variant="ghost" leadingIcon={X} onClick={() => setDialog("reject")}>
                Reject
              </Button>
            )}
          </>
        }
      />

      {isMockApi && (
        <PreviewNotice>
          <span className="font-medium text-fg">Development adapter.</span> Completing this action
          only runs inside mock services so the UI flow is exercised. No backend executes it.
        </PreviewNotice>
      )}
      {mutations.error && (
        <ErrorState variant="inline" title="Action failed" description={mutations.error} />
      )}

      <AiActionOutcome eventId={eventId} action={action} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="space-y-5 p-5">
              <AiActionChanges action={action} />
              {entityPath && (
                <div className="border-t border-line pt-4">
                  <Link
                    to={entityPath}
                    className="text-sm font-medium text-brand underline-offset-4 hover:underline"
                  >
                    Open affected {action.affectedEntity?.kind} →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <AiActionContextPanel eventId={eventId} action={action} />
        </div>
      </div>

      {isPending && !canWrite && (
        <p className="rounded-control border border-line bg-surface-subtle px-3 py-2 text-xs text-fg-muted">
          You do not have permission to approve or reject AI-suggested actions for this event.
        </p>
      )}

      <p className="flex items-start gap-2 text-[11px] text-fg-subtle">
        <ShieldCheck width={13} height={13} aria-hidden className="mt-0.5 shrink-0" />
        Approval is only a request. The action is updated only when the backend returns the
        authoritative post-execution result.
      </p>

      {dialog === "approve" && action && (
        <ApproveActionDialog
          action={action}
          isBusy={Boolean(mutations.busyId)}
          error={mutations.error}
          onConfirm={() => void handleApprove()}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === "reject" && action && (
        <RejectActionDialog
          action={action}
          supportsReason={Boolean(capabilities?.rejectReason)}
          isBusy={Boolean(mutations.busyId)}
          error={mutations.error}
          onConfirm={(reason) => void handleReject(reason)}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
