import { ArrowLeft, CalendarDays, Clock, MapPin, Pencil, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import {
  ActionItemsPanel,
  DecisionsPanel,
  IntelligenceSummary,
  MeetingStatusBadge,
  ProcessingBadge,
  ProcessingPanel,
  TranscriptPanel,
} from "@/components/meeting";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useMeeting, useMeetingMutations } from "@/hooks/useMeetings";
import { formatDate } from "@/lib/format";
import { formatMeetingTime } from "@/lib/meeting";
import { isMockApi } from "@/services/apiMode";

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-2">
      <Icon width={15} height={15} aria-hidden className="mt-0.5 shrink-0 text-fg-subtle" />
      <div>
        <dt className="text-xs text-fg-subtle">{label}</dt>
        <dd className="text-sm text-fg">{value}</dd>
      </div>
    </div>
  );
}

export default function MeetingDetailPage() {
  const { eventId = "", meetingId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    meeting,
    meetingError,
    meetingLoading,
    transcript,
    transcriptError,
    transcriptLoading,
    intelligence,
    intelligenceError,
    intelligenceLoading,
    refetch,
    applyMeeting,
    applyTranscript,
    applyIntelligence,
  } = useMeeting(eventId, meetingId);
  const mutations = useMeetingMutations();
  const [creatingActionItemId, setCreatingActionItemId] = useState<string | null>(null);

  // UX-only gating; the backend remains authoritative and 401/403 are handled by the API client.
  const canEdit = user?.role === "PRESIDENT" || user?.role === "EVENT_HEAD" || user?.role === "FACULTY";

  if (meetingLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-card" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-card" />
          <Skeleton className="h-64 rounded-card lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!meeting || meetingError) {
    return (
      <ErrorState
        title="Unable to load meeting"
        description={meetingError ?? "This meeting does not belong to the current event."}
        onRetry={refetch}
        actions={
          <Button variant="ghost" onClick={() => navigate(`/events/${eventId}/meetings`)}>
            Back to meetings
          </Button>
        }
      />
    );
  }

  const saveTranscript = async (text: string) => {
    const saved = await mutations.saveTranscript(eventId, meetingId, text);
    applyTranscript(saved);
  };

  const processMeeting = async () => {
    try {
      const updated = await mutations.process(eventId, meetingId);
      applyMeeting(updated);
    } catch {
      // mutations.error carries the user-safe message.
    }
  };

  const createTask = async (actionItemId: string) => {
    if (!intelligence) return;
    setCreatingActionItemId(actionItemId);
    try {
      const { actionItem } = await mutations.createTask(eventId, meetingId, actionItemId);
      applyIntelligence({
        ...intelligence,
        actionItems: intelligence.actionItems.map((item) => (item.id === actionItem.id ? actionItem : item)),
      });
    } catch {
      // mutations.error carries the user-safe message.
    } finally {
      setCreatingActionItemId(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        size="md"
        divider={false}
        title={meeting.title}
        description={`${formatDate(meeting.startIso)} · ${formatMeetingTime(meeting.startIso, meeting.endIso)}`}
        meta={
          <>
            <MeetingStatusBadge status={meeting.status} />
            <ProcessingBadge status={meeting.processingStatus} />
          </>
        }
        actions={
          <>
            <Button variant="outline" leadingIcon={ArrowLeft} onClick={() => navigate(`/events/${eventId}/meetings`)}>
              Back
            </Button>
            {canEdit && (
              <Button leadingIcon={Pencil} onClick={() => navigate(`/events/${eventId}/meetings/${meetingId}/edit`)}>
                Edit meeting
              </Button>
            )}
          </>
        }
      />

      {isMockApi && <PreviewNotice />}
      {mutations.error && (
        <ErrorState variant="inline" title="Action failed" description={mutations.error} onRetry={mutations.clearError} retryLabel="Dismiss" />
      )}

      {/* 1 — Meeting information */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Meeting details</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <Meta icon={CalendarDays} label="Date" value={formatDate(meeting.startIso)} />
              <Meta icon={Clock} label="Time" value={formatMeetingTime(meeting.startIso, meeting.endIso)} />
              {meeting.location && <Meta icon={MapPin} label="Location" value={meeting.location} />}
              {meeting.organizerName && <Meta icon={Users} label="Organizer" value={meeting.organizerName} />}
            </dl>
            {meeting.notes && (
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-xs font-medium text-fg-muted">Notes</p>
                <p className="mt-1 text-sm text-fg">{meeting.notes}</p>
              </div>
            )}
            <p className="mt-4 text-[11px] text-fg-subtle">
              Created {formatDate(meeting.createdAt)} · Updated {formatDate(meeting.updatedAt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Agenda</CardTitle></CardHeader>
          <CardContent>
            {meeting.agenda ? (
              <ul className="space-y-1.5">
                {meeting.agenda.split("\n").filter(Boolean).map((line, index) => (
                  <li key={index} className="flex gap-2 text-sm text-fg">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span>{line.replace(/^\d+\.\s*/, "")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fg-subtle">No agenda was recorded for this meeting.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader actions={<span className="text-xs text-fg-subtle">{meeting.participants.length}</span>}>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent>
            {meeting.participants.length === 0 ? (
              <p className="text-sm text-fg-subtle">No participants were recorded.</p>
            ) : (
              <ul className="space-y-2.5">
                {meeting.participants.map((participant) => (
                  <li key={participant.memberId} className="flex items-center gap-2.5">
                    <Avatar name={participant.name} size="sm" tone="neutral" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-fg">{participant.name}</p>
                      {participant.role && <p className="truncate text-xs text-fg-subtle">{participant.role}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 2 — Transcript */}
      <TranscriptPanel
        transcript={transcript}
        isLoading={transcriptLoading}
        error={transcriptError}
        canEdit={canEdit}
        isSaving={mutations.isSaving}
        onSave={saveTranscript}
        onRetry={refetch}
      />

      {/* 3 — Processing state */}
      <ProcessingPanel
        meeting={meeting}
        canProcess={canEdit}
        isStarting={mutations.isSaving}
        onProcess={() => void processMeeting()}
        isSample={isMockApi}
      />

      {/* 4 — Decisions and 5 — Action items */}
      {meeting.processingStatus === "completed" && (
        <>
          {intelligenceLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-56 rounded-card" />
              <Skeleton className="h-56 rounded-card" />
            </div>
          ) : intelligenceError ? (
            <ErrorState title="Meeting intelligence unavailable" description={intelligenceError} onRetry={refetch} />
          ) : intelligence ? (
            <>
              <IntelligenceSummary intelligence={intelligence} isSample={isMockApi} />
              <div className="grid gap-4 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <DecisionsPanel decisions={intelligence.decisions} />
                </div>
                <div className="lg:col-span-3">
                  <ActionItemsPanel
                    eventId={eventId}
                    actionItems={intelligence.actionItems}
                    canCreateTasks={canEdit}
                    creatingId={creatingActionItemId}
                    onCreateTask={(id) => void createTask(id)}
                  />
                </div>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
