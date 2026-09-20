import { useCallback, useEffect, useRef, useState } from "react";
import { aiService } from "@/services/aiService";
import { ApiError, describeApiError } from "@/services/http";
import type { CopilotCapabilities, CopilotMessage, CopilotStatus } from "@/types";

const SEND_FAILED = "I couldn't reach the ClubOps AI service. Please try again.";

/** Copilot-specific message mapping layered over the shared API error taxonomy. */
function describeCopilotError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return "The AI service is busy right now. Please wait a moment and try again.";
    if (error.kind === "forbidden") return "You don't have access to the AI Copilot for this event.";
    if (error.kind === "not-found") return "This event could not be found by the AI service.";
    if (error.kind === "validation") return "That message couldn't be sent. Try a shorter, plain-text question.";
  }
  return describeApiError(error, SEND_FAILED);
}

/**
 * Owns one event-scoped conversation.
 * A new conversation is created per event; changing events discards the old
 * one so answers never mix events. Nothing is persisted locally.
 */
export function useCopilot(eventId: string) {
  const [capabilities, setCapabilities] = useState<CopilotCapabilities | null>(null);
  const [capabilitiesError, setCapabilitiesError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [status, setStatus] = useState<CopilotStatus>("idle");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const inFlightRef = useRef(false);

  const bootstrap = useCallback(async () => {
    setIsBootstrapping(true);
    setCapabilitiesError(null);
    setMessages([]);
    setConversationId(null);
    setStatus("idle");
    try {
      const caps = await aiService.getCapabilities(eventId);
      setCapabilities(caps);
      if (caps.chat) {
        const conversation = await aiService.createConversation(eventId);
        setConversationId(conversation.id);
        setMessages(conversation.messages);
      }
    } catch (cause: unknown) {
      setCapabilities(null);
      setCapabilitiesError(describeCopilotError(cause));
    } finally {
      setIsBootstrapping(false);
    }
  }, [eventId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      await bootstrap();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [bootstrap]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !conversationId || inFlightRef.current) return;
      inFlightRef.current = true;

      const userMessage: CopilotMessage = {
        id: `local_${Date.now().toString(36)}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
        sources: [],
        suggestedActions: [],
        isEmpty: false,
        error: null,
      };
      setMessages((current) => [...current, userMessage]);
      setStatus("thinking");

      try {
        const { message } = await aiService.sendMessage({ eventId, conversationId, message: trimmed });
        const normalised: CopilotMessage = {
          ...message,
          isEmpty: message.isEmpty || message.content.trim().length === 0,
          content: message.content.trim().length > 0
            ? message.content
            : "The AI service returned an empty response. Try rephrasing your question.",
        };
        setMessages((current) => [...current, normalised]);
        setStatus("idle");
      } catch (cause: unknown) {
        const safe = describeCopilotError(cause);
        setMessages((current) => [
          ...current,
          {
            id: `err_${Date.now().toString(36)}`,
            role: "assistant",
            content: safe,
            createdAt: new Date().toISOString(),
            sources: [],
            suggestedActions: [],
            isEmpty: false,
            error: safe,
          },
        ]);
        setStatus("error");
      } finally {
        inFlightRef.current = false;
      }
    },
    [conversationId, eventId],
  );

  const clear = useCallback(async () => {
    if (conversationId) {
      try {
        await aiService.clearConversation(eventId, conversationId);
      } catch {
        // Clearing locally still proceeds; nothing is persisted client-side.
      }
    }
    await bootstrap();
  }, [bootstrap, conversationId, eventId]);

  return {
    capabilities,
    capabilitiesError,
    messages,
    status,
    isBootstrapping,
    isBusy: status === "thinking" || status === "streaming",
    canChat: Boolean(capabilities?.chat && conversationId),
    send,
    clear,
    retryBootstrap: bootstrap,
  };
}
