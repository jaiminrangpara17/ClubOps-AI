import { Menu, Moon, Search, Sun } from "lucide-react";
import { EventSwitcher } from "./EventSwitcher";
import { NotificationsMenu } from "./NotificationsMenu";
import { UserMenu } from "./UserMenu";
import { Dropdown } from "@/components/ui";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/cn";

const ICON_BUTTON =
  "flex h-9 w-9 items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-surface-inset hover:text-fg";

export interface TopbarProps {
  onOpenNav: () => void;
}

export function Topbar({ onOpenNav }: TopbarProps) {
  const { mode, toggleMode } = useTheme();
  const ThemeIcon = mode === "light" ? Moon : Sun;

  return (
    <header className="sticky top-0 z-30 flex h-15 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:px-5">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className={cn(ICON_BUTTON, "lg:hidden")}
      >
        <Menu width={18} height={18} aria-hidden />
      </button>

      <EventSwitcher />

      <div className="ml-auto flex items-center gap-1">
        <Dropdown
          align="end"
          panelWidth="w-72"
          label="Search"
          role="dialog"
          className="hidden md:block"
          trigger={({ open, toggle }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-haspopup="dialog"
              className={cn(
                "flex h-9 w-56 items-center gap-2 rounded-control border border-line bg-surface-inset px-3 text-sm text-fg-subtle transition-colors hover:border-line-strong lg:w-64",
                open && "border-line-strong",
              )}
            >
              <Search width={15} height={15} aria-hidden />
              <span className="flex-1 text-left">Search…</span>
              <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle">
                ⌘K
              </kbd>
            </button>
          )}
        >
          <div className="px-3 py-3">
            <p className="text-sm font-medium text-fg">Global search</p>
            <p className="mt-1 text-xs text-fg-muted">
              Cross-module search over events, tasks, volunteers and documents is part of a later
              release.
            </p>
          </div>
        </Dropdown>

        <button
          type="button"
          onClick={toggleMode}
          aria-label={mode === "light" ? "Switch to dark theme" : "Switch to light theme"}
          className={ICON_BUTTON}
        >
          <ThemeIcon width={17} height={17} aria-hidden />
        </button>

        <NotificationsMenu />

        <div className="ml-1 border-l border-line pl-1.5">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
