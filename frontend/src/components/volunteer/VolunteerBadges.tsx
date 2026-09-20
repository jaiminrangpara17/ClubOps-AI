import { Badge } from "@/components/ui";
import {
  AVAILABILITY_LABEL,
  AVAILABILITY_TONE,
  VOLUNTEER_STATUS_LABEL,
  VOLUNTEER_STATUS_TONE,
  WORKLOAD_LABEL,
  WORKLOAD_TONE,
} from "@/lib/volunteer";
import type {
  VolunteerAvailability,
  VolunteerStatus,
  VolunteerWorkloadLevel,
} from "@/types";

export function VolunteerStatusBadge({ status }: { status: VolunteerStatus }) {
  return <Badge tone={VOLUNTEER_STATUS_TONE[status]} dot>{VOLUNTEER_STATUS_LABEL[status]}</Badge>;
}

export function VolunteerAvailabilityBadge({
  availability,
}: {
  availability: VolunteerAvailability;
}) {
  return (
    <Badge tone={AVAILABILITY_TONE[availability]} variant="outline">
      {AVAILABILITY_LABEL[availability]}
    </Badge>
  );
}

export function VolunteerWorkloadBadge({ level }: { level: VolunteerWorkloadLevel }) {
  return <Badge tone={WORKLOAD_TONE[level]}>{WORKLOAD_LABEL[level]}</Badge>;
}