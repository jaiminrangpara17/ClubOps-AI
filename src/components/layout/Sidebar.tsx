import { LifeBuoy, Palette, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { NavItem } from "./NavItem";
import { cn } from "@/lib/cn";
import { useEventContext } from "@/context/EventContext";
import { NAV_SECTIONS, getNavItemsBySection, isNavItemActive, resolveNavPath } from "@/lib/navigation";
import { getStatusDefinition } from "@/lib/status";

const FOOTER_LINK =
  "flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-nav-fg-muted transition-colors hover:bg-white/5 hover:text-nav-fg";

export interface SidebarProps {
  /** Called after a destination is chosen (closes the mobile drawer). */
  onNavigate?: () => void;
  /** Renders the close control (mobile drawer only). */
  onClose?: () => void;
}

/** Shared sidebar body — rendered both in the fixed rail and the drawer. */
export function SidebarContent({ onNavigate, onClose }: SidebarProps) {
  const { pathname } = useLocation();
  const { currentEvent, currentEventId } = useEventContext();
  const status = getStatusDefinition(currentEvent.status);

  return (
    <div className="flex h-full flex-col bg-nav">
      <div className="flex h-15 shrink-0 items-center justify-between border-b border-nav-line px-4">
        <Link to="/dashboard" onClick={onNavigate} className="rounded-control">
          <Logo />
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-8 w-8 items-center justify-center rounded-control text-nav-fg-muted hover:bg-white/5 hover:text-nav-fg lg:hidden"
          >
            <X width={18} height={18} aria-hidden />
          </button>
        )}
      </div>

      <div className="shrink-0 px-3 pt-4">
        <Link
          to={`/events/${currentEventId}`}
          onClick={onNavigate}
          className="block rounded-card border border-nav-line bg-white/[0.04] p-3 transition-colors hover:border-brand/40"
        >
          <p className="text-[10px] font-semibold tracking-wider text-nav-fg-muted uppercase">
            Current event
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-nav-fg">{currentEvent.name}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-nav-fg-muted">
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                status.tone === "success"
                  ? "bg-success"
                  : status.tone === "warning"
                    ? "bg-warning"
                    : status.tone === "danger"
                      ? "bg-danger"
                      : "bg-brand-400",
              )}
            />
            {status.label} · {currentEvent.code}
          </p>
        </Link>
      </div>

      <nav aria-label="Main" className="scrollbar-slim flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.id} className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-nav-fg-muted/70 uppercase">
              {section.label}
            </p>
            {getNavItemsBySection(section.id).map((item) => (
              <NavItem
                key={item.id}
                item={item}
                to={resolveNavPath(item, currentEventId)}
                active={isNavItemActive(item, pathname)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-nav-line p-3">
        <Link to="/foundation" onClick={onNavigate} className={FOOTER_LINK}>
          <Palette width={17} height={17} aria-hidden />
          <span>Design foundation</span>
        </Link>
        <Link to="/help" onClick={onNavigate} className={FOOTER_LINK}>
          <LifeBuoy width={17} height={17} aria-hidden />
          <span>Help &amp; support</span>
        </Link>
      </div>
    </div>
  );
}

/** Persistent desktop rail (≥ lg). */
export function Sidebar() {
  return (
    <aside className="hidden w-sidebar shrink-0 lg:block">
      <div className="fixed inset-y-0 left-0 w-sidebar border-r border-nav-line">
        <SidebarContent />
      </div>
    </aside>
  );
}
