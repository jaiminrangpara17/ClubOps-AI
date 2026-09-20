/**
 * Form utilities for the event create/edit workflow.
 * Keeps validation and field helpers in one place.
 */

export const EVENT_NAME_MIN = 3;
export const EVENT_NAME_MAX = 80;

/**
 * ISO date string for the earliest allowed event date.
 * Defaults to tomorrow so an event cannot be created in the past.
 */
export function minEventDateIso(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString().slice(0, 10);
}

/**
 * ISO date string for the latest allowed event date.
 * Defaults to 2 years from today.
 */
export function maxEventDateIso(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 2);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

export interface FieldErrors {
  name?: string;
  startIso?: string;
  endIso?: string;
  venue?: string;
  summary?: string;
  description?: string;
  attendeesExpected?: string;
  teamSize?: string;
}

export function validateEvent(data: {
  name?: string;
  startIso?: string;
  endIso?: string;
  venue?: string;
  summary?: string;
  description?: string;
  attendeesExpected?: number | string | null;
  teamSize?: number | string | null;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!data.name || data.name.trim().length < EVENT_NAME_MIN) {
    errors.name = `Event name must be at least ${EVENT_NAME_MIN} characters.`;
  } else if (data.name.length > EVENT_NAME_MAX) {
    errors.name = `Event name cannot exceed ${EVENT_NAME_MAX} characters.`;
  }

  if (!data.startIso) {
    errors.startIso = "Start date is required.";
  } else if (data.startIso < minEventDateIso()) {
    errors.startIso = "Event cannot start in the past.";
  }

  if (!data.endIso) {
    errors.endIso = "End date is required.";
  } else if (data.endIso && data.startIso && data.endIso < data.startIso) {
    errors.endIso = "End date cannot be before the start date.";
  }

  if (!data.venue || data.venue.trim().length === 0) {
    errors.venue = "Venue is required.";
  }

  if (data.attendeesExpected !== null && data.attendeesExpected !== undefined) {
    const num = Number(data.attendeesExpected);
    if (Number.isNaN(num) || num < 1) {
      errors.attendeesExpected = "Attendees must be a positive number.";
    } else if (num > 99_999) {
      errors.attendeesExpected = "Attendees cannot exceed 99,999.";
    }
  }

  if (data.teamSize !== null && data.teamSize !== undefined) {
    const num = Number(data.teamSize);
    if (Number.isNaN(num) || num < 1) {
      errors.teamSize = "Team size must be a positive number.";
    } else if (num > 999) {
      errors.teamSize = "Team size cannot exceed 999.";
    }
  }

  return errors;
}

export function normalizeEventRequest(data: {
  name: string;
  code?: string;
  startIso: string;
  endIso: string;
  venue: string;
  summary?: string;
  description?: string;
  attendeesExpected?: number | string | null;
  teamSize?: number | string | null;
}) {
  return {
    name: data.name.trim(),
    code: data.code?.trim(),
    startIso: data.startIso,
    endIso: data.endIso,
    venue: data.venue.trim(),
    summary: data.summary?.trim() ?? undefined,
    description: data.description?.trim() ?? undefined,
    attendeesExpected: data.attendeesExpected !== null && data.attendeesExpected !== undefined
      ? Number(data.attendeesExpected)
      : undefined,
    teamSize: data.teamSize !== null && data.teamSize !== undefined
      ? Number(data.teamSize)
      : undefined,
  };
}
