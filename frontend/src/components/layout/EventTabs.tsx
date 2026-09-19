import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/cn";
import { EVENT_TABS, isNavItemActive, resolveNavPath } from "@/lib/navigation";

export interface EventTabsProps {
  eventId: string;
  className?: string;
}

/** Horizontal module navigation inside an event. Scrolls on narrow screens. */
export function EventTabs({ eventId, className }: EventTabsProps) {
  const { pathname } = useLocation();

  return (
    <div className={cn("scrollbar-slim -mx-1 overflow-x-auto px-1 pb-1", className)}>
      <nav
        aria-label="Event sections"
        className="inline-flex w-max gap-1 rounded-control border border-line bg-surface-inset p-1"
      >
        {EVENT_TABS.map((tab) => {
          const active = isNavItemActive(tab, pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              to={resolveNavPath(tab, eventId)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-[0.4rem] px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-surface text-fg shadow-xs"
                  : "text-fg-muted hover:bg-surface/60 hover:text-fg",
              )}
            >
              <Icon width={15} height={15} aria-hidden />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
