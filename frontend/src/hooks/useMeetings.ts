import { useCallback, useEffect, useRef, useState } from "react";
import { describeApiError } from "@/services/http";
import { meetingService } from "@/services/meetingService";
import type {
  CreateMeetingRequest,
  EventMember,
  Meeting,
  MeetingIntelligence,
  MeetingTranscript,
  UpdateMeetingRequest,
} from "@/types";

const POLL_INTERVAL_MS = 2_500;

export function useMeetings(eventId: string) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    meetingService
      .listMeetings(eventId)
      .then((response) => {
        if (!active) return;
        setMeetings(response.meetings);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeApiError(cause, "Unable to load meetings."));
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId, nonce]);

  return { meetings, error, isLoading, refetch: () => setNonce((value) => value + 1) };
}

/**
 * Meeting workspace data. The meeting record, transcript and intelligence are
 * loaded independently so a failure in one section degrades only that section.
 * While the backend reports `processing`, the meeting record is polled.
 */
export function useMeeting(eventId: string, meetingId: string) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [meetingError, setMeetingError] = useState<string | null>(null);
  const [meetingLoading, setMeetingLoading] = useState(true);

  const [transcript, setTranscript] = useState<MeetingTranscript | null>(null);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(true);

  const [intelligence, setIntelligence] = useState<MeetingIntelligence | null>(null);
  const [intelligenceError, setIntelligenceError] = useState<string | null>(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);

  const [nonce, setNonce] = useState(0);
  const processingRef = useRef<string | null>(null);

  // Meeting record + transcript.
  useEffect(() => {
    let active = true;
    setMeetingLoading(true);
    setMeetingError(null);
    setTranscriptLoading(true);
    setTranscriptError(null);

    meetingService
      .getMeeting(eventId, meetingId)
      .then((result) => {
        if (!active) return;
        setMeeting(result);
        setMeetingLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setMeetingError(describeApiError(cause, "Unable to load this meeting."));
        setMeetingLoading(false);
      });

    meetingService
      .getMeetingTranscript(eventId, meetingId)
      .then((result) => {
        if (!active) return;
        setTranscript(result);
        setTranscriptLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setTranscriptError(describeApiError(cause, "Unable to load the transcript."));
        setTranscriptLoading(false);
      });

    return () => {
      active = false;
    };
  }, [eventId, meetingId, nonce]);

  // Intelligence — only requested once the backend reports completion.
  const processingStatus = meeting?.processingStatus ?? null;
  useEffect(() => {
    if (processingStatus !== "completed") {
      setIntelligence(null);
      return;
    }
    let active = true;
    setIntelligenceLoading(true);
    setIntelligenceError(null);
    meetingService
      .getMeetingIntelligence(eventId, meetingId)
      .then((result) => {
        if (!active) return;
        setIntelligence(result);
        setIntelligenceLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setIntelligenceError(describeApiError(cause, "Unable to load meeting intelligence."));
        setIntelligenceLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId, meetingId, processingStatus, nonce]);

  // Poll while processing so the UI reflects the backend's state changes.
  useEffect(() => {
    if (processingStatus !== "processing") return;
    processingRef.current = meetingId;
    const timer = window.setInterval(() => {
      meetingService
        .getMeeting(eventId, meetingId)
        .then((result) => {
          if (processingRef.current !== meetingId) return;
          setMeeting(result);
        })
        .catch(() => {
          /* transient poll failure — the next tick retries */
        });
    }, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
      processingRef.current = null;
    };
  }, [eventId, meetingId, processingStatus]);

  const applyMeeting = useCallback((next: Meeting) => setMeeting(next), []);
  const applyTranscript = useCallback((next: MeetingTranscript) => {
    setTranscript(next);
    setMeeting((current) => (current ? { ...current, hasTranscript: next.text.length > 0 } : current));
  }, []);
  const applyIntelligence = useCallback((next: MeetingIntelligence) => setIntelligence(next), []);

  return {
    meeting,
    meetingError,
    meetingLoading,
    transcript,
    transcriptError,
    transcriptLoading,
    intelligence,
    intelligenceError,
    intelligenceLoading,
    refetch: () => setNonce((value) => value + 1),
    applyMeeting,
    applyTranscript,
    applyIntelligence,
  };
}

export function useMeetingMembers(eventId: string) {
  const [members, setMembers] = useState<EventMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    meetingService
      .listMembers(eventId)
      .then((result) => {
        if (!active) return;
        setMembers(result);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeApiError(cause, "Unable to load members."));
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  return { members, error, isLoading };
}

export function useMeetingMutations() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(work: () => Promise<T>, fallback: string): Promise<T> => {
    setIsSaving(true);
    setError(null);
    try {
      return await work();
    } catch (cause: unknown) {
      setError(describeApiError(cause, fallback));
      throw cause;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    isSaving,
    error,
    clearError: () => setError(null),
    create: (eventId: string, request: CreateMeetingRequest) =>
      run(() => meetingService.createMeeting(eventId, request), "Unable to create the meeting."),
    update: (eventId: string, meetingId: string, request: UpdateMeetingRequest) =>
      run(() => meetingService.updateMeeting(eventId, meetingId, request), "Unable to save the meeting."),
    saveTranscript: (eventId: string, meetingId: string, text: string) =>
      run(() => meetingService.saveMeetingTranscript(eventId, meetingId, text), "Unable to save the transcript."),
    process: (eventId: string, meetingId: string) =>
      run(() => meetingService.processMeeting(eventId, meetingId), "Unable to start processing."),
    createTask: (eventId: string, meetingId: string, actionItemId: string) =>
      run(
        () => meetingService.createTaskFromActionItem(eventId, meetingId, actionItemId),
        "Unable to create a task from this action item.",
      ),
  };
}
