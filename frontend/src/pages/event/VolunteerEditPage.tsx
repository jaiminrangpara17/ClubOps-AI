import { useNavigate, useParams } from "react-router-dom";
import { VolunteerForm } from "@/components/volunteer";
import { Card, CardContent, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { useVolunteer, useVolunteerMutations } from "@/hooks/useVolunteers";
import type { CreateVolunteerRequest, UpdateVolunteerRequest } from "@/types";

export default function VolunteerEditPage() {
  const { eventId = "", volunteerId = "" } = useParams();
  const navigate = useNavigate();
  const { volunteer, error: loadError, isLoading, refetch } = useVolunteer(eventId, volunteerId);
  const { update, isSaving, error } = useVolunteerMutations();

  if (isLoading) return <Skeleton className="mx-auto h-96 max-w-2xl rounded-card" />;
  if (!volunteer || loadError) {
    return <ErrorState title="Unable to load volunteer" description={loadError ?? "Volunteer not found."} onRetry={refetch} />;
  }

  const submit = async (request: CreateVolunteerRequest | UpdateVolunteerRequest) => {
    if ("memberId" in request) return;
    try {
      await update(eventId, volunteerId, request);
      navigate(`/events/${eventId}/volunteers/${volunteerId}`, { replace: true });
    } catch {
      // User-safe error is shown below; form state remains intact.
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader size="md" divider={false} title="Edit volunteer" description="Update event-specific role, availability and participation status." />
      {error && <ErrorState variant="inline" title="Unable to save changes" description={error} />}
      <Card>
        <CardContent padding="lg">
          <VolunteerForm
            volunteer={volunteer}
            members={[]}
            onSubmit={submit}
            onCancel={() => navigate(`/events/${eventId}/volunteers/${volunteerId}`)}
            loading={isSaving}
          />
        </CardContent>
      </Card>
    </div>
  );
}