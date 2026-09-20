import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { getStatusDefinition } from "@/lib/status";
import type { StatusKind, Tone } from "@/types";

export type BadgeVariant = "soft" | "solid" | "outline";

const SOFT: Record<Tone, string> = {
  neutral: "bg-neutral-soft text-fg-muted",
  brand: "bg-brand-soft text-brand-soft-fg",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

const SOLID: Record<Tone, string> = {
  neutral: "bg-neutral text-white",
  brand: "bg-brand text-white",
  success: "bg-success text-white",
  warning: "bg-warning text-white",
  danger: "bg-danger text-white",
  info: "bg-info text-white",
};

const OUTLINE: Record<Tone, string> = {
  neutral: "border border-line-strong text-fg-muted",
  brand: "border border-brand/40 text-brand",
  success: "border border-success/40 text-success",
  warning: "border border-warning/40 text-warning",
  danger: "border border-danger/40 text-danger",
  info: "border border-info/40 text-info",
};

const DOT: Record<Tone, string> = {
  neutral: "bg-neutral",
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  variant?: BadgeVariant;
  /** Shows a leading status dot. */
  dot?: boolean;
}

export function Badge({
  tone = "neutral",
  variant = "soft",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  const toneClasses =
    variant === "solid" ? SOLID[tone] : variant === "outline" ? OUTLINE[tone] : SOFT[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
        "text-xs font-medium whitespace-nowrap",
        toneClasses,
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "solid" ? "bg-white/80" : DOT[tone],
          )}
        />
      )}
      {children}
    </span>
  );
}

export interface StatusBadgeProps extends Omit<BadgeProps, "tone" | "children"> {
  status: StatusKind;
}

/** Badge bound to the shared operational status vocabulary. */
export function StatusBadge({ status, ...props }: StatusBadgeProps) {
  const { label, tone } = getStatusDefinition(status);
  return (
    <Badge tone={tone} dot {...props}>
      {label}
    </Badge>
  );
}
