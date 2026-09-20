import { Archive, ArrowLeft, CalendarDays, Pencil, Send, Undo2, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import {
  AnnouncementAudienceBadge,
  AnnouncementCategoryBadge,
  AnnouncementPriorityBadge,
  AnnouncementStatusBadge,
} from "@/components/announcement";
import { Button, Card, CardContent, CardHeader, CardTitle, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import {
  useAnnouncement,
  useAnnouncementCapabilities,
  useAnnouncementMutations,
} from "@/hooks/useAnnouncements";
import { announcementVisibilityCopy } from "@/lib/announcement";
import { formatDate } from "@/lib/format";
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
    <div className="flex items-start gap-2">
      <Icon width={15} height={15} aria-hidden className="mt-0.5 shrink-0 text-fg-subtle" />
      <div>
        <p className="text-xs text-fg-subtle">{label}</p>
        <p className="text-sm text-fg">{value}</p>
      </div>
    </div>
  );
}

export default function AnnouncementDetailPage() {
  const { eventId = "", announcementId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { capabilities } = useAnnouncementCapabilities(eventId);
  const { announcement, error, isLoading, refetch, applyAnnouncement } = useAnnouncement(
    eventId,
    announcementId,
  );
  const mutations = useAnnouncementMutations();
  const [pending, setPending] = useState<"publish" | "unpublish" | "archive" | null>(null);
  const canWrite =
    user?.role === "PRESIDENT" || user?.role === "EVENT_HEAD" || user?.role === "FACULTY";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }

  if (!announcement || error) {
    return (
      <ErrorState
        title="Unable to load announcement"
        description={error ?? "This announcement does not belong to the current event."}
        onRetry={refetch}
        actions={
          <Button variant="ghost" onClick={() => navigate(`/events/${eventId}/announcements`)}>
            Back to announcements
          </Button>
        }
      />
    );
  }

  const runTransition = async (action: "publish" | "unpublish" | "archive") => {
    setPending(action);
    try {
      const next =
        action === "publish"
          ? await mutations.publish(eventId, announcementId)
          : action === "unpublish"
            ? await mutations.unpublish(eventId, announcementId)
            : await mutations.archive(eventId, announcementId);
      applyAnnouncement(next);
    } catch {
      /* mutation hook owns the safe error */
    } finally {
      setPending(null);
    }
  };

  const canPublish =
    canWrite &&
    Boolean(capabilities?.publish) &&
    announcement.allowedTransitions.includes("published");
  const canUnpublish =
    canWrite && Boolean(capabilities?.unpublish) && announcement.status === "published";
  const canArchive =
    canWrite &&
    Boolean(capabilities?.archive) &&
    announcement.allowedTransitions.includes("archived");

  return (
    <div className="space-y-5">
      <PageHeader
        size="md"
        divider={false}
        title={announcement.title}
        description={announcementVisibilityCopy(announcement.status)}
        meta={
          <>
            <AnnouncementStatusBadge status={announcement.status} />
            <AnnouncementPriorityBadge priority={announcement.priority} />
            <AnnouncementCategoryBadge category={announcement.category} />
            <AnnouncementAudienceBadge audience={announcement.audience} />
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              leadingIcon={ArrowLeft}
              onClick={() => navigate(`/events/${eventId}/announcements`)}
            >
              Back
            </Button>
            {canWrite && capabilities?.update && (
              <Button
                leadingIcon={Pencil}
                onClick={() => navigate(`/events/${eventId}/announcements/${announcementId}/edit`)}
              >
                Edit
              </Button>
            )}
          </>
        }
      />

      {isMockApi && (
        <PreviewNotice>
          <span className="font-medium text-fg">Development data.</span> Status changes are
          confirmed only after the isolated adapter responds. No messages are delivered.
        </PreviewNotice>
      )}
      {mutations.error && (
        <ErrorState
          variant="inline"
          title="Action failed"
          description={mutations.error}
          onRetry={mutations.clearError}
          retryLabel="Dismiss"
        />
      )}

      {(canPublish || canUnpublish || canArchive) && (
        <Card variant="subtle">
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-fg">Publication</p>
              <p className="text-xs text-fg-muted">{announcementVisibilityCopy(announcement.status)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canPublish && (
                <Button
                  size="sm"
                  leadingIcon={Send}
                  onClick={() => void runTransition("publish")}
                  loading={pending === "publish"}
                  disabled={pending !== null && pending !== "publish"}
                >
                  Publish
                </Button>
              )}
              {canUnpublish && (
                <Button
                  size="sm"
                  variant="outline"
                  leadingIcon={Undo2}
                  onClick={() => void runTransition("unpublish")}
                  loading={pending === "unpublish"}
                  disabled={pending !== null && pending !== "unpublish"}
                >
                  Unpublish
                </Button>
              )}
              {canArchive && (
                <Button
                  size="sm"
                  variant="outline"
                  leadingIcon={Archive}
                  onClick={() => void runTransition("archive")}
                  loading={pending === "archive"}
                  disabled={pending !== null && pending !== "archive"}
                >
                  Archive
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Meta icon={UserRound} label="Author" value={announcement.authorName ?? "Unknown"} />
            <Meta
              icon={CalendarDays}
              label="Published"
              value={announcement.publishedAt ? formatDate(announcement.publishedAt) : "Not published"}
            />
            <Meta icon={CalendarDays} label="Created" value={formatDate(announcement.createdAt)} />
            <Meta icon={CalendarDays} label="Updated" value={formatDate(announcement.updatedAt)} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Plain text only — never HTML. */}
            <div className="space-y-3">
              {announcement.body.split(/\n\s*\n/).map((paragraph, index) => (
                <p key={index} className="text-sm leading-relaxed whitespace-pre-wrap text-fg">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
