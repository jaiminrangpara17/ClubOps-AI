import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";
import { useTheme } from "@/context/ThemeContext";

export interface TopbarProps {
  onOpenNav: () => void;
}

export function Topbar({ onOpenNav }: TopbarProps) {
  const { mode, toggleMode } = useTheme();
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-30 flex h-15 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        leadingIcon={Menu}
        aria-label="Open navigation"
        onClick={onOpenNav}
        className="lg:hidden"
      />

      <div className="relative hidden max-w-sm flex-1 items-center sm:flex">
        <Search
          width={15}
          height={15}
          aria-hidden
          className="pointer-events-none absolute left-3 text-fg-subtle"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search ClubOps…"
          aria-label="Search ClubOps"
          className="h-9 w-full rounded-control border border-line bg-surface-inset pr-3 pl-9 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          leadingIcon={mode === "light" ? Moon : Sun}
          aria-label={mode === "light" ? "Switch to dark theme" : "Switch to light theme"}
          onClick={toggleMode}
        />
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          leadingIcon={Bell}
          aria-label="Notifications"
          className="hidden sm:inline-flex"
        />
        <div className="ml-1 flex items-center gap-2.5 border-l border-line pl-3">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-soft-fg"
          >
            CO
          </span>
          <span className="hidden flex-col leading-tight md:flex">
            <span className="text-xs font-semibold text-fg">Club Operator</span>
            <span className="text-[11px] text-fg-subtle">Organisation admin</span>
          </span>
        </div>
      </div>
    </header>
  );
}
