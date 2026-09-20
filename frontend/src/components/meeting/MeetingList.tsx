import { CalendarDays, ClipboardCheck, ListChecks, MapPin, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/format";
import { formatMeetingTime } from "@/lib/meeting";
import type { Meeting } from "@/types";
import { MeetingStatusBadge, ProcessingBadge } from "./MeetingBadges";

function OutcomeCounts({ meeting }: { meeting: Meeting }) {
  if (meeting.processingStatus !== "completed") {
    return <span className="text-xs text-fg-subtle">—</span>;
  }
  return (
    <span className="flex items-center gap-3 text-xs text-fg-muted tabular-nums">
      <span className="flex items-center gap-1" title="Decisions">
        <ClipboardCheck width={13} height={13} aria-hidden className="text-fg-subtle" />
        {meeting.decisionCount}
        <span className="sr-only">decisions</span>
      </span>
      <span className="flex items-center gap-1" title="Action items">
        <ListChecks width={13} height={13} aria-hidden className="text-fg-subtle" />
        {meeting.actionItemCount}
        <span className="sr-only">action items</span>
      </span>
    </span>
  );
}

export function MeetingTable({ eventId, meetings }: { eventId: string; meetings: Meeting[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-card border border-line bg-surface md:block">
      <table className="w-full min-w-[760px]">
        <thead className="border-b border-line bg-surface-subtle">
          <tr>
            {["Meeting", "When", "Organizer", "Participants", "Status", "Intelligence", "Outcomes"].map(
              (label) => (
                <th
                  key={label}
                  scope="col"
                  className="px-4 py-2.5 text-left text-xs font-semibold text-fg-muted"
                >
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {meetings.map((meeting) => (
            <tr key={meeting.id} className="transition-colors hover:bg-surface-subtle">
              <td className="max-w-[300px] px-4 py-3">
                <Link
                  to={`/events/${eventId}/meetings/${meeting.id}`}
                  className="block truncate text-sm font-medium text-fg underline-offset-4 hover:text-brand hover:underline"
                >
                  {meeting.title}
                </Link>
                {meeting.location && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-fg-subtle">
                    <MapPin width={11} height={11} aria-hidden />
                    {meeting.location}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-fg-muted">
                <span className="block text-fg">{formatDate(meeting.startIso)}</span>
                {formatMeetingTime(meeting.startIso, meeting.endIso)}
              </td>
              <td className="px-4 py-3 text-xs text-fg">{meeting.organizerName ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-fg-muted tabular-nums">
                {meeting.participants.length}
              </td>
              <td className="px-4 py-3">
                <MeetingStatusBadge status={meeting.status} />
              </td>
              <td className="px-4 py-3">
                <ProcessingBadge status={meeting.processingStatus} />
              </td>
              <td className="px-4 py-3">
                <OutcomeCounts meeting={meeting} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MeetingCards({ eventId, meetings }: { eventId: string; meetings: Meeting[] }) {
  const navigate = useNavigate();
  return (
    <div className="grid gap-3 md:hidden">
      {meetings.map((meeting) => (
        <article key={meeting.id} className="rounded-card border border-line bg-surface p-4 shadow-xs">
          <button
            type="button"
            className="block w-full text-left"
            onClick={() => navigate(`/events/${eventId}/meetings/${meeting.id}`)}
          >
            <h3 className="text-sm font-semibold text-fg">{meeting.title}</h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
              <span className="flex items-center gap-1">
                <CalendarDays width={11} height={11} aria-hidden />
                {formatDate(meeting.startIso)} · {formatMeetingTime(meeting.startIso, meeting.endIso)}
              </span>
              <span className="flex items-center gap-1">
                <Users width={11} height={11} aria-hidden />
                {meeting.participants.length}
              </span>
            </p>
          </button>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <MeetingStatusBadge status={meeting.status} />
            <ProcessingBadge status={meeting.processingStatus} />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-fg-muted">
            <span>{meeting.organizerName ? `Organized by ${meeting.organizerName}` : "No organizer"}</span>
            <OutcomeCounts meeting={meeting} />
          </div>
        </article>
      ))}
    </div>
  );
}
