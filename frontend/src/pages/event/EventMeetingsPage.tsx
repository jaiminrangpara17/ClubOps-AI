import { CalendarPlus, ClipboardCheck, ListChecks, Loader2, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import { MeetingCards, MeetingFilters, MeetingTable } from "@/components/meeting";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StatCard,
} from "@/components/ui";
import { useMeetings } from "@/hooks/useMeetings";
import {
  computeMeetingStats,
  EMPTY_MEETING_FILTERS,
  filterMeetings,
  sortMeetings,
} from "@/lib/meeting";
import { isMockApi } from "@/services/apiMode";
import type { MeetingFilters as MeetingFiltersData } from "@/types";

export default function EventMeetingsPage() {
  const { eventId = "" } = useParams();
  const navigate = useNavigate();
  const { meetings, error, isLoading, refetch } = useMeetings(eventId);
  const [filters, setFilters] = useState<MeetingFiltersData>(EMPTY_MEETING_FILTERS);

  const sorted = useMemo(() => sortMeetings(meetings), [meetings]);
  const filtered = useMemo(() => filterMeetings(sorted, filters), [sorted, filters]);
  const stats = useMemo(() => computeMeetingStats(meetings), [meetings]);
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_MEETING_FILTERS);
  const newMeetingPath = `/events/${eventId}/meetings/new`;

  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="Meetings"
        description="Every meeting is an operational input — capture what was decided and turn follow-ups into tracked work."
        actions={
          <Button leadingIcon={CalendarPlus} onClick={() => navigate(newMeetingPath)}>
            New meeting
          </Button>
        }
      />

      {isMockApi && (
        <PreviewNotice>
          <span className="font-medium text-fg">Development data.</span> Meetings, transcripts and
          extracted intelligence are served by the isolated meeting adapter. Processing is simulated
          and returns sample output — no transcription or extraction model is connected.
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
        <ErrorState title="Unable to load meetings" description={error} onRetry={refetch} retryLabel="Retry" />
      ) : meetings.length === 0 ? (
        <EmptyState
          variant="page"
          icon={Video}
          title="No meetings yet"
          description="Record committee and crew meetings here so decisions and follow-ups become tracked work."
          actions={
            <Button leadingIcon={CalendarPlus} onClick={() => navigate(newMeetingPath)}>
              New meeting
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Meetings" value={stats.total} hint={`${stats.upcoming} upcoming`} icon={Video} tone="brand" />
            <StatCard label="Processing" value={stats.processing} hint="Intelligence in progress" icon={Loader2} tone="warning" />
            <StatCard label="Decisions" value={stats.decisions} hint="Across processed meetings" icon={ClipboardCheck} tone="success" />
            <StatCard label="Action items" value={stats.actionItems} hint="Extracted follow-ups" icon={ListChecks} tone="info" />
          </div>

          <Card padding="md">
            <MeetingFilters filters={filters} onChange={setFilters} total={meetings.length} shown={filtered.length} />
          </Card>

          {filtered.length === 0 && hasFilters ? (
            <EmptyState
              icon={Video}
              title="No meetings match these filters"
              description="Try changing or clearing your filters."
              actions={<Button variant="outline" onClick={() => setFilters(EMPTY_MEETING_FILTERS)}>Clear filters</Button>}
            />
          ) : (
            <>
              <MeetingTable eventId={eventId} meetings={filtered} />
              <MeetingCards eventId={eventId} meetings={filtered} />
            </>
          )}
        </>
      )}
    </div>
  );
}
