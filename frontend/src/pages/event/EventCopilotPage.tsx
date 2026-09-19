import { Bot, Send, Sparkles } from "lucide-react";
import { PlannedCapabilities } from "@/components/common/PlannedCapabilities";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, PageHeader } from "@/components/ui";

const SUGGESTED_PROMPTS = [
  "What is blocking day-1 readiness?",
  "Summarise open risks by severity",
  "Which volunteer shifts are still unfilled?",
  "Draft an update for the committee",
];

export default function EventCopilotPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="AI Copilot"
        description="Ask questions and draft operational work from your event data."
        meta={<Badge tone="warning">Not connected</Badge>}
      />

      <PreviewNotice>
        <span className="font-medium text-fg">Copilot is not wired up.</span> This screen defines
        the conversation layout only — no model, retrieval or actions run in this build.
      </PreviewNotice>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot width={15} height={15} aria-hidden className="text-fg-subtle" />
              Conversation
            </CardTitle>
          </CardHeader>

          <CardContent className="flex min-h-72 flex-1 flex-col items-center justify-center gap-4 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand-soft-fg">
              <Sparkles width={20} height={20} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-fg">Copilot will answer from event data</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-fg-muted">
                Once connected, answers will cite the tasks, documents, meetings and risks they were
                derived from.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <span
                  key={prompt}
                  className="rounded-full border border-dashed border-line-strong bg-surface-subtle px-3 py-1.5 text-xs text-fg-muted"
                >
                  {prompt}
                </span>
              ))}
            </div>
          </CardContent>

          <div className="border-t border-line p-3">
            <div className="flex items-center gap-2 rounded-control border border-line bg-surface-inset px-3 py-2">
              <input
                type="text"
                disabled
                placeholder="Ask about this event…"
                aria-label="Message the copilot (disabled in this preview)"
                className="min-w-0 flex-1 bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none disabled:cursor-not-allowed"
              />
              <Button size="sm" iconOnly leadingIcon={Send} aria-label="Send message" disabled />
            </div>
            <p className="mt-2 px-1 text-[11px] text-fg-subtle">
              Input is disabled until the copilot service is available.
            </p>
          </div>
        </Card>

        <PlannedCapabilities
          items={[
            "Grounded answers over event data with citations",
            "Draft announcements, agendas and task lists",
            "Readiness and risk summaries on request",
            "Suggested actions reviewed before they run",
          ]}
        />
      </div>
    </div>
  );
}
