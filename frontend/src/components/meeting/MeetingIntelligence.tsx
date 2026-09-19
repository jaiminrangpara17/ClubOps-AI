import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ListChecks,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/task/TaskBadges";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Skeleton,
} from "@/components/ui";
import { formatDate, formatDueLabel } from "@/lib/format";
import type {
  Meeting,
  MeetingActionItem,
  MeetingDecision,
  MeetingIntelligence,
  MeetingTranscript,
} from "@/types";

/* ------------------------------------------------------------------ */
/* Transcript                                                          */
/* ------------------------------------------------------------------ */

export function TranscriptPanel({
  transcript,
  isLoading,
  error,
  canEdit,
  isSaving,
  onSave,
  onRetry,
}: {
  transcript: MeetingTranscript | null;
  isLoading: boolean;
  error: string | null;
  canEdit: boolean;
  isSaving: boolean;
  onSave: (text: string) => Promise<void>;
  onRetry: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEditing = () => {
    setDraft(transcript?.text ?? "");
    setEditing(true);
  };

  const save = async () => {
    await onSave(draft);
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader
        actions={
          canEdit && !editing && !isLoading && !error ? (
            <Button size="sm" variant="outline" onClick={startEditing}>
              {transcript ? "Edit transcript" : "Add transcript"}
            </Button>
          ) : undefined
        }
      >
        <CardTitle className="flex items-center gap-2">
          <FileText width={15} height={15} aria-hidden className="text-fg-subtle" />
          Transcript
        </CardTitle>
        {transcript && !editing && (
          <p className="text-xs text-fg-subtle">Updated {formatDate(transcript.updatedAt)}</p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ) : error ? (
          <ErrorState variant="inline" title="Transcript unavailable" description={error} onRetry={onRetry} />
        ) : editing ? (
          <div className="space-y-3">
            <label htmlFor="transcript-text" className="sr-only">Transcript text</label>
            <textarea
              id="transcript-text"
              rows={12}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Paste the meeting transcript. Separate paragraphs with a blank line."
              className="w-full rounded-control border border-line bg-surface px-3 py-2 font-mono text-xs leading-relaxed text-fg shadow-xs focus:border-brand focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => void save()} loading={isSaving} disabled={draft.trim().length === 0}>
                Save transcript
              </Button>
            </div>
            <p className="text-[11px] text-fg-subtle">
              Plain-text transcripts only. File and audio upload are not available in this release.
            </p>
          </div>
        ) : transcript ? (
          <div className="scrollbar-slim max-h-[28rem] space-y-3 overflow-y-auto pr-2">
            {transcript.text.split(/\n\s*\n/).map((paragraph, index) => (
              <p key={index} className="text-sm leading-relaxed text-fg">
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No transcript is available for this meeting"
            description={
              canEdit
                ? "Add the transcript text to enable meeting intelligence."
                : "A transcript has not been added for this meeting."
            }
            actions={canEdit ? <Button size="sm" onClick={startEditing}>Add transcript</Button> : undefined}
          />
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Processing state                                                    */
/* ------------------------------------------------------------------ */

export function ProcessingPanel({
  meeting,
  canProcess,
  isStarting,
  onProcess,
  isSample,
}: {
  meeting: Meeting;
  canProcess: boolean;
  isStarting: boolean;
  onProcess: () => void;
  isSample: boolean;
}) {
  const status = meeting.processingStatus;

  if (status === "completed") return null;

  const content = {
    not_processed: {
      icon: Sparkles,
      tone: "text-fg-subtle",
      title: "Meeting intelligence has not been generated",
      description: meeting.hasTranscript
        ? "Process this meeting to extract decisions and action items from the transcript."
        : "Add a transcript first, then process the meeting to extract decisions and action items.",
    },
    processing: {
      icon: Loader2,
      tone: "text-warning",
      title: "Meeting intelligence is being generated…",
      description: "This page updates automatically when processing finishes.",
    },
    failed: {
      icon: AlertTriangle,
      tone: "text-danger",
      title: "We couldn't process this meeting",
      description: meeting.processingError ?? "The extraction job did not complete.",
    },
  }[status];

  const Icon = content.icon;

  return (
    <Card variant={status === "failed" ? "default" : "subtle"} className={status === "failed" ? "border-danger/30" : undefined}>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon
            width={18}
            height={18}
            aria-hidden
            className={`mt-0.5 shrink-0 ${content.tone} ${status === "processing" ? "animate-spin" : ""}`}
          />
          <div>
            <p className="text-sm font-semibold text-fg" role="status">{content.title}</p>
            <p className="mt-0.5 text-sm text-fg-muted">{content.description}</p>
            {isSample && status !== "processing" && (
              <p className="mt-1 text-[11px] text-fg-subtle">
                Development build: processing is simulated and returns sample intelligence.
              </p>
            )}
          </div>
        </div>
        {canProcess && status !== "processing" && (
          <Button
            leadingIcon={Sparkles}
            size="sm"
            onClick={onProcess}
            loading={isStarting}
            disabled={!meeting.hasTranscript}
            title={meeting.hasTranscript ? undefined : "Add a transcript first"}
          >
            {status === "failed" ? "Process again" : "Process meeting"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Decisions                                                           */
/* ------------------------------------------------------------------ */

export function DecisionsPanel({ decisions }: { decisions: MeetingDecision[] }) {
  return (
    <Card>
      <CardHeader actions={<Badge tone="neutral">{decisions.length}</Badge>}>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck width={15} height={15} aria-hidden className="text-fg-subtle" />
          Decisions
        </CardTitle>
      </CardHeader>
      <CardContent padding="none">
        {decisions.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No decisions were extracted" description="Decisions recorded in this meeting will be listed here." />
          </div>
        ) : (
          <ol className="divide-y divide-line">
            {decisions.map((decision, index) => (
              <li key={decision.id} className="flex gap-3 px-5 py-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-soft text-[11px] font-semibold text-success tabular-nums">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg">{decision.text}</p>
                  {decision.context && <p className="mt-0.5 text-xs text-fg-muted">{decision.context}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Action items → tasks                                                */
/* ------------------------------------------------------------------ */

export function ActionItemsPanel({
  eventId,
  actionItems,
  canCreateTasks,
  creatingId,
  onCreateTask,
}: {
  eventId: string;
  actionItems: MeetingActionItem[];
  canCreateTasks: boolean;
  creatingId: string | null;
  onCreateTask: (actionItemId: string) => void;
}) {
  const linked = actionItems.filter((item) => item.linkedTaskId).length;

  return (
    <Card>
      <CardHeader
        actions={
          <span className="text-xs text-fg-subtle tabular-nums">
            {linked}/{actionItems.length} tracked as tasks
          </span>
        }
      >
        <CardTitle className="flex items-center gap-2">
          <ListChecks width={15} height={15} aria-hidden className="text-fg-subtle" />
          Action items
        </CardTitle>
      </CardHeader>
      <CardContent padding="none">
        {actionItems.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No action items were extracted" description="Follow-up work identified in this meeting will appear here." />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {actionItems.map((item) => (
              <li key={item.id} className="flex flex-wrap items-start gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg">{item.text}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
                    <span className={item.ownerName ? "text-fg-muted" : undefined}>
                      {item.ownerName ?? "No owner"}
                    </span>
                    {item.dueIso && (
                      <>
                        <span aria-hidden>·</span>
                        <span>{formatDueLabel(item.dueIso)}</span>
                      </>
                    )}
                    {item.priority && (
                      <>
                        <span aria-hidden>·</span>
                        <TaskPriorityBadge priority={item.priority} compact />
                      </>
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {item.linkedTaskId ? (
                    <>
                      {item.linkedTaskStatus && <TaskStatusBadge status={item.linkedTaskStatus} />}
                      <Link
                        to={`/events/${eventId}/tasks`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand underline-offset-4 hover:underline"
                        title="Open the event task workspace"
                      >
                        <CheckCircle2 width={13} height={13} aria-hidden />
                        Task created
                        <ArrowUpRight width={12} height={12} aria-hidden />
                      </Link>
                    </>
                  ) : canCreateTasks ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCreateTask(item.id)}
                      loading={creatingId === item.id}
                      disabled={creatingId !== null && creatingId !== item.id}
                    >
                      Create task
                    </Button>
                  ) : (
                    <Badge tone="neutral" variant="outline">Not tracked</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Summary strip                                                       */
/* ------------------------------------------------------------------ */

export function IntelligenceSummary({
  intelligence,
  isSample,
}: {
  intelligence: MeetingIntelligence;
  isSample: boolean;
}) {
  if (!intelligence.summary) return null;
  return (
    <Card variant="subtle">
      <CardContent className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand-soft-fg">
          <Sparkles width={15} height={15} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-fg">
            Meeting summary
            <Badge tone={isSample ? "warning" : "neutral"} variant="outline">
              {isSample ? "Sample output" : "Generated"}
            </Badge>
            {intelligence.generatedAt && (
              <span className="font-normal text-fg-subtle">{formatDate(intelligence.generatedAt)}</span>
            )}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">{intelligence.summary}</p>
        </div>
      </CardContent>
    </Card>
  );
}
