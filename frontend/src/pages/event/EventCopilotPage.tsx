import { Bot, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import { CopilotComposer, CopilotMessageBubble } from "@/components/ai";
import { Badge, Button, Card, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useCurrentEvent } from "@/hooks/useCurrentEvent";
import { useCopilot } from "@/hooks/useCopilot";
import { QUICK_PROMPTS } from "@/lib/copilot";
import { isMockApi } from "@/services/apiMode";

export default function EventCopilotPage() {
  const { eventId = "" } = useParams();
  const event = useCurrentEvent();
  const { user } = useAuth();
  const copilot = useCopilot(eventId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view without hijacking scroll on first paint.
  useEffect(() => {
    if (copilot.messages.length === 0) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [copilot.messages.length, copilot.status]);

  const userName = user?.name ?? "You";

  return (
    <div className="space-y-5">
      <PageHeader
        size="md"
        divider={false}
        title="AI Copilot"
        description={`Your event operations assistant for ${event.name}. Ask about tasks, volunteers, meetings, documents, risks and upcoming deadlines.`}
        meta={
          copilot.capabilities ? (
            <>
              <Badge tone={isMockApi ? "warning" : "success"}>
                {isMockApi ? "Development stub" : "Connected"}
              </Badge>
              {copilot.capabilities.sources && <Badge tone="neutral" variant="outline">Cites sources</Badge>}
              {!copilot.capabilities.streaming && <Badge tone="neutral" variant="outline">Request / response</Badge>}
            </>
          ) : undefined
        }
        actions={
          copilot.canChat && copilot.messages.length > 0 ? (
            <Button variant="outline" leadingIcon={RotateCcw} onClick={() => void copilot.clear()} disabled={copilot.isBusy}>
              New conversation
            </Button>
          ) : undefined
        }
      />

      {isMockApi && (
        <PreviewNotice>
          <span className="font-medium text-fg">No AI model is connected.</span> Replies come from a
          deterministic development stub that reads this event's recorded tasks, risks, volunteers,
          meetings and announcements and lists them. Part 14 wires the real service.
        </PreviewNotice>
      )}

      {copilot.isBootstrapping ? (
        <Skeleton className="h-[32rem] rounded-card" />
      ) : copilot.capabilitiesError || !copilot.capabilities?.chat ? (
        <ErrorState
          title="AI Copilot is unavailable"
          description={copilot.capabilitiesError ?? "The AI service has not enabled chat for this event."}
          onRetry={() => void copilot.retryBootstrap()}
          retryLabel="Try again"
        />
      ) : (
        <Card className="flex h-[min(70vh,44rem)] min-h-[28rem] flex-col overflow-hidden">
          <div
            ref={scrollRef}
            className="scrollbar-slim flex-1 overflow-y-auto px-4 py-5 sm:px-6"
            role="log"
            aria-live="polite"
            aria-label="Conversation with ClubOps AI"
          >
            {copilot.messages.length === 0 ? (
              <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand-soft-fg">
                  <Bot width={20} height={20} aria-hidden />
                </span>
                <p className="mt-4 text-sm font-semibold text-fg">Ask about {event.name}</p>
                <p className="mt-1 text-sm text-fg-muted">
                  Answers are grounded in this event's data only. Start with one of these:
                </p>
                <ul className="mt-5 flex flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <li key={prompt}>
                      <button
                        type="button"
                        onClick={() => void copilot.send(prompt)}
                        disabled={copilot.isBusy}
                        className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-fg transition-colors hover:border-brand/40 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="mx-auto max-w-3xl space-y-5">
                {copilot.messages.map((message) => (
                  <CopilotMessageBubble key={message.id} eventId={eventId} message={message} userName={userName} />
                ))}
                {copilot.isBusy && (
                  <li className="flex gap-3" aria-live="polite">
                    <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-soft-fg">
                      <Bot width={14} height={14} />
                    </span>
                    <div className="inline-flex items-center gap-2 rounded-card border border-line bg-surface px-4 py-3 text-sm text-fg-muted shadow-xs">
                      <Loader2 width={14} height={14} aria-hidden className="animate-spin" />
                      <span role="status">ClubOps AI is checking your event data…</span>
                    </div>
                  </li>
                )}
              </ul>
            )}
          </div>

          {copilot.messages.length > 0 && (
            <div className="border-t border-line bg-surface-subtle px-4 py-2 sm:px-6">
              <ul className="scrollbar-slim flex gap-2 overflow-x-auto">
                {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
                  <li key={prompt} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => void copilot.send(prompt)}
                      disabled={copilot.isBusy}
                      className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-fg-muted transition-colors hover:border-brand/40 hover:text-brand disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <CopilotComposer
            disabled={!copilot.canChat}
            busy={copilot.isBusy}
            onSend={(text) => void copilot.send(text)}
            placeholder={`Ask about ${event.name}…`}
          />
        </Card>
      )}

      <p className="flex items-start gap-2 text-[11px] text-fg-subtle">
        <ShieldCheck width={13} height={13} aria-hidden className="mt-0.5 shrink-0" />
        AI-generated responses may be incomplete. Verify important details before acting. The
        Copilot suggests and navigates; it never changes tasks, volunteers, risks or announcements on
        its own.
      </p>
    </div>
  );
}
