import { CheckCircle2, FileText, Link2, ListChecks, Users, Video } from "lucide-react";
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
import { RISK_IMPACT_LABEL, RISK_LIKELIHOOD_LABEL } from "@/lib/risk";
import type { ClubDocument, Meeting, Risk, Task } from "@/types";

function AssessmentValue({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-control border border-line bg-surface-subtle p-3 text-center">
      <p className="text-lg font-semibold text-fg">{value ?? "—"}</p>
      <p className="text-xs text-fg-subtle">{label}</p>
    </div>
  );
}

export function RiskAssessmentPanel({ risk }: { risk: Risk }) {
  const likelihood = risk.likelihood ? RISK_LIKELIHOOD_LABEL[risk.likelihood] : null;
  const impact = risk.impact ? RISK_IMPACT_LABEL[risk.impact] : null;
  return (
    <Card>
      <CardHeader><CardTitle>Risk assessment</CardTitle></CardHeader>
      <CardContent>
        {!risk.likelihood && !risk.impact && risk.score === null ? (
          <EmptyState title="No assessment recorded" description="Likelihood, impact and scoring are not available for this risk." />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <AssessmentValue label="Likelihood" value={likelihood} />
              <AssessmentValue label="Impact" value={impact} />
              <AssessmentValue label="Backend score" value={risk.score === null ? null : String(risk.score)} />
            </div>
            <p className="mt-3 text-[11px] text-fg-subtle">Assessment values and score are supplied by the backend; no score is calculated in the frontend.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function MitigationPanel({
  eventId,
  risk,
  linkedTask,
  linksLoading,
  linksError,
  canCreateTask,
  isCreatingTask,
  onCreateTask,
}: {
  eventId: string;
  risk: Risk;
  linkedTask: Task | null;
  linksLoading: boolean;
  linksError: string | null;
  canCreateTask: boolean;
  isCreatingTask: boolean;
  onCreateTask: () => void;
}) {
  const mitigation = risk.mitigation;
  return (
    <Card>
      <CardHeader><CardTitle>Mitigation plan</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {!mitigation ? (
          <EmptyState title="No mitigation plan recorded" description="Add a strategy and owner to make this risk actionable." />
        ) : (
          <>
            <div>
              <p className="text-xs font-medium text-fg-muted">Strategy</p>
              <p className="mt-1 text-sm leading-relaxed text-fg">{mitigation.strategy ?? "No strategy recorded"}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-control border border-line bg-surface-subtle p-3"><p className="text-xs text-fg-subtle">Owner</p><p className="mt-1 text-sm text-fg">{mitigation.ownerName ?? "Unassigned"}</p></div>
              <div className="rounded-control border border-line bg-surface-subtle p-3"><p className="text-xs text-fg-subtle">Deadline</p><p className="mt-1 text-sm text-fg">{mitigation.dueIso ? formatDueLabel(mitigation.dueIso) : "No deadline"}</p></div>
            </div>
            {mitigation.status && <Badge tone="neutral" variant="outline">{mitigation.status}</Badge>}
          </>
        )}

        <div className="border-t border-line pt-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-fg-muted"><ListChecks width={13} height={13} aria-hidden />Mitigation task</p>
          {linksLoading ? <Skeleton className="mt-2 h-12 rounded-control" /> : linksError ? <ErrorState variant="inline" title="Task unavailable" description={linksError} /> : linkedTask ? (
            <div className="mt-2 flex flex-wrap items-center gap-3 rounded-control border border-line bg-surface-subtle p-3">
              <div className="min-w-0 flex-1"><Link to={`/events/${eventId}/tasks`} className="text-sm font-medium text-brand underline-offset-4 hover:underline" title="Open task workspace">{linkedTask.title}</Link><p className="mt-0.5 text-xs text-fg-subtle">{linkedTask.assigneeName ?? "Unassigned"} · {linkedTask.dueIso ? formatDueLabel(linkedTask.dueIso) : "No due date"}</p></div>
              <TaskPriorityBadge priority={linkedTask.priority} compact /><TaskStatusBadge status={linkedTask.status} />
            </div>
          ) : canCreateTask ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-control border border-dashed border-line-strong bg-surface-subtle p-3"><p className="text-xs text-fg-muted">No mitigation task is linked yet.</p><Button size="sm" variant="outline" onClick={onCreateTask} loading={isCreatingTask}>Create mitigation task</Button></div>
          ) : <p className="mt-2 text-xs text-fg-subtle">No mitigation task linked.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function RiskConnectionsPanel({
  eventId,
  risk,
  linkedMeeting,
  linkedDocument,
  linksLoading,
}: {
  eventId: string;
  risk: Risk;
  linkedMeeting: Meeting | null;
  linkedDocument: ClubDocument | null;
  linksLoading: boolean;
}) {
  const refs = risk.references;
  const count = [refs.meetingId, refs.documentId, refs.volunteerId, refs.taskId].filter(Boolean).length;
  return (
    <Card>
      <CardHeader actions={count > 0 ? <Badge tone="neutral">{count}</Badge> : undefined}><CardTitle className="flex items-center gap-2"><Link2 width={15} height={15} aria-hidden className="text-fg-subtle" />Operational context</CardTitle></CardHeader>
      <CardContent>
        {count === 0 ? <EmptyState title="No linked records" description="Explicit task, meeting, document and volunteer relationships appear here." /> : linksLoading ? <div className="space-y-2"><Skeleton className="h-10 rounded-control" /><Skeleton className="h-10 rounded-control" /></div> : (
          <ul className="space-y-3">
            {refs.meetingId && <li className="flex items-start gap-2"><Video width={15} height={15} aria-hidden className="mt-0.5 text-fg-subtle" /><div><p className="text-xs text-fg-subtle">Source meeting</p><Link to={`/events/${eventId}/meetings/${refs.meetingId}`} className="text-sm text-brand underline-offset-4 hover:underline">{linkedMeeting?.title ?? refs.meetingTitle ?? "Open meeting"}</Link></div></li>}
            {refs.documentId && <li className="flex items-start gap-2"><FileText width={15} height={15} aria-hidden className="mt-0.5 text-fg-subtle" /><div><p className="text-xs text-fg-subtle">Source document</p><Link to={`/events/${eventId}/documents/${refs.documentId}`} className="text-sm text-brand underline-offset-4 hover:underline">{linkedDocument?.name ?? refs.documentName ?? "Open document"}</Link></div></li>}
            {refs.volunteerId && <li className="flex items-start gap-2"><Users width={15} height={15} aria-hidden className="mt-0.5 text-fg-subtle" /><div><p className="text-xs text-fg-subtle">Related volunteer</p><Link to={`/events/${eventId}/volunteers/${refs.volunteerId}`} className="text-sm text-brand underline-offset-4 hover:underline">{refs.volunteerName ?? "Open volunteer"}</Link></div></li>}
            {refs.taskId && <li className="flex items-start gap-2"><CheckCircle2 width={15} height={15} aria-hidden className="mt-0.5 text-fg-subtle" /><div><p className="text-xs text-fg-subtle">Linked task</p><Link to={`/events/${eventId}/tasks`} className="text-sm text-brand underline-offset-4 hover:underline">Open task workspace</Link></div></li>}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function RiskDescriptionPanel({ risk }: { risk: Risk }) {
  return (
    <Card>
      <CardHeader><CardTitle>Risk description</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-fg">{risk.description ?? "No description was recorded for this risk."}</p>
        <div className="mt-4 grid gap-3 border-t border-line pt-3 sm:grid-cols-2"><div><p className="text-xs text-fg-subtle">Identified</p><p className="text-sm text-fg">{formatDate(risk.identifiedAt)}</p></div><div><p className="text-xs text-fg-subtle">Last updated</p><p className="text-sm text-fg">{formatDate(risk.updatedAt)}</p></div></div>
      </CardContent>
    </Card>
  );
}