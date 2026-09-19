import type { ReactNode } from "react";
import { Card, ErrorState, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface DashboardSectionProps {
  /** Screen-reader heading and visible card title. */
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Uniform card chrome for every dashboard section. */
export function DashboardSection({ title, action, children, className }: DashboardSectionProps) {
  return (
    <Card className={cn("flex h-full flex-col overflow-hidden", className)}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </Card>
  );
}

/** Skeleton body used while a section has no data yet. */
export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Compact, in-card error with retry. Used for per-section failures. */
export function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-5">
      <ErrorState
        variant="inline"
        title="Unable to load dashboard data"
        description={message}
        onRetry={onRetry}
        retryLabel="Retry"
      />
    </div>
  );
}

/** Body wrapper that resolves loading / error / content for a section. */
export function SectionBody({
  isLoading,
  error,
  hasData,
  onRetry,
  skeletonRows = 3,
  children,
}: {
  isLoading: boolean;
  error: string | null;
  hasData: boolean;
  onRetry: () => void;
  skeletonRows?: number;
  children: ReactNode;
}) {
  if (isLoading && !hasData) return <SectionSkeleton rows={skeletonRows} />;
  if (!hasData && error) return <SectionError message={error} onRetry={onRetry} />;
  return <>{children}</>;
}

/** Section-level heading kept out of the card for flexible layouts. */
export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-semibold tracking-wider text-fg-subtle uppercase">
      {children}
    </h2>
  );
}
