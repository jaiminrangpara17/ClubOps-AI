import { Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import {
  VolunteerCards,
  VolunteerFilters,
  VolunteerStats,
  VolunteerTable,
} from "@/components/volunteer";
import { Button, Card, EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { useVolunteers } from "@/hooks/useVolunteers";
import {
  computeVolunteerStats,
  EMPTY_VOLUNTEER_FILTERS,
  filterVolunteers,
} from "@/lib/volunteer";
import { isMockApi } from "@/services/apiMode";
import type { VolunteerFilters as VolunteerFiltersData } from "@/types";

function ListSkeleton() {
  return (
    <Card padding="md" className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </Card>
  );
}

export default function EventVolunteersPage() {
  const { eventId = "" } = useParams();
  const navigate = useNavigate();
  const { data, error, isLoading, refetch } = useVolunteers(eventId);
  const [filters, setFilters] = useState<VolunteerFiltersData>(EMPTY_VOLUNTEER_FILTERS);

  const roles = useMemo(
    () => [...new Set(data.map((volunteer) => volunteer.eventRole))].sort(),
    [data],
  );
  const filtered = useMemo(() => filterVolunteers(data, filters), [data, filters]);
  const stats = useMemo(() => computeVolunteerStats(data), [data]);
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_VOLUNTEER_FILTERS);

  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="Volunteers"
        description="Manage event members, responsibilities and workload."
        actions={
          <Button leadingIcon={Plus} onClick={() => navigate(`/events/${eventId}/volunteers/new`)}>
            Add volunteer
          </Button>
        }
      />

      {isMockApi && (
        <PreviewNotice>
          <span className="font-medium text-fg">Development data.</span> Participation and workload
          are served by the isolated volunteer adapter until backend endpoints are available.
        </PreviewNotice>
      )}

      {isLoading ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-card" />
            ))}
          </div>
          <ListSkeleton />
        </>
      ) : error ? (
        <ErrorState title="Unable to load volunteers" description={error} onRetry={refetch} retryLabel="Retry" />
      ) : data.length === 0 ? (
        <EmptyState
          variant="page"
          icon={Users}
          title="No volunteers yet"
          description="Add members to your event so responsibilities can be assigned."
          actions={
            <Button leadingIcon={Plus} onClick={() => navigate(`/events/${eventId}/volunteers/new`)}>
              Add volunteer
            </Button>
          }
        />
      ) : (
        <>
          <VolunteerStats stats={stats} />
          <Card padding="md">
            <VolunteerFilters filters={filters} roles={roles} onChange={setFilters} total={data.length} shown={filtered.length} />
          </Card>
          {filtered.length === 0 && hasFilters ? (
            <EmptyState
              icon={Users}
              title="No volunteers match these filters"
              description="Try changing or clearing your filters."
              actions={<Button variant="outline" onClick={() => setFilters(EMPTY_VOLUNTEER_FILTERS)}>Clear filters</Button>}
            />
          ) : (
            <>
              <VolunteerTable eventId={eventId} volunteers={filtered} />
              <VolunteerCards eventId={eventId} volunteers={filtered} />
            </>
          )}
        </>
      )}
    </div>
  );
}