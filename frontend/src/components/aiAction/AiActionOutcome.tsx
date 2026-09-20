import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { affectedEntityPath } from "@/lib/aiAction";
import type { AiAction, AiActionStatus } from "@/types";

interface OutcomePresentation {
  icon: typeof CheckCircle2;
  tone: string;
  title: string;
}

function presentation(status: AiActionStatus): OutcomePresentation | null {
  switch (status) {
    case "completed":
      return { icon: CheckCircle2, tone: "text-success", title: "Action completed" };
    case "executing":
      return { icon: Loader2, tone: "text-brand animate-spin", title: "Action is executing" };
    case "rejected":
      return { icon: XCircle, tone: "text-fg-muted", title: "Action rejected" };
    case "failed":
      return { icon: AlertTriangle, tone: "text-danger", title: "Action could not be completed" };
    case "expired":
      return { icon: Clock, tone: "text-fg-muted", title: "Action expired" };
    default:
      return null;
  }
}

/**
 * Post-execution outcome panel.
 *
 * Completed text is rendered only when the backend returned authoritative
 * post-execution state (`action.resultMessage`) — it is never fabricated here.
 */
export function AiActionOutcome({
  eventId,
  action,
}: {
  eventId: string;
  action: AiAction;
}) {
  const config = presentation(action.status);
  if (!config) return null;

  const entityPath = affectedEntityPath(eventId, action.affectedEntity);
  const Icon = config.icon;

  return (
    <Card
      className={
        action.status === "completed"
          ? "border-success/30 bg-success-soft/40"
          : action.status === "failed"
            ? "border-danger/30 bg-danger-soft/30"
            : undefined
      }
      padding="md"
    >
      <CardContent className="space-y-3 p-0">
        <p className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Icon width={17} height={17} aria-hidden className={config.tone} />
          {config.title}
        </p>

        {action.resultMessage && (
          <p className="text-sm leading-relaxed text-fg-muted">{action.resultMessage}</p>
        )}

        {action.rejectionReason && (
          <p className="text-xs text-fg-muted">
            Reason: <span className="text-fg">{action.rejectionReason}</span>
          </p>
        )}

        <p className="text-[11px] text-fg-subtle">
          {action.status === "rejected"
            ? `Rejected ${formatDate(action.updatedAt)}`
            : action.status === "completed"
              ? `Completed ${formatDate(action.updatedAt)}`
              : action.status === "failed"
                ? `Failed ${formatDate(action.updatedAt)}`
                : action.status === "expired"
                  ? "Expired"
                  : `Executing — updated ${formatDate(action.updatedAt)}`}
        </p>

        {entityPath && action.status !== "rejected" && action.status !== "expired" && (
          <Link
            to={entityPath}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            View {action.affectedEntity?.kind ?? "record"}
            <ArrowRight width={14} height={14} aria-hidden />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
