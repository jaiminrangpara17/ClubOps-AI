import { CalendarX } from "lucide-react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { EventContextHeader } from "./EventContextHeader";
import { EventTabs } from "./EventTabs";
import { Breadcrumb, Button, EmptyState } from "@/components/ui";
import { useEventContext } from "@/context/EventContext";
import { EVENT_TABS, isNavItemActive } from "@/lib/navigation";

/**
 * Layout route for `/events/:eventId/*`.
 * Supplies breadcrumbs, the event context header and module tabs to every
 * event page, and fails gracefully for unknown event ids.
 */
export function EventLayout() {
  const { eventId } = useParams();
  const { findEvent } = useEventContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const event = findEvent(eventId);

  if (!event) {
    return (
      <div className="space-y-4">
        <Breadcrumb items={[{ label: "Events", to: "/events" }, { label: "Unknown event" }]} />
        <EmptyState
          variant="page"
          icon={CalendarX}
          title="Event not found"
          description={`No event matches "${eventId}". It may have been removed, or the link is out of date.`}
          actions={<Button onClick={() => navigate("/events")}>Back to events</Button>}
        />
      </div>
    );
  }

  const activeTab = EVENT_TABS.find((tab) => isNavItemActive(tab, pathname));

  return (
    <div className="space-y-5">
      <Breadcrumb
        items={[
          { label: "Events", to: "/events" },
          { label: event.name, to: `/events/${event.id}` },
          ...(activeTab && activeTab.path ? [{ label: activeTab.label }] : []),
        ]}
      />
      <EventContextHeader event={event} />
      <EventTabs eventId={event.id} />
      <Outlet context={event} />
    </div>
  );
}
