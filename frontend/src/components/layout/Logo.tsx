import { cn } from "@/lib/cn";

export interface LogoMarkProps {
  size?: number;
  className?: string;
}

/** The ClubOps AI shield glyph. */
export function LogoMark({ size = 18, className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M12 3 4 7v5c0 4.4 3.4 8.3 8 9 4.6-.7 8-4.6 8-9V7l-8-4Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export interface LogoProps {
  /** Hides the wordmark, keeping only the mark. */
  compact?: boolean;
  className?: string;
}

/** ClubOps AI brand lockup used in the sidebar brand area. */
export function Logo({ compact = false, className }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand text-white">
        <LogoMark />
      </span>
      {!compact && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="text-[13px] font-bold tracking-[0.2em] text-nav-fg uppercase">
            Clubops
          </span>
          <span className="mt-1 text-[10px] font-semibold tracking-[0.34em] text-brand-400 uppercase">
            AI
          </span>
        </span>
      )}
      <span className="sr-only">ClubOps AI</span>
    </span>
  );
}
