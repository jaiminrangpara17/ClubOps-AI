import { LifeBuoy, Palette, Settings, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { cn } from "@/lib/cn";
import { NAV_SECTION_ORDER, getNavItemsBySection } from "@/lib/navigation";
import type { NavItem } from "@/types";

const LINK_BASE =
  "group flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors duration-150";

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          LINK_BASE,
          isActive
            ? "bg-brand text-white shadow-xs"
            : "text-nav-fg-muted hover:bg-white/5 hover:text-nav-fg",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            width={17}
            height={17}
            aria-hidden
            className={cn("shrink-0", isActive ? "text-white" : "text-nav-fg-muted")}
          />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export interface SidebarProps {
  /** Called after a navigation item is chosen (used to close the mobile drawer). */
  onNavigate?: () => void;
  /** Renders the close control (mobile drawer only). */
  onClose?: () => void;
}

export function SidebarContent({ onNavigate, onClose }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-nav">
      <div className="flex h-15 shrink-0 items-center justify-between border-b border-nav-line px-4">
        <Logo />
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

      <nav aria-label="Main" className="scrollbar-slim flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_SECTION_ORDER.map((section) => (
          <div key={section} className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-nav-fg-muted/70 uppercase">
              {section}
            </p>
            {getNavItemsBySection(section).map((item) => (
              <SidebarLink key={item.id} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-nav-line p-3">
        <NavLink
          to="/foundation"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              LINK_BASE,
              isActive
                ? "bg-white/10 text-nav-fg"
                : "text-nav-fg-muted hover:bg-white/5 hover:text-nav-fg",
            )
          }
        >
          <Palette width={17} height={17} aria-hidden />
          <span>Design foundation</span>
        </NavLink>
        <a
          href="#settings"
          className={cn(LINK_BASE, "text-nav-fg-muted hover:bg-white/5 hover:text-nav-fg")}
        >
          <Settings width={17} height={17} aria-hidden />
          <span>Settings</span>
        </a>
        <a
          href="#support"
          className={cn(LINK_BASE, "text-nav-fg-muted hover:bg-white/5 hover:text-nav-fg")}
        >
          <LifeBuoy width={17} height={17} aria-hidden />
          <span>Help &amp; support</span>
        </a>
      </div>
    </div>
  );
}

/** Fixed desktop sidebar. */
export function Sidebar() {
  return (
    <aside className="hidden w-sidebar shrink-0 border-r border-nav-line lg:block">
      <div className="fixed inset-y-0 left-0 w-sidebar">
        <SidebarContent />
      </div>
    </aside>
  );
}
