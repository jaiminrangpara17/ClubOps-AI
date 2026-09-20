import { useNavigate, useParams } from "react-router-dom";
import { AnnouncementForm } from "@/components/announcement";
import { Button, Card, CardContent, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import {
  useAnnouncement,
  useAnnouncementCapabilities,
  useAnnouncementMutations,
} from "@/hooks/useAnnouncements";
import type { CreateAnnouncementRequest, UpdateAnnouncementRequest } from "@/types";

export default function AnnouncementEditPage() {
  const { eventId = "", announcementId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { capabilities, error: capabilitiesError, isLoading: capabilitiesLoading } =
    useAnnouncementCapabilities(eventId);
  const { announcement, error: loadError, isLoading, refetch } = useAnnouncement(eventId, announcementId);
  const { update, isSaving, error } = useAnnouncementMutations();
  const canWrite =
    user?.role === "PRESIDENT" || user?.role === "EVENT_HEAD" || user?.role === "FACULTY";

  if (isLoading || capabilitiesLoading) {
    return <Skeleton className="mx-auto h-[38rem] max-w-3xl rounded-card" />;
  }
  if (!capabilities) {
    return (
      <ErrorState
        title="Announcement editing unavailable"
        description={capabilitiesError ?? "The server has not enabled announcement editing."}
        onRetry={() => navigate(`/events/${eventId}/announcements`)}
        retryLabel="Back to announcements"
      />
    );
  }
  if (!announcement || loadError) {
    return (
      <ErrorState
        title="Unable to load announcement"
        description={loadError ?? "Announcement not found."}
        onRetry={refetch}
      />
    );
  }
  if (!canWrite || !capabilities.update) {
    return (
      <ErrorState
        title="Announcement editing unavailable"
        description="You do not have permission to edit announcements for this event."
        actions={
          <Button variant="ghost" onClick={() => navigate(`/events/${eventId}/announcements`)}>
            Back to announcements
          </Button>
        }
      />
    );
  }

  const submit = async (request: CreateAnnouncementRequest | UpdateAnnouncementRequest) => {
    try {
      await update(eventId, announcementId, request);
      navigate(`/events/${eventId}/announcements/${announcementId}`, { replace: true });
    } catch {
      /* mutation hook owns the safe error */
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader size="md" divider={false} title="Edit announcement" description={announcement.title} />
      {error && <ErrorState variant="inline" title="Unable to save changes" description={error} />}
      <Card>
        <CardContent padding="lg">
          <AnnouncementForm
            announcement={announcement}
            capabilities={capabilities}
            onSubmit={submit}
            onCancel={() => navigate(`/events/${eventId}/announcements/${announcementId}`)}
            loading={isSaving}
          />
        </CardContent>
      </Card>
    </div>
  );
}
