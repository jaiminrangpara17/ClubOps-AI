import { Megaphone, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import {
  AnnouncementCards,
  AnnouncementFilters,
  AnnouncementStats,
  AnnouncementTable,
} from "@/components/announcement";
import { Button, Card, EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useAnnouncementCapabilities, useAnnouncements } from "@/hooks/useAnnouncements";
import {
  computeAnnouncementStats,
  EMPTY_ANNOUNCEMENT_FILTERS,
  filterAnnouncements,
  sortAnnouncements,
} from "@/lib/announcement";
import { isMockApi } from "@/services/apiMode";
import type { AnnouncementFilters as AnnouncementFiltersData } from "@/types";

export default function EventAnnouncementsPage() {
  const { eventId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { capabilities } = useAnnouncementCapabilities(eventId);
  const { announcements, error, isLoading, refetch } = useAnnouncements(eventId);
  const [filters, setFilters] = useState<AnnouncementFiltersData>(EMPTY_ANNOUNCEMENT_FILTERS);

  const sorted = useMemo(() => sortAnnouncements(announcements), [announcements]);
  const filtered = useMemo(() => filterAnnouncements(sorted, filters), [sorted, filters]);
  const stats = useMemo(() => computeAnnouncementStats(announcements), [announcements]);
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_ANNOUNCEMENT_FILTERS);
  const canWrite =
    user?.role === "PRESIDENT" || user?.role === "EVENT_HEAD" || user?.role === "FACULTY";
  const canCreate = canWrite && Boolean(capabilities?.create);

  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="Announcements"
        description="Keep your event team informed with important updates and decisions."
        actions={
          canCreate ? (
            <Button leadingIcon={Plus} onClick={() => navigate(`/events/${eventId}/announcements/new`)}>
              New announcement
            </Button>
          ) : undefined
        }
      />

      {isMockApi && (
        <PreviewNotice>
          <span className="font-medium text-fg">Development data.</span> Announcements use the
          isolated adapter. There is no email, SMS, push or notification center — publishing only
          changes the record status after the adapter confirms success.
        </PreviewNotice>
      )}

      {isLoading ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-card" />
            ))}
          </div>
          <Card padding="md" className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 rounded-control" />
            ))}
          </Card>
        </>
      ) : error ? (
        <ErrorState title="Unable to load announcements" description={error} onRetry={refetch} retryLabel="Retry" />
      ) : announcements.length === 0 ? (
        <EmptyState
          variant="page"
          icon={Megaphone}
          title="No announcements yet"
          description="Share operational updates so the team knows what is current."
          actions={
            canCreate ? (
              <Button leadingIcon={Plus} onClick={() => navigate(`/events/${eventId}/announcements/new`)}>
                New announcement
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <AnnouncementStats stats={stats} />
          <Card padding="md">
            <AnnouncementFilters
              filters={filters}
              onChange={setFilters}
              total={announcements.length}
              shown={filtered.length}
            />
          </Card>
          {filtered.length === 0 && hasFilters ? (
            <EmptyState
              icon={Megaphone}
              title="No announcements match these filters"
              description="Try changing or clearing your filters."
              actions={
                <Button variant="outline" onClick={() => setFilters(EMPTY_ANNOUNCEMENT_FILTERS)}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <AnnouncementTable eventId={eventId} announcements={filtered} />
              <AnnouncementCards eventId={eventId} announcements={filtered} />
            </>
          )}
        </>
      )}
    </div>
  );
}
