import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import type { BreadcrumbItem } from "@/types";

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="truncate rounded-sm text-fg-subtle transition-colors hover:text-fg"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn("truncate", isLast ? "font-medium text-fg-muted" : "text-fg-subtle")}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight width={12} height={12} aria-hidden className="shrink-0 text-fg-subtle/60" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
