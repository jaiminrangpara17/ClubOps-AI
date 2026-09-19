import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  title: string;
  /** Small uppercase label above the title (module / context). */
  eyebrow?: string;
  description?: string;
  /** Right-aligned actions (buttons, filters). */
  actions?: ReactNode;
  /** Optional meta row rendered under the description (badges, counts). */
  meta?: ReactNode;
  divider?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  meta,
  divider = true,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("pb-5", divider && "mb-6 border-b border-line", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          {eyebrow && (
            <p className="text-xs font-semibold tracking-wide text-brand uppercase">{eyebrow}</p>
          )}
          <h1 className="truncate text-xl font-semibold text-fg sm:text-2xl">{title}</h1>
          {description && <p className="max-w-2xl text-sm text-fg-muted">{description}</p>}
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>}
      </div>

      {meta && <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div>}
    </header>
  );
}
