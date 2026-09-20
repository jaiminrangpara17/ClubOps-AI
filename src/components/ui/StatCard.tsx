import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "./Card";
import { cn } from "@/lib/cn";
import type { IconComponent, Tone } from "@/types";

const ICON_TONES: Record<Tone, string> = {
  neutral: "bg-neutral-soft text-fg-muted",
  brand: "bg-brand-soft text-brand-soft-fg",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

const TREND_TONES: Record<Tone, string> = {
  neutral: "text-fg-subtle",
  brand: "text-brand",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

const TREND_ICONS = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
} as const;

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: IconComponent;
  tone?: Tone;
  trend?: { direction: keyof typeof TREND_ICONS; label: string; tone?: Tone };
  className?: string;
}

/** Compact metric tile used on dashboards and module summaries. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  trend,
  className,
}: StatCardProps) {
  const TrendIcon = trend ? TREND_ICONS[trend.direction] : null;

  return (
    <Card padding="md" className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-fg-muted">{label}</p>
        {Icon && (
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-control",
              ICON_TONES[tone],
            )}
          >
            <Icon width={16} height={16} aria-hidden />
          </span>
        )}
      </div>

      <p className="text-2xl font-semibold tracking-tight text-fg tabular-nums">{value}</p>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {trend && TrendIcon && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              TREND_TONES[trend.tone ?? "neutral"],
            )}
          >
            <TrendIcon width={13} height={13} aria-hidden />
            {trend.label}
          </span>
        )}
        {hint && <span className="text-xs text-fg-subtle">{hint}</span>}
      </div>
    </Card>
  );
}
