import { ChevronsUpDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSection,
  DropdownSeparator,
  StatusBadge,
} from "@/components/ui";
import { useEventContext } from "@/context/EventContext";
import { cn } from "@/lib/cn";
import { formatDateRange } from "@/lib/format";

/**
 * Topbar event context. Switching keeps the current module when the user is
 * already inside an event route (e.g. /events/a/tasks → /events/b/tasks).
 */
export function EventSwitcher() {
  const { events, currentEvent, selectEvent } = useEventContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleSelect = (eventId: string) => {
    selectEvent(eventId);
    const segments = pathname.split("/").filter(Boolean);
    const insideEvent = segments[0] === "events" && segments.length >= 2;
    const moduleSegment = insideEvent && segments.length >= 3 ? `/${segments[2]}` : "";
    navigate(insideEvent ? `/events/${eventId}${moduleSegment}` : `/events/${eventId}`);
  };

  return (
    <Dropdown
      align="start"
      panelWidth="w-[19rem]"
      label="Select event"
      className="min-w-0"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="menu"
          className={cn(
            "flex min-w-0 items-center gap-2 rounded-control px-2 py-1.5 text-left transition-colors hover:bg-surface-inset",
            open && "bg-surface-inset",
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-brand-soft text-[10px] font-bold text-brand-soft-fg">
            {currentEvent.code.slice(0, 2)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-fg">{currentEvent.name}</span>
            <span className="hidden truncate text-[11px] text-fg-subtle sm:block">
              {formatDateRange(currentEvent.startIso, currentEvent.endIso)}
            </span>
          </span>
          <ChevronsUpDown width={14} height={14} aria-hidden className="shrink-0 text-fg-subtle" />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <DropdownSection>
            <DropdownLabel>Switch event</DropdownLabel>
            {events.map((event) => (
              <DropdownItem
                key={event.id}
                active={event.id === currentEvent.id}
                note={formatDateRange(event.startIso, event.endIso)}
                onClick={() => {
                  handleSelect(event.id);
                  close();
                }}
              >
                {event.name}
              </DropdownItem>
            ))}
          </DropdownSection>
          <DropdownSeparator />
          <DropdownSection>
            <DropdownItem
              onClick={() => {
                navigate("/events");
                close();
              }}
            >
              View all events
            </DropdownItem>
            <div className="flex items-center justify-between gap-2 px-2.5 py-2">
              <span className="text-xs text-fg-subtle">Current status</span>
              <StatusBadge status={currentEvent.status} />
            </div>
          </DropdownSection>
        </>
      )}
    </Dropdown>
  );
}
