import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { IconComponent } from "@/types";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconComponent;
  /** Primary and secondary calls to action. */
  actions?: ReactNode;
  /** `panel` sits inside an existing card, `page` fills a route body. */
  variant?: "panel" | "page";
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actions,
  variant = "panel",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-surface-subtle text-center",
        variant === "page" ? "px-6 py-16" : "px-6 py-10",
        className,
      )}
    >
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-fg-subtle">
        <Icon width={20} height={20} aria-hidden />
      </span>
      <p className="text-sm font-semibold text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>}
      {actions && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>
  );
}
