import { cn } from "@/lib/cn";

export interface LogoProps {
  /** Hides the wordmark, keeping only the mark. */
  compact?: boolean;
  className?: string;
}

/** ClubOps AI brand lockup. */
export function Logo({ compact = false, className }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-brand text-white">
        <svg
          viewBox="0 0 24 24"
          width={17}
          height={17}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3 4 7v5c0 4.4 3.4 8.3 8 9 4.6-.7 8-4.6 8-9V7l-8-4Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </span>
      {!compact && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight text-nav-fg">
            ClubOps <span className="text-brand-400">AI</span>
          </span>
          <span className="mt-1 text-[11px] text-nav-fg-muted">Event Operations</span>
        </span>
      )}
    </span>
  );
}
