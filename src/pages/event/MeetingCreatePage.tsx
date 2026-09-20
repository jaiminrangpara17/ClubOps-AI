import { useNavigate, useParams } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import { MeetingForm } from "@/components/meeting";
import { Card, CardContent, ErrorState, PageHeader } from "@/components/ui";
import { useMeetingMembers, useMeetingMutations } from "@/hooks/useMeetings";
import { isMockApi } from "@/services/apiMode";
import type { CreateMeetingRequest } from "@/types";

export default function MeetingCreatePage() {
  const { eventId = "" } = useParams();
  const navigate = useNavigate();
  const { members, error: membersError, isLoading: membersLoading } = useMeetingMembers(eventId);
  const { create, isSaving, error } = useMeetingMutations();

  const submit = async (request: CreateMeetingRequest) => {
    try {
      const meeting = await create(eventId, request);
      navigate(`/events/${eventId}/meetings/${meeting.id}`, { replace: true });
    } catch {
      // The mutation hook surfaces a user-safe error; form values stay intact.
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        size="md"
        divider={false}
        title="New meeting"
        description="Record the meeting details. You can add the transcript and generate intelligence afterwards."
      />
      {isMockApi && <PreviewNotice />}
      {error && <ErrorState variant="inline" title="Unable to create meeting" description={error} />}
      <Card>
        <CardContent padding="lg">
          <MeetingForm
            members={members}
            membersLoading={membersLoading}
            membersError={membersError}
            onSubmit={submit}
            onCancel={() => navigate(`/events/${eventId}/meetings`)}
            loading={isSaving}
          />
        </CardContent>
      </Card>
    </div>
  );
}
