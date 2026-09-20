import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export function Spinner({ size = 18, className, label = "Loading" }: SpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      width={size}
      height={size}
      className={cn("animate-spin text-brand", className)}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-control bg-surface-inset", className)} />;
}

export interface LoadingStateProps {
  title?: string;
  description?: string;
  /** `spinner` for short waits, `skeleton` for content placeholders. */
  variant?: "spinner" | "skeleton";
  /** Number of skeleton rows when variant is `skeleton`. */
  rows?: number;
  className?: string;
}

export function LoadingState({
  title = "Loading…",
  description,
  variant = "spinner",
  rows = 3,
  className,
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-3", className)} aria-busy="true" aria-live="polite">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 rounded-card border border-line bg-surface p-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-line bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <Spinner size={22} />
      <div className="space-y-1">
        <p className="text-sm font-medium text-fg">{title}</p>
        {description && <p className="text-sm text-fg-muted">{description}</p>}
      </div>
    </div>
  );
}
