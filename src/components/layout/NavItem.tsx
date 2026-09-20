import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import type { NavItemConfig } from "@/types";

export interface NavItemProps {
  item: NavItemConfig;
  to: string;
  active: boolean;
  onNavigate?: () => void;
}

/** Single sidebar destination. Active state is computed by the caller. */
export function NavItem({ item, to, active, onNavigate }: NavItemProps) {
  const Icon = item.icon;

  return (
    <Link
      to={to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors duration-150",
        active
          ? "bg-brand text-white shadow-xs"
          : "text-nav-fg-muted hover:bg-white/5 hover:text-nav-fg",
      )}
    >
      <Icon
        width={17}
        height={17}
        aria-hidden
        className={cn("shrink-0", active ? "text-white" : "text-nav-fg-muted group-hover:text-nav-fg")}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
