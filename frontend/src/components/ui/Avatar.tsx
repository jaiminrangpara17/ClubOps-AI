import { cn } from "@/lib/cn";
import type { Tone } from "@/types";

export type AvatarSize = "xs" | "sm" | "md" | "lg";

const SIZES: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

const TONES: Record<Tone, string> = {
  neutral: "bg-neutral-soft text-fg-muted",
  brand: "bg-brand-soft text-brand-soft-fg",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
  tone?: Tone;
  className?: string;
}

export function Avatar({ name, size = "md", tone = "brand", className }: AvatarProps) {
  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none",
        SIZES[size],
        TONES[tone],
        className,
      )}
    >
      <span aria-hidden>{getInitials(name)}</span>
      <span className="sr-only">{name}</span>
    </span>
  );
}
