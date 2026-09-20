import { useCallback, useEffect, useRef, useState } from "react";
import { describeApiError } from "@/services/http";
import { eventService } from "@/services/eventService";
import type { CreateEventRequest, Event, UpdateEventRequest } from "@/types";

interface EventState {
  data: Event | null;
  error: string | null;
  isLoading: boolean;
}

const initialState: EventState = { data: null, error: null, isLoading: true };

/**
 * Loads a single event by id.
 */
export function useEvent(eventId: string) {
  const [state, setState] = useState<EventState>(initialState);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!eventId) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setState({
      data: null,
      error: null,
      isLoading: true,
    });

    eventService
      .getEvent(eventId)
      .then((event) => {
        if (requestId !== requestIdRef.current) return;
        setState({ data: event, error: null, isLoading: false });
      })
      .catch((cause: unknown) => {
        if (requestId !== requestIdRef.current) return;
        setState({
          data: null,
          error: describeApiError(cause, "Unable to load this event."),
          isLoading: false,
        });
      });
  }, [eventId]);

  return state;
}

/**
 * Creates a new event.
 */
export function useCreateEvent() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (request: CreateEventRequest) => {
      setIsCreating(true);
      setError(null);
      try {
        const event = await eventService.createEvent(request);
        return event;
      } catch (cause: unknown) {
        setError(describeApiError(cause, "Unable to create the event."));
        throw cause;
      } finally {
        setIsCreating(false);
      }
    },
    [],
  );

  return { create, isCreating, error, setError };
}

/**
 * Updates an existing event.
 */
export function useUpdateEvent() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (eventId: string, request: UpdateEventRequest) => {
      setIsUpdating(true);
      setError(null);
      try {
        const event = await eventService.updateEvent(eventId, request);
        return event;
      } catch (cause: unknown) {
        setError(describeApiError(cause, "Unable to update the event."));
        throw cause;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  return { update, isUpdating, error, setError };
}

/**
 * Deletes an event.
 */
export function useDeleteEvent() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(
    async (eventId: string) => {
      setIsDeleting(true);
      setError(null);
      try {
        await eventService.deleteEvent(eventId);
      } catch (cause: unknown) {
        setError(describeApiError(cause, "Unable to delete the event."));
        throw cause;
      } finally {
        setIsDeleting(false);
      }
    },
    [],
  );

  return { remove, isDeleting, error, setError };
}
