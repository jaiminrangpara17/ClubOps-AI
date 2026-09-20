import { useState } from "react";
import { Button, ErrorState, Input } from "@/components/ui";
import type {
  ClubMemberOption,
  CreateVolunteerRequest,
  UpdateVolunteerRequest,
  Volunteer,
  VolunteerAvailability,
  VolunteerStatus,
} from "@/types";

const CONTROL =
  "mt-1.5 h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-fg shadow-xs hover:border-line-strong focus:border-brand focus:outline-none";

export function VolunteerForm({
  volunteer,
  members,
  membersLoading,
  membersError,
  onSubmit,
  onCancel,
  loading,
}: {
  volunteer?: Volunteer;
  members: ClubMemberOption[];
  membersLoading?: boolean;
  membersError?: string | null;
  onSubmit: (request: CreateVolunteerRequest | UpdateVolunteerRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [memberId, setMemberId] = useState(volunteer?.memberId ?? "");
  const [eventRole, setEventRole] = useState(volunteer?.eventRole ?? "");
  const [availability, setAvailability] = useState<VolunteerAvailability>(
    volunteer?.availability ?? "available",
  );
  const [availabilityNote, setAvailabilityNote] = useState(volunteer?.availabilityNote ?? "");
  const [status, setStatus] = useState<VolunteerStatus>(volunteer?.status ?? "active");
  const [notes, setNotes] = useState(volunteer?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!volunteer && !memberId) next.memberId = "Select an existing club member.";
    if (eventRole.trim().length < 2) next.eventRole = "Enter an event role.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const participation = {
      eventRole: eventRole.trim(),
      availability,
      availabilityNote: availabilityNote.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
    };
    await onSubmit(volunteer ? participation : { ...participation, memberId });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {!volunteer && (
        <div>
          <label htmlFor="volunteer-member" className="block text-xs font-medium text-fg-muted">
            Club member <span className="text-danger">*</span>
          </label>
          <select
            id="volunteer-member"
            value={memberId}
            onChange={(event) => setMemberId(event.target.value)}
            disabled={membersLoading}
            className={CONTROL}
          >
            <option value="">{membersLoading ? "Loading members…" : "Select a member"}</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}{member.clubRole ? ` — ${member.clubRole}` : ""}
              </option>
            ))}
          </select>
          {errors.memberId && <p className="mt-1.5 text-xs font-medium text-danger">{errors.memberId}</p>}
          {membersError && <ErrorState variant="inline" title="Members unavailable" description={membersError} />}
          <p className="mt-1.5 text-xs text-fg-subtle">
            Adds an existing person to this event. It does not create a new user.
          </p>
        </div>
      )}

      {volunteer && (
        <div className="rounded-control border border-line bg-surface-subtle px-3 py-2.5">
          <p className="text-xs text-fg-subtle">Club member</p>
          <p className="text-sm font-medium text-fg">{volunteer.name}</p>
        </div>
      )}

      <Input
        label="Event role"
        required
        value={eventRole}
        onChange={(event) => setEventRole(event.target.value)}
        placeholder="e.g. Registration Lead"
        error={errors.eventRole}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="volunteer-availability" className="block text-xs font-medium text-fg-muted">Availability</label>
          <select id="volunteer-availability" value={availability} onChange={(event) => setAvailability(event.target.value as VolunteerAvailability)} className={CONTROL}>
            <option value="available">Available</option>
            <option value="partially_available">Partially available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
        <div>
          <label htmlFor="volunteer-status" className="block text-xs font-medium text-fg-muted">Participation status</label>
          <select id="volunteer-status" value={status} onChange={(event) => setStatus(event.target.value as VolunteerStatus)} className={CONTROL}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <Input
        label="Availability note"
        value={availabilityNote}
        onChange={(event) => setAvailabilityNote(event.target.value)}
        placeholder="e.g. Available 10:00 AM – 4:00 PM"
      />

      <div>
        <label htmlFor="volunteer-notes" className="block text-xs font-medium text-fg-muted">Event notes</label>
        <textarea
          id="volunteer-notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="mt-1.5 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-fg shadow-xs placeholder:text-fg-subtle focus:border-brand focus:outline-none"
          placeholder="Event-specific context only"
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{volunteer ? "Save changes" : "Add volunteer"}</Button>
      </div>
    </form>
  );
}