import { useNavigate, useParams } from "react-router-dom";
import { MeetingForm } from "@/components/meeting";
import { Card, CardContent, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { useMeeting, useMeetingMembers, useMeetingMutations } from "@/hooks/useMeetings";
import type { CreateMeetingRequest } from "@/types";

export default function MeetingEditPage() {
  const { eventId = "", meetingId = "" } = useParams();
  const navigate = useNavigate();
  const { meeting, meetingError, meetingLoading, refetch } = useMeeting(eventId, meetingId);
  const { members, error: membersError, isLoading: membersLoading } = useMeetingMembers(eventId);
  const { update, isSaving, error } = useMeetingMutations();

  if (meetingLoading) return <Skeleton className="mx-auto h-[32rem] max-w-3xl rounded-card" />;
  if (!meeting || meetingError) {
    return (
      <ErrorState
        title="Unable to load meeting"
        description={meetingError ?? "This meeting does not belong to the current event."}
        onRetry={refetch}
      />
    );
  }

  const submit = async (request: CreateMeetingRequest) => {
    try {
      await update(eventId, meetingId, request);
      navigate(`/events/${eventId}/meetings/${meetingId}`, { replace: true });
    } catch {
      // User-safe error shown below; form state remains intact.
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader size="md" divider={false} title="Edit meeting" description={meeting.title} />
      {error && <ErrorState variant="inline" title="Unable to save changes" description={error} />}
      <Card>
        <CardContent padding="lg">
          <MeetingForm
            meeting={meeting}
            members={members}
            membersLoading={membersLoading}
            membersError={membersError}
            onSubmit={submit}
            onCancel={() => navigate(`/events/${eventId}/meetings/${meetingId}`)}
            loading={isSaving}
          />
        </CardContent>
      </Card>
    </div>
  );
}
