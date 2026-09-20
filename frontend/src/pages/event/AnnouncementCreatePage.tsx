import { useNavigate, useParams } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import { AnnouncementForm } from "@/components/announcement";
import { Button, Card, CardContent, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useAnnouncementCapabilities, useAnnouncementMutations } from "@/hooks/useAnnouncements";
import { isMockApi } from "@/services/apiMode";
import type { CreateAnnouncementRequest, UpdateAnnouncementRequest } from "@/types";

export default function AnnouncementCreatePage() {
  const { eventId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { capabilities, error: capabilitiesError, isLoading } = useAnnouncementCapabilities(eventId);
  const { create, isSaving, error } = useAnnouncementMutations();
  const canWrite =
    user?.role === "PRESIDENT" || user?.role === "EVENT_HEAD" || user?.role === "FACULTY";

  if (isLoading) return <Skeleton className="mx-auto h-[38rem] max-w-3xl rounded-card" />;
  if (!capabilities) {
    return (
      <ErrorState
        title="Announcement creation unavailable"
        description={capabilitiesError ?? "The server has not enabled announcement creation."}
        onRetry={() => navigate(`/events/${eventId}/announcements`)}
        retryLabel="Back to announcements"
      />
    );
  }
  if (!canWrite || !capabilities.create) {
    return (
      <ErrorState
        title="Announcement creation unavailable"
        description="You do not have permission to create announcements for this event."
        actions={
          <Button variant="ghost" onClick={() => navigate(`/events/${eventId}/announcements`)}>
            Back to announcements
          </Button>
        }
      />
    );
  }

  const submit = async (request: CreateAnnouncementRequest | UpdateAnnouncementRequest) => {
    if (!("title" in request) || !request.title || !request.body) return;
    try {
      const record = await create(eventId, request as CreateAnnouncementRequest);
      navigate(`/events/${eventId}/announcements/${record.id}`, { replace: true });
    } catch {
      /* mutation hook owns the safe error */
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        size="md"
        divider={false}
        title="New announcement"
        description="Drafts stay with editors until they are published. Publishing is confirmed only after the server responds."
      />
      {isMockApi && <PreviewNotice />}
      {error && <ErrorState variant="inline" title="Unable to create announcement" description={error} />}
      <Card>
        <CardContent padding="lg">
          <AnnouncementForm
            capabilities={capabilities}
            onSubmit={submit}
            onCancel={() => navigate(`/events/${eventId}/announcements`)}
            loading={isSaving}
          />
        </CardContent>
      </Card>
    </div>
  );
}
