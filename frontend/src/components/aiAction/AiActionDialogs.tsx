import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, ErrorState } from "@/components/ui";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import type { AiAction } from "@/types";

/** Allow listed actions shown in the confirmation summary. */
const MAX_CHANGES = 6;

function ChangeSummary({ action }: { action: AiAction }) {
  const shown = action.changes.slice(0, MAX_CHANGES);
  const remaining = action.changes.length - shown.length;
  return (
    <ul className="mt-3 space-y-1.5">
      {shown.map((change) => (
        <li key={change.field} className="text-xs text-fg-muted">
          {change.label}:{" "}
          {change.current ? (
            <>
              <span className="text-fg">{change.current}</span> → <span className="font-medium text-danger">{change.proposed}</span>
            </>
          ) : (
            <span className="font-medium text-fg">{change.proposed}</span>
          )}
        </li>
      ))}
      {remaining > 0 && (
        <li className="text-xs text-fg-subtle">…and {remaining} more change{remaining === 1 ? "" : "s"}</li>
      )}
    </ul>
  );
}

/**
 * Deliberate, double-submit protected approval dialog.
 *
 * Approving an action here only starts a backend request. Local state in the
 * parent updates only after the backend returns authoritative post-execution
 * data. Nothing is claimed successful before then.
 */
export function ApproveActionDialog({
  action,
  isBusy,
  error,
  onConfirm,
  onCancel,
}: {
  action: AiAction;
  isBusy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useLockBodyScroll(true);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  const submit = () => {
    if (!confirmed || isBusy) return;
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="approve-action-title"
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
    >
      <div className="w-full max-w-lg rounded-card border border-line bg-surface shadow-pop">
        <div className="border-b border-line px-5 py-4">
          <h2 id="approve-action-title" className="text-base font-semibold text-fg">
            Approve this action?
          </h2>
          <p className="mt-0.5 text-sm text-fg-muted">
            The backend will execute the change only if it approves the request.
          </p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <p className="text-xs font-semibold text-fg-muted">Proposed by {action.suggestedBy}</p>
            <p className="mt-1 text-sm font-medium text-fg">{action.title}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-fg-muted">This will:</p>
            <ChangeSummary action={action} />
          </div>

          {action.affectedEntity && (
            <p className="text-xs text-fg-subtle">
              Affects {action.affectedEntity.kind}: {action.affectedEntity.label}
            </p>
          )}

          <div className="rounded-control border border-warning/30 bg-warning-soft p-3 text-xs text-warning">
            The backend remains authoritative. If execution fails, the action stays visible and is not
            marked complete.
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-control border border-line bg-surface-subtle px-3 py-2.5 text-sm text-fg">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={isBusy}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand-600"
            />
            I understand this change will be executed on the server.
          </label>

          {error && <ErrorState variant="inline" title="Approval failed" description={error} />}
        </div>

        <div className="flex flex-col gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={isBusy}>
            Cancel
          </Button>
          <button
            ref={confirmRef}
            type="button"
            onClick={submit}
            disabled={!confirmed || isBusy}
            className={
              "inline-flex h-10 items-center justify-center gap-2 rounded-control bg-brand px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-50"
            }
          >
            {isBusy ? (
              <span className="flex items-center gap-2"><span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Approving…</span>
            ) : (
              <>
                <Check width={16} height={16} aria-hidden />
                Approve action
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Rejection dialog. The reason field only renders when the backend advertises
 * support for rejection reasons; otherwise a simple confirm is shown.
 */
export function RejectActionDialog({
  action,
  supportsReason,
  isBusy,
  error,
  onConfirm,
  onCancel,
}: {
  action: AiAction;
  supportsReason: boolean;
  isBusy: boolean;
  error: string | null;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}) {
  useLockBodyScroll(true);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="reject-action-title"
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
    >
      <div className="w-full max-w-lg rounded-card border border-line bg-surface shadow-pop">
        <div className="border-b border-line px-5 py-4">
          <h2 id="reject-action-title" className="text-base font-semibold text-fg">
            Reject AI suggestion
          </h2>
          <p className="mt-0.5 text-sm text-fg-muted">
            This marks the suggestion as rejected. It will not be executed.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (isBusy) return;
            onConfirm(supportsReason ? reason.trim() || undefined : undefined);
          }}
        >
          <div className="space-y-4 px-5 py-4">
            <p className="text-sm text-fg">{action.title}</p>

            {supportsReason && (
              <div>
                <label htmlFor="reject-reason" className="block text-xs font-medium text-fg-muted">
                  Reason <span className="text-fg-subtle">(optional)</span>
                </label>
                <textarea
                  id="reject-reason"
                  rows={3}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="mt-1.5 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-fg shadow-xs focus:border-brand focus:outline-none"
                  placeholder="Why is this being rejected?"
                  disabled={isBusy}
                />
              </div>
            )}

            {error && <ErrorState variant="inline" title="Rejection failed" description={error} />}
          </div>

          <div className="flex flex-col gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
            <button
              ref={cancelRef}
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-control px-4 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-inset hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-50"
              onClick={onCancel}
              disabled={isBusy}
            >
              Cancel
            </button>
            <Button type="submit" variant="danger" leadingIcon={X} loading={isBusy}>
              {isBusy ? "Rejecting…" : "Reject action"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
