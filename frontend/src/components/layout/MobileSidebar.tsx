import { useEffect } from "react";
import { SidebarContent } from "./Sidebar";
import { cn } from "@/lib/cn";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

export interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

/** Off-canvas navigation drawer used below the `lg` breakpoint. */
export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div className={cn("lg:hidden", !open && "pointer-events-none")} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/50 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
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
