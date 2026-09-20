import { useCallback, useEffect, useRef, useState } from "react";
import { aiActionService } from "@/services/aiActionService";
import { describeApiError } from "@/services/http";
import type { AiAction, AiActionCapabilities } from "@/types";

export function useAiActionCapabilities(eventId: string) {
  const [capabilities, setCapabilities] = useState<AiActionCapabilities | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    aiActionService
      .getCapabilities(eventId)
      .then((value) => {
        if (!active) return;
        setCapabilities(value);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setCapabilities(null);
        setError("AI action capabilities are unavailable.");
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  return { capabilities, error, isLoading };
}

export function useAiActions(eventId: string) {
  const [actions, setActions] = useState<AiAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    aiActionService
      .listActions(eventId)
      .then((response) => {
        if (!active) return;
        setActions(response.actions);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeApiError(cause, "Unable to load AI actions."));
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId, nonce]);

  return {
    actions,
    error,
    isLoading,
    refetch: () => setNonce((value) => value + 1),
  };
}

export function useAiActionsCount(eventId: string): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    aiActionService
      .listActions(eventId)
      .then((response) => {
        if (!active) return;
        setCount(response.actions.filter((action) => action.status === "pending").length);
      })
      .catch(() => {
        if (active) setCount(0);
      });
    return () => {
      active = false;
    };
  }, [eventId]);
  return count;
}

export function useAiAction(eventId: string, actionId: string) {
  const [action, setAction] = useState<AiAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    aiActionService
      .getAction(eventId, actionId)
      .then((value) => {
        if (!active) return;
        setAction(value);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeApiError(cause, "Unable to load this action."));
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId, actionId, nonce]);

  return {
    action,
    error,
    isLoading,
    refetch: () => setNonce((value) => value + 1),
    applyAction: (next: AiAction) => setAction(next),
  };
}

export type AiActionMutationKind = "approve" | "reject";

export function useAiActionMutations() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const run = useCallback(async (
    kind: AiActionMutationKind,
    eventId: string,
    actionId: string,
    reason?: string,
  ): Promise<AiAction> => {
    if (inFlight.current) throw new Error("Another action is already in progress.");
    inFlight.current = true;
    setBusyId(actionId);
    setError(null);
    try {
      const { action } =
        kind === "approve"
          ? await aiActionService.approveAction(eventId, actionId)
          : await aiActionService.rejectAction(eventId, actionId, reason);
      return action;
    } catch (cause: unknown) {
      const message = describeApiError(
        cause,
        kind === "approve" ? "Approval could not be completed." : "Rejection could not be completed.",
      );
      setError(message);
      throw cause;
    } finally {
      inFlight.current = false;
      setBusyId(null);
    }
  }, []);

  return { run, busyId, error, clearError: () => setError(null), isInFlight: inFlight.current };
}
