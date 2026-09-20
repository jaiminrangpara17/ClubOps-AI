import { useCallback, useEffect, useState } from "react";
import { describeApiError } from "@/services/http";
import { documentService } from "@/services/documentService";
import { meetingService } from "@/services/meetingService";
import { riskService } from "@/services/riskService";
import { taskService } from "@/services/taskService";
import type {
  ClubDocument,
  CreateRiskRequest,
  EventMember,
  Meeting,
  Risk,
  Task,
  UpdateRiskRequest,
} from "@/types";

export function useRiskCapabilities(eventId: string) {
  const [capabilities, setCapabilities] = useState<Awaited<ReturnType<typeof riskService.getCapabilities>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    riskService.getCapabilities(eventId).then((value) => {
      if (!active) return;
      setCapabilities(value);
      setIsLoading(false);
    }).catch(() => {
      if (!active) return;
      setCapabilities(null);
      setError("Risk capabilities are unavailable.");
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [eventId]);

  return { capabilities, error, isLoading };
}

export function useRisks(eventId: string) {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    riskService.listRisks(eventId)
      .then((response) => {
        if (!active) return;
        setRisks(response.risks);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeApiError(cause, "Unable to load risks."));
        setIsLoading(false);
      });
    return () => { active = false; };
  }, [eventId, nonce]);

  return { risks, error, isLoading, refetch: () => setNonce((value) => value + 1) };
}

/** Detailed risk + only the explicit linked records that exist. */
export function useRisk(eventId: string, riskId: string) {
  const [risk, setRisk] = useState<Risk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [linkedTask, setLinkedTask] = useState<Task | null>(null);
  const [linkedMeeting, setLinkedMeeting] = useState<Meeting | null>(null);
  const [linkedDocument, setLinkedDocument] = useState<ClubDocument | null>(null);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksError, setLinksError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    setLinkedTask(null);
    setLinkedMeeting(null);
    setLinkedDocument(null);
    riskService.getRisk(eventId, riskId)
      .then((value) => {
        if (!active) return;
        setRisk(value);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeApiError(cause, "Unable to load this risk."));
        setIsLoading(false);
      });
    return () => { active = false; };
  }, [eventId, riskId, nonce]);

  const taskId = risk?.mitigation?.taskId ?? risk?.references.taskId ?? null;
  const meetingId = risk?.references.meetingId ?? null;
  const documentId = risk?.references.documentId ?? null;
  useEffect(() => {
    if (!risk) return;
    let active = true;
    const operations: Promise<void>[] = [];
    setLinksLoading(Boolean(taskId || meetingId || documentId));
    setLinksError(null);

    if (taskId) {
      operations.push(taskService.getTask(eventId, taskId).then((value) => {
        if (active) setLinkedTask(value);
      }));
    }
    if (meetingId) {
      operations.push(meetingService.getMeeting(eventId, meetingId).then((value) => {
        if (active) setLinkedMeeting(value);
      }));
    }
    if (documentId) {
      operations.push(documentService.getDocument(eventId, documentId).then((value) => {
        if (active) setLinkedDocument(value);
      }));
    }

    if (operations.length === 0) {
      setLinksLoading(false);
      return;
    }
    Promise.all(operations)
      .catch((cause: unknown) => {
        if (active) setLinksError(describeApiError(cause, "Unable to load linked records."));
      })
      .finally(() => {
        if (active) setLinksLoading(false);
      });
    return () => { active = false; };
  }, [eventId, risk, taskId, meetingId, documentId]);

  return {
    risk,
    error,
    isLoading,
    linkedTask,
    linkedMeeting,
    linkedDocument,
    linksLoading,
    linksError,
    refetch: () => setNonce((value) => value + 1),
    applyRisk: (next: Risk) => setRisk(next),
  };
}

export function useRiskMembers(eventId: string) {
  const [members, setMembers] = useState<EventMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let active = true;
    riskService.listMembers(eventId)
      .then((value) => {
        if (!active) return;
        setMembers(value);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeApiError(cause, "Unable to load members."));
        setIsLoading(false);
      });
    return () => { active = false; };
  }, [eventId]);
  return { members, error, isLoading };
}

export function useRiskMutations() {
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
    create: (eventId: string, request: CreateRiskRequest) =>
      run(() => riskService.createRisk(eventId, request), "Unable to create this risk."),
    update: (eventId: string, riskId: string, request: UpdateRiskRequest) =>
      run(() => riskService.updateRisk(eventId, riskId, request), "Unable to save this risk."),
    transition: (eventId: string, riskId: string, status: Risk["status"]) =>
      run(() => riskService.transitionRisk(eventId, riskId, status), "Unable to update risk status."),
    createMitigationTask: (eventId: string, riskId: string) =>
      run(() => riskService.createMitigationTask(eventId, riskId), "Unable to create mitigation task."),
  };
}