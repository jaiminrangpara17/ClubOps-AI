import { AlertTriangle, ArrowUpRight, Bot, Link2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { sourceKindLabel, sourcePath, suggestedActionPath } from "@/lib/copilot";
import type { CopilotMessage as CopilotMessageData } from "@/types";
import { SafeMarkdown } from "./SafeMarkdown";

export function CopilotMessageBubble({
  eventId,
  message,
  userName,
}: {
  eventId: string;
  message: CopilotMessageData;
  userName: string;
}) {
  const isUser = message.role === "user";

  return (
    <li className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {isUser ? (
        <Avatar name={userName} size="sm" tone="neutral" />
      ) : (
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-soft-fg"
        >
          <Bot width={14} height={14} />
        </span>
      )}

      <div className={cn("min-w-0 max-w-[85%] space-y-2", isUser && "text-right")}>
        <span className="sr-only">{isUser ? `${userName} said` : "ClubOps AI replied"}</span>

        <div
          className={cn(
            "inline-block rounded-card px-4 py-3 text-left",
            isUser
              ? "bg-brand text-white"
              : message.error
                ? "border border-danger/30 bg-danger-soft"
                : "border border-line bg-surface shadow-xs",
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : message.error ? (
            <p className="flex items-start gap-2 text-sm text-danger" role="alert">
              <AlertTriangle width={15} height={15} aria-hidden className="mt-0.5 shrink-0" />
              {message.content}
            </p>
          ) : (
            <SafeMarkdown content={message.content} />
          )}
        </div>

        {!isUser && !message.error && message.sources.length > 0 && (
          <div className="rounded-control border border-line bg-surface-subtle px-3 py-2 text-left">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-fg-muted uppercase">
              <Link2 width={11} height={11} aria-hidden />
              Sources
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {message.sources.map((source) => (
                <li key={`${source.kind}-${source.id}`}>
                  <Link
                    to={sourcePath(eventId, source)}
                    aria-label={`Open ${sourceKindLabel(source.kind).toLowerCase()}: ${source.label}`}
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-fg transition-colors hover:border-brand/40 hover:text-brand"
                  >
                    <span className="text-fg-subtle">{sourceKindLabel(source.kind)}:</span>
                    <span className="max-w-[16rem] truncate">{source.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isUser && !message.error && message.suggestedActions.length > 0 && (
          <div className="text-left">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-fg-muted uppercase">
              <Sparkles width={11} height={11} aria-hidden />
              Suggested actions
              <Badge tone="neutral" variant="outline" className="normal-case tracking-normal">
                Navigation only
              </Badge>
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {message.suggestedActions.map((action) => (
                <li key={action.id}>
                  <Link
                    to={suggestedActionPath(eventId, action)}
                    className="flex items-start justify-between gap-3 rounded-control border border-dashed border-line-strong bg-surface-subtle px-3 py-2 transition-colors hover:border-brand/40"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-fg">{action.label}</span>
                      {action.description && (
                        <span className="mt-0.5 block text-xs text-fg-muted">{action.description}</span>
                      )}
                    </span>
                    <ArrowUpRight width={14} height={14} aria-hidden className="mt-0.5 shrink-0 text-fg-subtle" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </li>
  );
}
