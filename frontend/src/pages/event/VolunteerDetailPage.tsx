import { ArrowLeft, CalendarDays, Mail, Pencil, UserRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  VolunteerAvailabilityBadge,
  VolunteerStatusBadge,
  VolunteerWorkloadBadge,
} from "@/components/volunteer";
import { TaskStatusBadge } from "@/components/task/TaskBadges";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui";
import { useVolunteer } from "@/hooks/useVolunteers";
import { formatDate } from "@/lib/format";
import { getTaskDueLabel, isTaskOverdue } from "@/lib/taskDateUtils";

export default function VolunteerDetailPage() {
  const { eventId = "", volunteerId = "" } = useParams();
  const navigate = useNavigate();
  const {
    volunteer,
    assignedTasks,
    error,
    taskError,
    isLoading,
    tasksLoading,
    refetch,
  } = useVolunteer(eventId, volunteerId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-72 rounded-card" />
      </div>
    );
  }

  if (!volunteer || error) {
    return (
      <ErrorState
        title="Unable to load volunteer"
        description={error ?? "This person is not part of this event."}
        onRetry={refetch}
        actions={<Button variant="ghost" onClick={() => navigate(`/events/${eventId}/volunteers`)}>Back to volunteers</Button>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        size="md"
        divider={false}
        title={volunteer.name}
        description={volunteer.eventRole}
        actions={
          <>
            <Button variant="outline" leadingIcon={ArrowLeft} onClick={() => navigate(`/events/${eventId}/volunteers`)}>Back</Button>
            <Button leadingIcon={Pencil} onClick={() => navigate(`/events/${eventId}/volunteers/${volunteer.id}/edit`)}>Edit participation</Button>
          </>
        }
        meta={
          <>
            <VolunteerStatusBadge status={volunteer.status} />
            <VolunteerAvailabilityBadge availability={volunteer.availability} />
            {!tasksLoading && <VolunteerWorkloadBadge level={volunteer.workload.level} />}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Participation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={volunteer.name} size="lg" tone="neutral" />
              <div>
                <p className="text-sm font-semibold text-fg">{volunteer.name}</p>
                <p className="text-xs text-fg-muted">{volunteer.eventRole}</p>
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              {volunteer.email && (
                <div className="flex gap-2">
                  <Mail width={15} height={15} className="mt-0.5 shrink-0 text-fg-subtle" aria-hidden />
                  <div><dt className="text-xs text-fg-subtle">Contact</dt><dd className="text-fg">{volunteer.email}</dd></div>
                </div>
              )}
              <div className="flex gap-2">
                <CalendarDays width={15} height={15} className="mt-0.5 shrink-0 text-fg-subtle" aria-hidden />
                <div><dt className="text-xs text-fg-subtle">Availability</dt><dd className="text-fg">{volunteer.availabilityNote ?? "No time window provided"}</dd></div>
              </div>
              <div className="flex gap-2">
                <UserRound width={15} height={15} className="mt-0.5 shrink-0 text-fg-subtle" aria-hidden />
                <div><dt className="text-xs text-fg-subtle">Joined event</dt><dd className="text-fg">{formatDate(volunteer.createdAt)}</dd></div>
              </div>
            </dl>
            {volunteer.notes && (
              <div className="border-t border-line pt-3">
                <p className="text-xs font-medium text-fg-muted">Event notes</p>
                <p className="mt-1 text-sm text-fg">{volunteer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Workload summary</CardTitle></CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 rounded-control" />
                  ))}
                </div>
              ) : taskError ? (
                <p className="text-sm text-fg-muted">Workload is unavailable because assigned tasks could not be loaded.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["Assigned", volunteer.workload.assigned, "text-fg"],
                      ["Completed", volunteer.workload.completed, "text-success"],
                      ["Pending", volunteer.workload.pending, "text-warning"],
                      ["Overdue", volunteer.workload.overdue, "text-danger"],
                    ].map(([label, value, tone]) => (
                      <div key={String(label)} className="rounded-control border border-line bg-surface-subtle p-3 text-center">
                        <p className={`text-xl font-semibold tabular-nums ${tone}`}>{value}</p>
                        <p className="text-xs text-fg-subtle">{label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-fg-subtle">
                    Workload is derived by the temporary adapter until the backend supplies an authoritative value.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader actions={<Badge tone="neutral">{assignedTasks.length}</Badge>}>
              <CardTitle>Assigned tasks</CardTitle>
            </CardHeader>
            <CardContent padding="none">
              {tasksLoading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 rounded-control" />
                  ))}
                </div>
              ) : taskError ? (
                <div className="p-4">
                  <ErrorState
                    variant="inline"
                    title="Assigned tasks unavailable"
                    description={taskError}
                    onRetry={refetch}
                  />
                </div>
              ) : assignedTasks.length === 0 ? (
                <div className="p-4">
                  <EmptyState title="No assigned tasks" description="Tasks assigned in the event task workspace will appear here." />
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {assignedTasks.map((task) => (
                    <li key={task.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/events/${eventId}/tasks`}
                          className="truncate text-sm font-medium text-fg underline-offset-4 hover:text-brand hover:underline"
                          title="Open the event task workspace"
                        >
                          {task.title}
                        </Link>
                        <p className={isTaskOverdue(task) ? "text-xs font-medium text-danger" : "text-xs text-fg-subtle"}>
                          {task.dueIso ? getTaskDueLabel(task) : "No due date"}
                        </p>
                      </div>
                      <TaskStatusBadge status={task.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}