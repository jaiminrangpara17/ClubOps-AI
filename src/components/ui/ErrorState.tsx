import { AlertTriangle, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Technical detail shown in a monospace block (message, code). */
  detail?: string;
  onRetry?: () => void;
  retryLabel?: string;
  actions?: ReactNode;
  /** `inline` for a compact banner, `panel` for a full block. */
  variant?: "panel" | "inline";
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "The request could not be completed. Try again, and contact an administrator if the problem persists.",
  detail,
  onRetry,
  retryLabel = "Try again",
  actions,
  variant = "panel",
  className,
}: ErrorStateProps) {
  if (variant === "inline") {
    return (
      <div
        role="alert"
        className={cn(
          "flex items-start gap-3 rounded-control border border-danger/30 bg-danger-soft px-4 py-3",
          className,
        )}
      >
        <AlertTriangle width={16} height={16} aria-hidden className="mt-0.5 shrink-0 text-danger" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-danger">{title}</p>
          {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
        </div>
        {onRetry && (
          <Button size="sm" variant="ghost" leadingIcon={RotateCcw} onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-danger/30 bg-danger-soft px-6 py-10 text-center",
        className,
      )}
    >
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle width={20} height={20} aria-hidden />
      </span>
      <p className="text-sm font-semibold text-fg">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-fg-muted">{description}</p>}
      {detail && (
        <pre className="mt-4 max-w-full overflow-x-auto rounded-control border border-line bg-surface px-3 py-2 text-left font-mono text-xs text-fg-muted">
          {detail}
        </pre>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button size="sm" variant="outline" leadingIcon={RotateCcw} onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}
