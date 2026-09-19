import type { ReactNode } from "react";
import { Breadcrumb } from "./Breadcrumb";
import { cn } from "@/lib/cn";
import type { BreadcrumbItem } from "@/types";

export interface PageHeaderProps {
  title: string;
  /** Small uppercase label above the title (module / context). */
  eyebrow?: string;
  description?: string;
  /** Right-aligned actions (buttons, filters). */
  actions?: ReactNode;
  /** Meta row under the description (badges, counts). */
  meta?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /** `lg` renders a page-level h1, `md` a section-level h2. */
  size?: "md" | "lg";
  divider?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  meta,
  breadcrumbs,
  size = "lg",
  divider = true,
  className,
}: PageHeaderProps) {
  const Heading = size === "lg" ? "h1" : "h2";

  return (
    <header className={cn(divider && "border-b border-line pb-5", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} className="mb-3" />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          {eyebrow && (
            <p className="text-xs font-semibold tracking-wide text-brand uppercase">{eyebrow}</p>
          )}
          <Heading
            className={cn(
              "text-fg",
              size === "lg" ? "text-xl font-semibold sm:text-2xl" : "text-base font-semibold sm:text-lg",
            )}
          >
            {title}
          </Heading>
          {description && <p className="max-w-2xl text-sm text-fg-muted">{description}</p>}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>
        )}
      </div>

      {meta && <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div>}
    </header>
  );
}
