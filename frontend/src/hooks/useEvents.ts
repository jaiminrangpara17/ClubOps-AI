import { useCallback, useEffect, useRef, useState } from "react";
import { describeApiError } from "@/services/http";
import { eventService } from "@/services/eventService";
import type { EventFilter, ListEvent } from "@/types";

interface EventsState {
  data: ListEvent[];
  error: string | null;
  isLoading: boolean;
}

const initialState: EventsState = { data: [], error: null, isLoading: true };

/**
 * Loads the list of events.
 * - Supports filtering by status.
 * - Supports client-side search.
 * - Refresh keeps existing data visible on failure.
 */
export function useEvents() {
  const [state, setState] = useState<EventsState>(initialState);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setState((current) => ({
      data: current.data,
      error: null,
      isLoading: current.data.length === 0,
    }));

    try {
      const response = await eventService.listEvents();
      if (requestId !== requestIdRef.current) return;
      setState({ data: response.events, error: null, isLoading: false });
    } catch (cause: unknown) {
      if (requestId !== requestIdRef.current) return;
      setState((current) => ({
        data: current.data,
        error: describeApiError(cause, "Unable to load events."),
        isLoading: false,
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refetch = useCallback(() => load(), [load]);

  return { ...state, refetch };
}

/**
 * Filters and searches the loaded events list.
 */
export function useFilteredEvents(
  events: ListEvent[],
  filter: EventFilter,
  searchQuery: string,
) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = events.filter((event) => {
    if (filter !== "all" && event.status !== filter) return false;
    if (!normalizedQuery) return true;

    const match = (
      event.name.toLowerCase().includes(normalizedQuery) ||
      event.venue.toLowerCase().includes(normalizedQuery) ||
      (event.summary ?? "").toLowerCase().includes(normalizedQuery)
    );
    return match;
  });

  return { filtered, count: filtered.length };
}
