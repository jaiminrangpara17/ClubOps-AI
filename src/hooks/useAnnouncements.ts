import { useCallback, useEffect, useState } from "react";
import { describeApiError } from "@/services/http";
import { announcementService } from "@/services/announcementService";
import type {
  Announcement,
  AnnouncementCapabilities,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
} from "@/types";

export function useAnnouncementCapabilities(eventId: string) {
  const [capabilities, setCapabilities] = useState<AnnouncementCapabilities | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    announcementService
      .getCapabilities(eventId)
      .then((value) => {
        if (!active) return;
        setCapabilities(value);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setCapabilities(null);
        setError("Announcement capabilities are unavailable.");
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  return { capabilities, error, isLoading };
}

export function useAnnouncements(eventId: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    announcementService
      .listAnnouncements(eventId)
      .then((response) => {
        if (!active) return;
        setAnnouncements(response.announcements);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeApiError(cause, "Unable to load announcements."));
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId, nonce]);

  return { announcements, error, isLoading, refetch: () => setNonce((value) => value + 1) };
}

export function useAnnouncement(eventId: string, announcementId: string) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    announcementService
      .getAnnouncement(eventId, announcementId)
      .then((value) => {
        if (!active) return;
        setAnnouncement(value);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeApiError(cause, "Unable to load this announcement."));
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId, announcementId, nonce]);

  return {
    announcement,
    error,
    isLoading,
    refetch: () => setNonce((value) => value + 1),
    applyAnnouncement: (next: Announcement) => setAnnouncement(next),
  };
}

export function useAnnouncementMutations() {
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
    create: (eventId: string, request: CreateAnnouncementRequest) =>
      run(() => announcementService.createAnnouncement(eventId, request), "Unable to create this announcement."),
    update: (eventId: string, announcementId: string, request: UpdateAnnouncementRequest) =>
      run(
        () => announcementService.updateAnnouncement(eventId, announcementId, request),
        "Unable to save this announcement.",
      ),
    publish: (eventId: string, announcementId: string) =>
      run(
        () => announcementService.publishAnnouncement(eventId, announcementId),
        "Unable to publish this announcement.",
      ),
    unpublish: (eventId: string, announcementId: string) =>
      run(
        () => announcementService.unpublishAnnouncement(eventId, announcementId),
        "Unable to unpublish this announcement.",
      ),
    archive: (eventId: string, announcementId: string) =>
      run(
        () => announcementService.archiveAnnouncement(eventId, announcementId),
        "Unable to archive this announcement.",
      ),
  };
}
