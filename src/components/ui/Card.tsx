import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CardVariant = "default" | "raised" | "subtle" | "ghost";
export type CardPadding = "none" | "sm" | "md" | "lg";

const VARIANTS: Record<CardVariant, string> = {
  default: "bg-surface border border-line shadow-xs",
  raised: "bg-surface-raised border border-line shadow-md",
  subtle: "bg-surface-subtle border border-line",
  ghost: "bg-transparent border border-dashed border-line-strong",
};

const PADDING: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6 sm:p-7",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  /** Adds hover elevation for clickable cards. */
  interactive?: boolean;
}

export function Card({
  variant = "default",
  padding = "none",
  interactive = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card",
        VARIANTS[variant],
        PADDING[padding],
        interactive && "transition-shadow duration-150 hover:shadow-md",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  actions,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { actions?: ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-line px-5 py-4",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 space-y-1">{children}</div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold text-fg", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-fg-muted", className)} {...props} />;
}

export function CardContent({
  className,
  padding = "md",
  ...props
}: HTMLAttributes<HTMLDivElement> & { padding?: CardPadding }) {
  return <div className={cn(PADDING[padding], className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 rounded-b-card border-t border-line bg-surface-subtle px-5 py-3",
        className,
      )}
      {...props}
    />
  );
}
