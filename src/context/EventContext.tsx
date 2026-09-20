import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMatch } from "react-router-dom";
import { eventService } from "@/services/eventService";
import { isMockApi } from "@/services/apiMode";
import type { ClubEvent, ListEvent } from "@/types";

interface EventContextValue {
  /** Events available to the workspace. Empty when none exist. */
  events: ClubEvent[];
  currentEvent: ClubEvent;
  currentEventId: string;
  /** True when the workspace has at least one event to operate on. */
  hasActiveEvent: boolean;
  /** True during the initial event load. */
  isLoading: boolean;
  selectEvent: (eventId: string) => void;
  findEvent: (eventId: string | undefined) => ClubEvent | undefined;
  /** Reloads events from the service (e.g. after create/edit). */
  refreshEvents: () => void;
  /** True while the shell runs on the mock adapter. */
  isPreviewData: boolean;
}

const EventContext = createContext<EventContextValue | null>(null);

/**
 * Neutral fallback so the shell keeps rendering even when a workspace has no
 * events at all — the dashboard shows its empty state instead of crashing.
 */
const NO_EVENT: ClubEvent = {
  id: "",
  name: "No event selected",
  code: "—",
  status: "draft",
  startIso: new Date().toISOString(),
  endIso: new Date().toISOString(),
  venue: "—",
  summary: "No event is currently active in this workspace.",
  attendeesExpected: null,
  teamSize: null,
  readiness: 0,
};

/** Service DTO → shell model. Nulls stay null; nothing is fabricated. */
function toClubEvent(dto: ListEvent): ClubEvent {
  return {
    id: dto.id,
    name: dto.name,
    code: dto.code,
    status: dto.status,
    startIso: dto.startIso,
    endIso: dto.endIso,
    venue: dto.venue,
    summary: dto.summary ?? "",
    attendeesExpected: dto.attendeesExpected,
    teamSize: dto.teamSize,
    readiness: dto.readiness,
  };
}

/**
 * Holds the event the workspace is currently operating on.
 *
 * Part 14: events now come from eventService (real API or mock adapter via
 * VITE_API_MODE) instead of a direct demo-data import, so no mock records can
 * leak into the production data path. The selection still follows
 * `/events/:eventId` routes so sidebar, topbar and breadcrumbs agree with
 * the URL.
 */
export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    eventService
      .listEvents()
      .then((response) => {
        if (!active) return;
        const mapped = response.events.map(toClubEvent);
        setEvents(mapped);
        setSelectedId((current) =>
          current && mapped.some((event) => event.id === current)
            ? current
            : (mapped[0]?.id ?? ""),
        );
        setIsLoading(false);
      })
      .catch(() => {
        // The shell must keep rendering; feature pages surface their own errors.
        if (!active) return;
        setEvents([]);
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [nonce]);

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
    const currentEvent = events.find((event) => event.id === selectedId) ?? events[0] ?? NO_EVENT;
    return {
      events,
      currentEvent,
      currentEventId: currentEvent.id,
      // Treated as active while loading so the dashboard's "no event" empty
      // state never flashes before the first response arrives.
      hasActiveEvent: isLoading || events.length > 0,
      isLoading,
      selectEvent: setSelectedId,
      findEvent,
      refreshEvents: () => setNonce((value) => value + 1),
      isPreviewData: isMockApi,
    };
  }, [events, selectedId, isLoading, findEvent]);

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventContext(): EventContextValue {
  const context = useContext(EventContext);
  if (!context) throw new Error("useEventContext must be used within an EventProvider");
  return context;
}
