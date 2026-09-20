import { Bell } from "lucide-react";
import { Badge, Dropdown, DropdownLabel, DropdownSeparator } from "@/components/ui";
import { DEMO_NOTIFICATIONS } from "@/data/demoNotifications";
import { cn } from "@/lib/cn";

const DOT_TONES = {
  neutral: "bg-neutral",
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
} as const;

/** Notification UI placeholder — no delivery backend in this phase. */
export function NotificationsMenu() {
  return (
    <Dropdown
      panelWidth="w-80"
      label="Notifications"
      role="dialog"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={`Notifications (${DEMO_NOTIFICATIONS.length} unread, preview)`}
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-surface-inset hover:text-fg",
            open && "bg-surface-inset text-fg",
          )}
        >
          <Bell width={17} height={17} aria-hidden />
          <span
            aria-hidden
            className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-surface bg-danger"
          />
        </button>
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <p className="text-sm font-semibold text-fg">Notifications</p>
        <Badge tone="warning">Preview</Badge>
      </div>
      <DropdownSeparator />
      <ul className="max-h-80 overflow-y-auto py-1">
        {DEMO_NOTIFICATIONS.map((notification) => (
          <li key={notification.id} className="flex gap-2.5 px-3 py-2.5 hover:bg-surface-inset">
            <span
              aria-hidden
              className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", DOT_TONES[notification.tone])}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg">{notification.title}</p>
              <p className="truncate text-xs text-fg-muted">{notification.body}</p>
            </div>
            <span className="shrink-0 text-[11px] text-fg-subtle">{notification.timeLabel}</span>
          </li>
        ))}
      </ul>
      <DropdownSeparator />
      <div className="px-3 py-2.5">
        <DropdownLabel>Not connected</DropdownLabel>
        <p className="px-2.5 pb-1 text-xs text-fg-subtle">
          Real notifications arrive with the announcements service.
        </p>
      </div>
    </Dropdown>
  );
}
