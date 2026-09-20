import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FileText,
  Link2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
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
import { isDocumentProcessing } from "@/lib/document";
import { formatDate } from "@/lib/format";
import type {
  ClubDocument,
  DocumentContent,
  DocumentIntelligence,
  DocumentRelations,
} from "@/types";

/* ------------------------------------------------------------------ */
/* Processing state                                                    */
/* ------------------------------------------------------------------ */

export function DocumentProcessingPanel({
  document,
  canRetry,
  isRetrying,
  onRetry,
}: {
  document: ClubDocument;
  canRetry: boolean;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  if (document.status === "ready") return null;

  const content = isDocumentProcessing(document.status)
    ? {
        icon: Loader2,
        tone: "text-warning",
        spin: true,
        title: "Document is being processed…",
        description: "This page updates automatically when processing finishes.",
      }
    : document.status === "failed"
      ? {
          icon: AlertTriangle,
          tone: "text-danger",
          spin: false,
          title: "Document processing failed",
          description: document.processingError ?? "The processing job did not complete.",
        }
      : {
          icon: FileText,
          tone: "text-fg-subtle",
          spin: false,
          title: "Document has not been processed",
          description: "Extracted content and intelligence appear once processing completes.",
        };

  const Icon = content.icon;

  return (
    <Card
      variant={document.status === "failed" ? "default" : "subtle"}
      className={document.status === "failed" ? "border-danger/30" : undefined}
    >
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon
            width={18}
            height={18}
            aria-hidden
            className={`mt-0.5 shrink-0 ${content.tone} ${content.spin ? "animate-spin" : ""}`}
          />
          <div>
            <p role="status" className="text-sm font-semibold text-fg">
              {content.title}
            </p>
            <p className="mt-0.5 text-sm text-fg-muted">{content.description}</p>
          </div>
        </div>
        {canRetry && document.status === "failed" && (
          <Button size="sm" onClick={onRetry} loading={isRetrying}>
            Retry processing
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Extracted content                                                   */
/* ------------------------------------------------------------------ */

export function DocumentContentPanel({
  document,
  content,
  isLoading,
  error,
  onRetry,
}: {
  document: ClubDocument;
  content: DocumentContent | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardHeader
        actions={
          content?.pageCount ? (
            <span className="text-xs text-fg-subtle">{content.pageCount} pages</span>
          ) : undefined
        }
      >
        <CardTitle className="flex items-center gap-2">
          <FileText width={15} height={15} aria-hidden className="text-fg-subtle" />
          Extracted content
        </CardTitle>
        {content && (
          <p className="text-xs text-fg-subtle">Extracted {formatDate(content.extractedAt)}</p>
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
          <ErrorState variant="inline" title="Content unavailable" description={error} onRetry={onRetry} />
        ) : isDocumentProcessing(document.status) ? (
          <EmptyState
            title="Content is not ready yet"
            description="Extracted text appears here once processing finishes."
          />
        ) : content ? (
          /* Rendered as plain text nodes — never as HTML. */
          <div className="scrollbar-slim max-h-[28rem] space-y-3 overflow-y-auto pr-2">
            {content.text.split(/\n\s*\n/).map((paragraph, index) => (
              <p key={index} className="text-sm leading-relaxed whitespace-pre-wrap text-fg">
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No extracted content is available for this document"
            description="The server has not produced readable text for this file."
          />
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Intelligence                                                        */
/* ------------------------------------------------------------------ */

export function DocumentIntelligencePanel({
  document,
  intelligence,
  isLoading,
  error,
  supported,
  isSample,
  onRetry,
}: {
  document: ClubDocument;
  intelligence: DocumentIntelligence | null;
  isLoading: boolean;
  error: string | null;
  supported: boolean;
  isSample: boolean;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardHeader
        actions={
          intelligence && (
            <Badge tone={isSample ? "warning" : "neutral"} variant="outline">
              {isSample ? "Sample output" : "Generated"}
            </Badge>
          )
        }
      >
        <CardTitle className="flex items-center gap-2">
          <Sparkles width={15} height={15} aria-hidden className="text-fg-subtle" />
          Document intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!supported ? (
          <EmptyState
            title="Document intelligence will appear here once processing is available"
            description="The server does not currently expose extraction results."
          />
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ) : error ? (
          <ErrorState variant="inline" title="Intelligence unavailable" description={error} onRetry={onRetry} />
        ) : document.status === "failed" ? (
          <EmptyState
            title="No intelligence available"
            description="Processing failed for this document, so no results were produced."
          />
        ) : isDocumentProcessing(document.status) ? (
          <EmptyState
            title="Intelligence is not ready yet"
            description="Results appear here once processing finishes."
          />
        ) : !intelligence ? (
          <EmptyState
            title="No intelligence was produced for this document"
            description="The server completed processing without returning structured results."
          />
        ) : (
          <div className="space-y-4">
            {intelligence.summary && (
              <div>
                <h3 className="text-xs font-semibold text-fg-muted">Summary</h3>
                <p className="mt-1 text-sm leading-relaxed text-fg">{intelligence.summary}</p>
              </div>
            )}

            {intelligence.keyPoints.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-fg-muted">Key points</h3>
                <ul className="mt-1.5 space-y-1.5">
                  {intelligence.keyPoints.map((point, index) => (
                    <li key={index} className="flex gap-2 text-sm text-fg-muted">
                      <CheckCircle2
                        width={13}
                        height={13}
                        aria-hidden
                        className="mt-1 shrink-0 text-success"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {intelligence.importantDates.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-fg-muted">Dates found</h3>
                <ul className="mt-1.5 space-y-1.5">
                  {intelligence.importantDates.map((entry) => (
                    <li key={`${entry.label}-${entry.iso}`} className="flex items-center gap-2 text-sm">
                      <CalendarClock width={13} height={13} aria-hidden className="text-fg-subtle" />
                      <span className="text-fg-muted">{entry.label}</span>
                      <span className="ml-auto text-xs text-fg tabular-nums">
                        {formatDate(entry.iso)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {intelligence.generatedAt && (
              <p className="text-[11px] text-fg-subtle">
                Generated {formatDate(intelligence.generatedAt)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Operational connections                                             */
/* ------------------------------------------------------------------ */

export function DocumentRelationsPanel({
  eventId,
  relations,
}: {
  eventId: string;
  relations: DocumentRelations | null;
}) {
  const taskCount = relations?.relatedTaskIds.length ?? 0;
  const meetingCount = relations?.relatedMeetingIds.length ?? 0;
  const total = taskCount + meetingCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 width={15} height={15} aria-hidden className="text-fg-subtle" />
          Operational connections
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState
            title="No linked records"
            description="Tasks and meetings the server links to this document appear here."
          />
        ) : (
          <div className="space-y-4">
            {meetingCount > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-fg-muted">Meetings</h3>
                <ul className="mt-1.5 space-y-1">
                  {relations!.relatedMeetingIds.map((meetingId) => (
                    <li key={meetingId}>
                      <Link
                        to={`/events/${eventId}/meetings/${meetingId}`}
                        className="text-sm text-brand underline-offset-4 hover:underline"
                      >
                        Open linked meeting
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {taskCount > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-fg-muted">Tasks</h3>
                <ul className="mt-1.5 space-y-1">
                  {relations!.relatedTaskIds.map((taskId) => (
                    <li key={taskId}>
                      <Link
                        to={`/events/${eventId}/tasks`}
                        className="text-sm text-brand underline-offset-4 hover:underline"
                      >
                        Open linked task in the task workspace
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
