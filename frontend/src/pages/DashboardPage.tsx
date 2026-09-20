import { RefreshCw } from "lucide-react";
import { useCallback } from "react";
import { Link } from "react-router-dom";
import {
  AIDailyBriefPanel,
  DashboardHeader,
  DashboardSection,
  EmptyDashboard,
  EventProgressPanel,
  OverviewStats,
  PriorityTasks,
  RecentActivityList,
  RiskSummary,
  SectionBody,
  UpcomingDeadlines,
  VolunteerSnapshotPanel,
} from "@/components/dashboard";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import { Badge, Button, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useEventContext } from "@/context/EventContext";
import { useSectionData } from "@/hooks/useSectionData";
import { useAiActionsCount } from "@/hooks/useAiActions";
import { getUserRoleLabel } from "@/lib/auth";
import { isMockApi } from "@/services/apiMode";
import { dashboardService } from "@/services/dashboardService";

const SECTION_LINK = "text-xs font-medium text-brand underline-offset-4 hover:underline";

export default function DashboardPage() {
  const { currentEventId, hasActiveEvent, isLoading: eventLoading } = useEventContext();
  const { user, token } = useAuth();

  // Each section loads independently: one failing endpoint never removes the
  // rest of the dashboard. The auth token comes from AuthContext (Part 03).
  const summary = useSectionData(
    useCallback(
      () => dashboardService.getDashboardSummary(currentEventId, token ?? ""),
      [currentEventId, token],
    ),
    `summary:${currentEventId}`,
    undefined,
    Boolean(currentEventId),
  );
  const priorities = useSectionData(
    useCallback(
      () => dashboardService.getPriorities(currentEventId, token ?? ""),
      [currentEventId, token],
    ),
    `priorities:${currentEventId}`,
    undefined,
    Boolean(currentEventId),
  );
  const deadlines = useSectionData(
    useCallback(
      () => dashboardService.getUpcomingDeadlines(currentEventId, token ?? ""),
      [currentEventId, token],
    ),
    `deadlines:${currentEventId}`,
    undefined,
    Boolean(currentEventId),
  );
  const risks = useSectionData(
    useCallback(
      () => dashboardService.getDashboardRisks(currentEventId, token ?? ""),
      [currentEventId, token],
    ),
    `risks:${currentEventId}`,
    undefined,
    Boolean(currentEventId),
  );
  const progress = useSectionData(
    useCallback(
      () => dashboardService.getEventProgress(currentEventId, token ?? ""),
      [currentEventId, token],
    ),
    `progress:${currentEventId}`,
    undefined,
    Boolean(currentEventId),
  );
  const volunteers = useSectionData(
    useCallback(
      () => dashboardService.getVolunteerSnapshot(currentEventId, token ?? ""),
      [currentEventId, token],
    ),
    `volunteers:${currentEventId}`,
    undefined,
    Boolean(currentEventId),
  );
  const brief = useSectionData(
    useCallback(
      () => dashboardService.getDailyBrief(currentEventId, token ?? ""),
      [currentEventId, token],
    ),
    `brief:${currentEventId}`,
    undefined,
    Boolean(currentEventId),
  );
  const activity = useSectionData(
    useCallback(
      () => dashboardService.getRecentActivity(currentEventId, token ?? ""),
      [currentEventId, token],
    ),
    `activity:${currentEventId}`,
    undefined,
    Boolean(currentEventId),
  );

  const eventId = summary.data?.eventId ?? currentEventId;
  const hasEvent = hasActiveEvent && Boolean(summary.data?.event);
  const aiActionCount = useAiActionsCount(eventId);
  const refreshingCount = [
    summary,
    priorities,
    deadlines,
    risks,
    progress,
    volunteers,
    brief,
    activity,
  ].filter((section) => section.isRefreshing).length;

  const refetchAll = useCallback(() => {
    summary.refetch();
    priorities.refetch();
    deadlines.refetch();
    risks.refetch();
    progress.refetch();
    volunteers.refetch();
    brief.refetch();
    activity.refetch();
  }, [summary, priorities, deadlines, risks, progress, volunteers, brief, activity]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title={user ? `Welcome back, ${user.name.split(" ")[0]}` : "Dashboard"}
        description="Your event operations command center."
        meta={
          <>
            {user && <Badge tone="neutral" variant="outline">{getUserRoleLabel(user.role)}</Badge>}
            <Badge tone={isMockApi ? "warning" : "success"}>
              {isMockApi ? "Sample data" : "Live data"}
            </Badge>
            {aiActionCount > 0 && (
              <Link to={`/events/${eventId}/ai/actions`}>
                <Badge tone="warning">{aiActionCount} AI approvals pending</Badge>
              </Link>
            )}
          </>
        }
        actions={
          <Button
            variant="outline"
            leadingIcon={RefreshCw}
            loading={refreshingCount > 0}
            onClick={refetchAll}
          >
            {refreshingCount > 0 ? `Refreshing ${refreshingCount}…` : "Refresh"}
          </Button>
        }
      />

      {isMockApi && (
        <PreviewNotice>
          <span className="font-medium text-fg">Development data.</span> Dashboard endpoints are not
          connected yet — layout, states and interactions are final, figures are sample values.
        </PreviewNotice>
      )}

      {/* No active event */}
      {eventLoading ? <Skeleton className="h-64 rounded-card" /> : null}
      {!hasEvent && !summary.isLoading && !eventLoading ? <EmptyDashboard /> : null}

      {hasEvent && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Event context */}
          <div className="order-1 lg:order-1 lg:col-span-3">
            {summary.data ? (
              <DashboardHeader summary={summary.data} />
            ) : (
              <DashboardSection title="Event">
                <SectionBody
                  isLoading={summary.isLoading}
                  error={summary.error}
                  hasData={Boolean(summary.data)}
                  onRetry={summary.refetch}
                  skeletonRows={2}
                >
                  {null}
                </SectionBody>
              </DashboardSection>
            )}
          </div>

          {/* Overview statistics */}
          <div className="order-2 lg:order-2 lg:col-span-3">
            <OverviewStats
              eventId={summary.data?.eventId ?? null}
              stats={summary.data?.stats ?? []}
              isLoading={summary.isLoading}
            />
          </div>

          {/* Today's priorities */}
          <div className="order-3 lg:order-3 lg:col-span-2">
            <DashboardSection
              title="Today's priorities"
              action={
                <Link to={`/events/${eventId}/tasks`} className={SECTION_LINK}>
                  All tasks
                </Link>
              }
            >
              <SectionBody
                isLoading={priorities.isLoading}
                error={priorities.error}
                hasData={Boolean(priorities.data)}
                onRetry={priorities.refetch}
                skeletonRows={4}
              >
                {priorities.data && (
                  <PriorityTasks eventId={eventId} priorities={priorities.data} />
                )}
              </SectionBody>
            </DashboardSection>
          </div>

          {/* Active risks */}
          <div className="order-4 lg:order-5 lg:col-span-1">
            <DashboardSection
              title="Active risks"
              action={
                <Link to={`/events/${eventId}/risks`} className={SECTION_LINK}>
                  All risks
                </Link>
              }
            >
              <SectionBody
                isLoading={risks.isLoading}
                error={risks.error}
                hasData={Boolean(risks.data)}
                onRetry={risks.refetch}
                skeletonRows={3}
              >
                {risks.data && <RiskSummary eventId={eventId} risks={risks.data} />}
              </SectionBody>
            </DashboardSection>
          </div>

          {/* Upcoming deadlines */}
          <div className="order-5 lg:order-6 lg:col-span-1">
            <DashboardSection
              title="Upcoming deadlines"
              action={
                <Link to={`/events/${eventId}/tasks`} className={SECTION_LINK}>
                  Calendar
                </Link>
              }
            >
              <SectionBody
                isLoading={deadlines.isLoading}
                error={deadlines.error}
                hasData={Boolean(deadlines.data)}
                onRetry={deadlines.refetch}
                skeletonRows={4}
              >
                {deadlines.data && (
                  <UpcomingDeadlines eventId={eventId} deadlines={deadlines.data} />
                )}
              </SectionBody>
            </DashboardSection>
          </div>

          {/* Event progress */}
          <div className="order-6 lg:order-7 lg:col-span-1">
            <DashboardSection title="Event progress">
              <SectionBody
                isLoading={progress.isLoading}
                error={progress.error}
                hasData={Boolean(progress.data)}
                onRetry={progress.refetch}
                skeletonRows={4}
              >
                {progress.data && <EventProgressPanel eventId={eventId} progress={progress.data} />}
              </SectionBody>
            </DashboardSection>
          </div>

          {/* Volunteer snapshot */}
          <div className="order-7 lg:order-8 lg:col-span-1">
            <DashboardSection
              title="Volunteer snapshot"
              action={
                <Link to={`/events/${eventId}/volunteers`} className={SECTION_LINK}>
                  Roster
                </Link>
              }
            >
              <SectionBody
                isLoading={volunteers.isLoading}
                error={volunteers.error}
                hasData={Boolean(volunteers.data)}
                onRetry={volunteers.refetch}
                skeletonRows={5}
              >
                {volunteers.data && (
                  <VolunteerSnapshotPanel eventId={eventId} snapshot={volunteers.data} />
                )}
              </SectionBody>
            </DashboardSection>
          </div>

          {/* AI daily brief */}
          <div className="order-8 lg:order-4 lg:col-span-1">
            <DashboardSection title="AI daily brief">
              <SectionBody
                isLoading={brief.isLoading}
                error={brief.error}
                hasData={Boolean(brief.data)}
                onRetry={brief.refetch}
                skeletonRows={5}
              >
                {brief.data && (
                  <AIDailyBriefPanel
                    eventId={eventId}
                    brief={brief.data}
                    isMockData={isMockApi}
                  />
                )}
              </SectionBody>
            </DashboardSection>
          </div>

          {/* Recent activity */}
          <div className="order-9 lg:order-9 lg:col-span-2">
            <DashboardSection title="Recent activity">
              <SectionBody
                isLoading={activity.isLoading}
                error={activity.error}
                hasData={Boolean(activity.data)}
                onRetry={activity.refetch}
                skeletonRows={4}
              >
                {activity.data && (
                  <RecentActivityList eventId={eventId} activity={activity.data} />
                )}
              </SectionBody>
            </DashboardSection>
          </div>
        </div>
      )}

      {/* Soft failure banner: some sections degraded but data is still shown */}
      {hasEvent && !summary.isLoading && !priorities.isLoading && priorities.error && (
        <ErrorState
          variant="inline"
          title="Some sections could not be refreshed"
          description="The dashboard is showing the last successfully loaded data."
          onRetry={refetchAll}
        />
      )}
    </div>
  );
}
