import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMatch } from "react-router-dom";
import { DEFAULT_EVENT_ID, DEMO_EVENTS } from "@/data/demoEvents";
import type { ClubEvent } from "@/types";

interface EventContextValue {
  /** Events available to the workspace (preview data for now). */
  events: ClubEvent[];
  currentEvent: ClubEvent;
  currentEventId: string;
  selectEvent: (eventId: string) => void;
  findEvent: (eventId: string | undefined) => ClubEvent | undefined;
  /** True while the shell runs on temporary preview content. */
  isPreviewData: boolean;
}

const EventContext = createContext<EventContextValue | null>(null);

/**
 * Holds the event the workspace is currently operating on.
 * The selection follows `/events/:eventId` routes so the sidebar, topbar and
 * breadcrumbs always agree with the URL.
 */
export function EventProvider({ children }: { children: ReactNode }) {
  const events = DEMO_EVENTS;
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_EVENT_ID);

  const exactMatch = useMatch("/events/:eventId");
  const nestedMatch = useMatch("/events/:eventId/*");
  const routeEventId = exactMatch?.params.eventId ?? nestedMatch?.params.eventId;

  useEffect(() => {
    if (routeEventId && events.some((event) => event.id === routeEventId)) {
      setSelectedId(routeEventId);
    }
  }, [routeEventId, events]);

  const findEvent = useCallback(
    (eventId: string | undefined) => events.find((event) => event.id === eventId),
    [events],
  );

  const value = useMemo<EventContextValue>(() => {
    const currentEvent = events.find((event) => event.id === selectedId) ?? events[0]!;
    return {
      events,
      currentEvent,
      currentEventId: currentEvent.id,
      selectEvent: setSelectedId,
      findEvent,
      isPreviewData: true,
    };
  }, [events, selectedId, findEvent]);

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventContext(): EventContextValue {
  const context = useContext(EventContext);
  if (!context) throw new Error("useEventContext must be used within an EventProvider");
  return context;
}
