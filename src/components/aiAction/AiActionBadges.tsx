import { Badge } from "@/components/ui";
import type { AiActionStatus, AiActionType, Tone } from "@/types";

const STATUS_LABEL: Record<AiActionStatus, string> = {
  pending: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  executing: "Executing",
  completed: "Completed",
  failed: "Failed",
  expired: "Expired",
};

const STATUS_TONE: Record<AiActionStatus, Tone> = {
  pending: "warning",
  approved: "info",
  rejected: "neutral",
  executing: "brand",
  completed: "success",
  failed: "danger",
  expired: "neutral",
};

const TYPE_LABEL: Record<AiActionType, string> = {
  create_task: "Create task",
  update_task: "Update task",
  assign_task: "Assign task",
  update_risk: "Update risk",
  create_announcement: "Create announcement",
  assign_volunteer: "Assign volunteer",
};

export function AiActionStatusBadge({ status }: { status: AiActionStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]} dot>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function AiActionTypeBadge({ type }: { type: AiActionType }) {
  return (
    <Badge tone="neutral" variant="outline">
      {TYPE_LABEL[type]}
    </Badge>
  );
}
