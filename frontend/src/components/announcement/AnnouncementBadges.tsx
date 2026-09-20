import { Badge } from "@/components/ui";
import {
  ANNOUNCEMENT_AUDIENCE_LABEL,
  ANNOUNCEMENT_CATEGORY_LABEL,
  ANNOUNCEMENT_PRIORITY_LABEL,
  ANNOUNCEMENT_PRIORITY_TONE,
  ANNOUNCEMENT_STATUS_LABEL,
  ANNOUNCEMENT_STATUS_TONE,
} from "@/lib/announcement";
import type {
  AnnouncementAudience,
  AnnouncementCategory,
  AnnouncementPriority,
  AnnouncementStatus,
} from "@/types";

export function AnnouncementStatusBadge({ status }: { status: AnnouncementStatus }) {
  return (
    <Badge tone={ANNOUNCEMENT_STATUS_TONE[status]} dot>
      {ANNOUNCEMENT_STATUS_LABEL[status]}
    </Badge>
  );
}

export function AnnouncementPriorityBadge({ priority }: { priority: AnnouncementPriority }) {
  return (
    <Badge tone={ANNOUNCEMENT_PRIORITY_TONE[priority]}>
      {ANNOUNCEMENT_PRIORITY_LABEL[priority]}
    </Badge>
  );
}

export function AnnouncementAudienceBadge({ audience }: { audience: AnnouncementAudience }) {
  return (
    <Badge tone="neutral" variant="outline">
      {ANNOUNCEMENT_AUDIENCE_LABEL[audience]}
    </Badge>
  );
}

export function AnnouncementCategoryBadge({ category }: { category: AnnouncementCategory }) {
  return (
    <Badge tone="brand" variant="outline">
      {ANNOUNCEMENT_CATEGORY_LABEL[category]}
    </Badge>
  );
}
