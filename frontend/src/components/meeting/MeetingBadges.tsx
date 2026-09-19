import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui";
import {
  MEETING_STATUS_LABEL,
  MEETING_STATUS_TONE,
  PROCESSING_LABEL,
  PROCESSING_TONE,
} from "@/lib/meeting";
import type { MeetingProcessingStatus, MeetingStatus } from "@/types";

export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  return (
    <Badge tone={MEETING_STATUS_TONE[status]} dot>
      {MEETING_STATUS_LABEL[status]}
    </Badge>
  );
}

/** Processing state is always labelled in text, never colour alone. */
export function ProcessingBadge({ status }: { status: MeetingProcessingStatus }) {
  return (
    <Badge tone={PROCESSING_TONE[status]} variant="outline" className="gap-1.5">
      {status === "processing" && (
        <Loader2 width={11} height={11} aria-hidden className="animate-spin" />
      )}
      {PROCESSING_LABEL[status]}
    </Badge>
  );
}
