import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useOutsideDismiss } from "@/hooks/useOutsideDismiss";
import type { IconComponent } from "@/types";

export interface DropdownTriggerApi {
  open: boolean;
  toggle: () => void;
}

export interface DropdownProps {
  /** Renders the trigger; must render a real <button>. */
  trigger: (api: DropdownTriggerApi) => ReactNode;
  children: ReactNode | ((api: { close: () => void }) => ReactNode);
  align?: "start" | "end";
  /** Tailwind width class for the panel. */
  panelWidth?: string;
  label?: string;
  /** Use `dialog` when the panel holds arbitrary content instead of menu items. */
  role?: "menu" | "dialog";
  className?: string;
}

/** Lightweight anchored menu used by the topbar (event, notifications, user). */
export function Dropdown({
  trigger,
  children,
  align = "end",
  panelWidth = "w-64",
  label,
  role = "menu",
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const containerRef = useOutsideDismiss<HTMLDivElement>(open, close);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      {open && (
        <div
          role={role}
          aria-label={label}
          className={cn(
            "absolute top-full z-40 mt-2 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-card border border-line bg-surface shadow-lg",
            align === "end" ? "right-0" : "left-0",
            panelWidth,
          )}
        >
          {typeof children === "function" ? children({ close }) : children}
        </div>
      )}
    </div>
  );
}

export function DropdownSection({ className, ...props }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-1.5", className)} {...props} />;
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-fg-subtle uppercase">
      {children}
    </p>
  );
}

export function DropdownSeparator() {
  return <div role="separator" className="my-1 h-px bg-line" />;
}

export interface DropdownItemProps {
  children: ReactNode;
  icon?: IconComponent;
  onClick?: () => void;
  disabled?: boolean;
  /** Secondary line shown under the label. */
  note?: string;
  active?: boolean;
}

export function DropdownItem({
  children,
  icon: Icon,
  onClick,
  disabled,
  note,
  active,
}: DropdownItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-control px-2.5 py-2 text-left text-sm transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-55",
        active ? "bg-brand-soft text-brand-soft-fg" : "text-fg hover:bg-surface-inset",
      )}
    >
      {Icon && <Icon width={15} height={15} aria-hidden className="mt-0.5 shrink-0 text-fg-subtle" />}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{children}</span>
        {note && <span className="mt-0.5 block text-xs text-fg-subtle">{note}</span>}
      </span>
    </button>
  );
}
