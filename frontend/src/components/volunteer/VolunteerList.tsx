import { Eye, MoreVertical, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, Dropdown, DropdownItem } from "@/components/ui";
import type { VolunteerWithTasks } from "@/types";
import {
  VolunteerAvailabilityBadge,
  VolunteerStatusBadge,
  VolunteerWorkloadBadge,
} from "./VolunteerBadges";

function Actions({ eventId, volunteerId }: { eventId: string; volunteerId: string }) {
  const navigate = useNavigate();
  return (
    <Dropdown
      align="end"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Volunteer actions"
          className="flex h-8 w-8 items-center justify-center rounded-control text-fg-subtle hover:bg-surface-inset hover:text-fg"
        >
          <MoreVertical width={15} height={15} aria-hidden />
        </button>
      )}
    >
      <DropdownItem icon={Eye} onClick={() => navigate(`/events/${eventId}/volunteers/${volunteerId}`)}>
        View profile
      </DropdownItem>
      <DropdownItem icon={Pencil} onClick={() => navigate(`/events/${eventId}/volunteers/${volunteerId}/edit`)}>
        Edit participation
      </DropdownItem>
    </Dropdown>
  );
}

export function VolunteerTable({
  eventId,
  volunteers,
}: {
  eventId: string;
  volunteers: VolunteerWithTasks[];
}) {
  const navigate = useNavigate();
  return (
    <div className="hidden overflow-x-auto rounded-card border border-line bg-surface md:block">
      <table className="w-full min-w-[780px]">
        <thead className="border-b border-line bg-surface-subtle">
          <tr>
            {[
              "Volunteer",
              "Event role",
              "Availability",
              "Assigned tasks",
              "Workload",
              "Status",
            ].map((label) => (
              <th key={label} scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-fg-muted">
                {label}
              </th>
            ))}
            <th scope="col" className="w-12 px-2 py-2.5"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {volunteers.map((volunteer) => (
            <tr key={volunteer.id} className="transition-colors hover:bg-surface-subtle">
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => navigate(`/events/${eventId}/volunteers/${volunteer.id}`)}
                  className="flex items-center gap-2.5 text-left"
                >
                  <Avatar name={volunteer.name} size="sm" tone="neutral" />
                  <span>
                    <span className="block text-sm font-medium text-fg">{volunteer.name}</span>
                    {volunteer.email && <span className="block text-xs text-fg-subtle">{volunteer.email}</span>}
                  </span>
                </button>
              </td>
              <td className="px-4 py-3 text-sm text-fg-muted">{volunteer.eventRole}</td>
              <td className="px-4 py-3"><VolunteerAvailabilityBadge availability={volunteer.availability} /></td>
              <td className="px-4 py-3 text-sm text-fg tabular-nums">{volunteer.workload.assigned}</td>
              <td className="w-40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <VolunteerWorkloadBadge level={volunteer.workload.level} />
                  <span className="text-[11px] text-fg-subtle">{volunteer.workload.pending} pending</span>
                </div>
              </td>
              <td className="px-4 py-3"><VolunteerStatusBadge status={volunteer.status} /></td>
              <td className="px-2 py-3"><Actions eventId={eventId} volunteerId={volunteer.id} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function VolunteerCards({
  eventId,
  volunteers,
}: {
  eventId: string;
  volunteers: VolunteerWithTasks[];
}) {
  const navigate = useNavigate();
  return (
    <div className="grid gap-3 md:hidden">
      {volunteers.map((volunteer) => (
        <article key={volunteer.id} className="rounded-card border border-line bg-surface p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <Avatar name={volunteer.name} size="md" tone="neutral" />
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => navigate(`/events/${eventId}/volunteers/${volunteer.id}`)}
            >
              <h3 className="truncate text-sm font-semibold text-fg">{volunteer.name}</h3>
              <p className="truncate text-xs text-fg-muted">{volunteer.eventRole}</p>
            </button>
            <Actions eventId={eventId} volunteerId={volunteer.id} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <VolunteerAvailabilityBadge availability={volunteer.availability} />
            <VolunteerWorkloadBadge level={volunteer.workload.level} />
            <VolunteerStatusBadge status={volunteer.status} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
            <div><p className="text-sm font-semibold text-fg">{volunteer.workload.assigned}</p><p className="text-[11px] text-fg-subtle">Tasks</p></div>
            <div><p className="text-sm font-semibold text-fg">{volunteer.workload.pending}</p><p className="text-[11px] text-fg-subtle">Pending</p></div>
            <div><p className="text-sm font-semibold text-danger">{volunteer.workload.overdue}</p><p className="text-[11px] text-fg-subtle">Overdue</p></div>
          </div>
        </article>
      ))}
    </div>
  );
}