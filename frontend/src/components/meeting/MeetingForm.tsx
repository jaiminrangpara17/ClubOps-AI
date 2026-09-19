import { useState } from "react";
import { Button, ErrorState, Input } from "@/components/ui";
import type { CreateMeetingRequest, EventMember, Meeting, MeetingStatus } from "@/types";

const CONTROL =
  "mt-1.5 w-full rounded-control border border-line bg-surface px-3 text-sm text-fg shadow-xs hover:border-line-strong focus:border-brand focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const TITLE_MIN = 3;
const TITLE_MAX = 120;

function toLocalDate(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toLocalTime(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function combine(date: string, time: string): string {
  return new Date(`${date}T${time || "00:00"}:00`).toISOString();
}

export function MeetingForm({
  meeting,
  members,
  membersLoading,
  membersError,
  onSubmit,
  onCancel,
  loading,
}: {
  meeting?: Meeting;
  members: EventMember[];
  membersLoading?: boolean;
  membersError?: string | null;
  onSubmit: (request: CreateMeetingRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [title, setTitle] = useState(meeting?.title ?? "");
  const [date, setDate] = useState(meeting ? toLocalDate(meeting.startIso) : "");
  const [startTime, setStartTime] = useState(meeting ? toLocalTime(meeting.startIso) : "");
  const [endTime, setEndTime] = useState(meeting?.endIso ? toLocalTime(meeting.endIso) : "");
  const [location, setLocation] = useState(meeting?.location ?? "");
  const [organizerId, setOrganizerId] = useState(meeting?.organizerMemberId ?? "");
  const [participantIds, setParticipantIds] = useState<string[]>(
    meeting?.participants.map((participant) => participant.memberId) ?? [],
  );
  const [agenda, setAgenda] = useState(meeting?.agenda ?? "");
  const [notes, setNotes] = useState(meeting?.notes ?? "");
  const [status, setStatus] = useState<MeetingStatus>(meeting?.status ?? "scheduled");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleParticipant = (memberId: string) =>
    setParticipantIds((current) =>
      current.includes(memberId)
        ? current.filter((entry) => entry !== memberId)
        : [...current, memberId],
    );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    const trimmed = title.trim();
    if (trimmed.length < TITLE_MIN) next.title = `Title must be at least ${TITLE_MIN} characters.`;
    else if (trimmed.length > TITLE_MAX) next.title = `Title cannot exceed ${TITLE_MAX} characters.`;
    if (!date) next.date = "Meeting date is required.";
    if (!startTime) next.startTime = "Start time is required.";
    if (endTime && startTime && endTime <= startTime) next.endTime = "End time must be after the start time.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    await onSubmit({
      title: trimmed,
      startIso: combine(date, startTime),
      endIso: endTime ? combine(date, endTime) : null,
      location: location.trim() || null,
      organizerMemberId: organizerId || null,
      participantMemberIds: participantIds,
      agenda: agenda.trim() || null,
      notes: notes.trim() || null,
      status,
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Input
        label="Meeting title"
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="e.g. Core committee sync"
        error={errors.title}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Date" required type="date" value={date} onChange={(event) => setDate(event.target.value)} error={errors.date} />
        <Input label="Start time" required type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} error={errors.startTime} />
        <Input label="End time" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} error={errors.endTime} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Room, venue or Online" />
        <div>
          <label htmlFor="meeting-organizer" className="block text-xs font-medium text-fg-muted">Organizer</label>
          <select
            id="meeting-organizer"
            value={organizerId}
            onChange={(event) => setOrganizerId(event.target.value)}
            disabled={membersLoading}
            className={`${CONTROL} h-10`}
          >
            <option value="">{membersLoading ? "Loading members…" : "No organizer"}</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}{member.role ? ` — ${member.role}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="text-xs font-medium text-fg-muted">Participants</legend>
        {membersError ? (
          <ErrorState variant="inline" title="Members unavailable" description={membersError} />
        ) : (
          <div className="mt-1.5 grid gap-1.5 rounded-control border border-line bg-surface-subtle p-2 sm:grid-cols-2">
            {members.map((member) => {
              const id = `participant-${member.id}`;
              return (
                <label key={member.id} htmlFor={id} className="flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-sm text-fg hover:bg-surface">
                  <input
                    id={id}
                    type="checkbox"
                    checked={participantIds.includes(member.id)}
                    onChange={() => toggleParticipant(member.id)}
                    className="h-3.5 w-3.5 accent-brand-600"
                  />
                  <span className="min-w-0 truncate">
                    {member.name}
                    {member.role && <span className="text-fg-subtle"> · {member.role}</span>}
                  </span>
                </label>
              );
            })}
            {members.length === 0 && !membersLoading && (
              <p className="px-2 py-1.5 text-xs text-fg-subtle">No members available for this event.</p>
            )}
          </div>
        )}
        <p className="mt-1.5 text-xs text-fg-subtle">{participantIds.length} selected</p>
      </fieldset>

      <div>
        <label htmlFor="meeting-agenda" className="block text-xs font-medium text-fg-muted">Agenda</label>
        <textarea id="meeting-agenda" rows={4} value={agenda} onChange={(event) => setAgenda(event.target.value)} placeholder="One item per line" className={`${CONTROL} py-2`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="meeting-notes" className="block text-xs font-medium text-fg-muted">Notes</label>
          <textarea id="meeting-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional context" className={`${CONTROL} py-2`} />
        </div>
        <div>
          <label htmlFor="meeting-status" className="block text-xs font-medium text-fg-muted">Status</label>
          <select id="meeting-status" value={status} onChange={(event) => setStatus(event.target.value as MeetingStatus)} className={`${CONTROL} h-10 sm:w-40`}>
            <option value="scheduled">Scheduled</option>
            <option value="held">Held</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{meeting ? "Save changes" : "Create meeting"}</Button>
      </div>
    </form>
  );
}
