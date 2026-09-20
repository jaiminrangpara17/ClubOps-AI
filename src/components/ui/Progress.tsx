import { cn } from "@/lib/cn";
import type { Tone } from "@/types";

const FILL: Record<Tone, string> = {
  neutral: "bg-neutral",
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

export interface ProgressProps {
  /** 0–100. */
  value: number;
  tone?: Tone;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function Progress({
  value,
  tone = "brand",
  label,
  showValue = false,
  size = "md",
  className,
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-3 text-xs">
          {label && <span className="truncate text-fg-muted">{label}</span>}
          {showValue && <span className="font-medium text-fg tabular-nums">{clamped}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className={cn(
          "w-full overflow-hidden rounded-full bg-surface-inset",
          size === "sm" ? "h-1.5" : "h-2",
        )}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-300", FILL[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
