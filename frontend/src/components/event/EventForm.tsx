import { Calendar, X } from "lucide-react";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { minEventDateIso, maxEventDateIso, EVENT_NAME_MIN, EVENT_NAME_MAX } from "@/lib/eventForm";
import type { CreateEventRequest, Event } from "@/types";
import type { FieldErrors } from "@/lib/eventForm";
import { normalizeEventRequest, validateEvent } from "@/lib/eventForm";

export interface EventFormProps {
  event?: Event;
  onSubmit: (request: CreateEventRequest) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  loading?: boolean;
}

/**
 * Reusable form for creating/editing an event.
 * Shows inline validation, loading state, and action buttons.
 */
export function EventForm({
  event,
  onSubmit,
  onCancel,
  submitLabel = event ? "Save changes" : "Create event",
  loading = false,
}: EventFormProps) {


  const [formData, setFormData] = useState({
    name: event?.name ?? "",
    code: event?.code ?? "",
    startIso: event?.startIso?.slice(0, 10) ?? minEventDateIso(),
    endIso: event?.endIso?.slice(0, 10) ?? minEventDateIso(),
    venue: event?.venue ?? "",
    summary: event?.summary ?? "",
    description: event?.description ?? "",
    attendeesExpected: event?.attendeesExpected ?? "",
    teamSize: event?.teamSize ?? "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});

  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [key]: value }));
    // Clear the error for this field as the user types.
    if (errors[key as keyof FieldErrors]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rawErrors = validateEvent(formData);
    setErrors(rawErrors);
    if (Object.keys(rawErrors).length > 0) return;

    const request = normalizeEventRequest(formData);
    await onSubmit(request);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Input
        label="Event name"
        required
        placeholder="TechFest 2026"
        value={formData.name}
        onChange={(e) => handleChange("name", e.target.value)}
        error={errors.name}
        hint={`Between ${EVENT_NAME_MIN} and ${EVENT_NAME_MAX} characters.`}
      />

      <Input
        label="Event code"
        placeholder="TF26"
        value={formData.code}
        onChange={(e) => handleChange("code", e.target.value)}
        hint="Short reference code, e.g. TF26"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Start date"
          required
          type="date"
          min={minEventDateIso()}
          max={maxEventDateIso()}
          value={formData.startIso}
          onChange={(e) => handleChange("startIso", e.target.value)}
          error={errors.startIso}
        />
        <Input
          label="End date"
          required
          type="date"
          min={minEventDateIso()}
          max={maxEventDateIso()}
          value={formData.endIso}
          onChange={(e) => handleChange("endIso", e.target.value)}
          error={errors.endIso}
        />
      </div>

      <Input
        label="Venue"
        required
        placeholder="Innovation Hall — Campus North"
        value={formData.venue}
        onChange={(e) => handleChange("venue", e.target.value)}
        error={errors.venue}
      />

      <Input
        label="Summary"
        placeholder="One-line description for the event card"
        value={formData.summary}
        onChange={(e) => handleChange("summary", e.target.value)}
        error={errors.summary}
      />

      <Input
        label="Description"
        placeholder="Longer description for the event page"
        value={formData.description}
        onChange={(e) => handleChange("description", e.target.value)}
        error={errors.description}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Expected attendees"
          placeholder="1200"
          value={formData.attendeesExpected}
          onChange={(e) => handleChange("attendeesExpected", e.target.value)}
          error={errors.attendeesExpected}
          type="number"
          min={1}
          max={99999}
        />
        <Input
          label="Team size"
          placeholder="48"
          value={formData.teamSize}
          onChange={(e) => handleChange("teamSize", e.target.value)}
          error={errors.teamSize}
          type="number"
          min={1}
          max={999}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-5">
        {onCancel && (
          <Button variant="ghost" type="button" onClick={onCancel} leadingIcon={X}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading} leadingIcon={event ? undefined : Calendar}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
