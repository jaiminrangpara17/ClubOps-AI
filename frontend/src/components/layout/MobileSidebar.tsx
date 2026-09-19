import { useEffect, useRef } from "react";
import { SidebarContent } from "./Sidebar";
import { cn } from "@/lib/cn";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

export interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

/** Off-canvas navigation drawer used below the `lg` breakpoint. */
export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    // Move focus into the drawer so keyboard users land in the navigation.
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div className="lg:hidden" inert={!open}>
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/50 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={open}
        aria-label="Navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-sidebar max-w-[85%] shadow-pop transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent onNavigate={onClose} onClose={onClose} />
      </div>
    </div>
  );
}
