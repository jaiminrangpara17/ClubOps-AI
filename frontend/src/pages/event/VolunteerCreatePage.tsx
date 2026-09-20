import { useNavigate, useParams } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import { VolunteerForm } from "@/components/volunteer";
import { Card, CardContent, ErrorState, PageHeader } from "@/components/ui";
import { useAvailableMembers, useVolunteerMutations } from "@/hooks/useVolunteers";
import { isMockApi } from "@/services/apiMode";
import type { CreateVolunteerRequest, UpdateVolunteerRequest } from "@/types";

export default function VolunteerCreatePage() {
  const { eventId = "" } = useParams();
  const navigate = useNavigate();
  const { members, error: membersError, isLoading: membersLoading } = useAvailableMembers(eventId);
  const { add, isSaving, error } = useVolunteerMutations();

  const submit = async (request: CreateVolunteerRequest | UpdateVolunteerRequest) => {
    if (!("memberId" in request)) return;
    try {
      const volunteer = await add(eventId, request);
      navigate(`/events/${eventId}/volunteers/${volunteer.id}`, { replace: true });
    } catch {
      // User-safe error is exposed by the mutation hook; form values stay intact.
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader size="md" divider={false} title="Add volunteer" description="Add an existing club member to this event and define their participation." />
      {isMockApi && <PreviewNotice />}
      {error && <ErrorState variant="inline" title="Unable to add volunteer" description={error} />}
      <Card>
        <CardContent padding="lg">
          <VolunteerForm
            members={members}
            membersLoading={membersLoading}
            membersError={membersError}
            onSubmit={submit}
            onCancel={() => navigate(`/events/${eventId}/volunteers`)}
            loading={isSaving}
          />
        </CardContent>
      </Card>
    </div>
  );
}