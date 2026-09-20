import { Search, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { EMPTY_ANNOUNCEMENT_FILTERS } from "@/lib/announcement";
import type {
  AnnouncementAudience,
  AnnouncementCategory,
  AnnouncementFilters as AnnouncementFiltersData,
  AnnouncementPriority,
  AnnouncementStatus,
} from "@/types";

const SELECT_CLASS =
  "h-9 rounded-control border border-line bg-surface px-3 text-xs text-fg shadow-xs hover:border-line-strong focus:border-brand focus:outline-none";

export function AnnouncementFilters({
  filters,
  onChange,
  total,
  shown,
}: {
  filters: AnnouncementFiltersData;
  onChange: (filters: AnnouncementFiltersData) => void;
  total: number;
  shown: number;
}) {
  const active = JSON.stringify(filters) !== JSON.stringify(EMPTY_ANNOUNCEMENT_FILTERS);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          size="sm"
          leadingIcon={Search}
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Search announcements…"
          aria-label="Search announcements"
          containerClassName="sm:max-w-xs sm:flex-1"
        />
        <select
          aria-label="Filter by status"
          className={SELECT_CLASS}
          value={filters.status}
          onChange={(event) =>
            onChange({ ...filters, status: event.target.value as AnnouncementStatus | "all" })
          }
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="archived">Archived</option>
        </select>
        <select
          aria-label="Filter by priority"
          className={SELECT_CLASS}
          value={filters.priority}
          onChange={(event) =>
            onChange({ ...filters, priority: event.target.value as AnnouncementPriority | "all" })
          }
        >
          <option value="all">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="important">Important</option>
          <option value="normal">Normal</option>
        </select>
        <select
          aria-label="Filter by category"
          className={SELECT_CLASS}
          value={filters.category}
          onChange={(event) =>
            onChange({ ...filters, category: event.target.value as AnnouncementCategory | "all" })
          }
        >
          <option value="all">All categories</option>
          <option value="general">General</option>
          <option value="operations">Operations</option>
          <option value="reminder">Reminder</option>
          <option value="decision">Decision</option>
        </select>
        <select
          aria-label="Filter by audience"
          className={SELECT_CLASS}
          value={filters.audience}
          onChange={(event) =>
            onChange({ ...filters, audience: event.target.value as AnnouncementAudience | "all" })
          }
        >
          <option value="all">All audiences</option>
          <option value="event_team">Entire event team</option>
          <option value="organizers">Organizers</option>
          <option value="volunteers">Volunteers</option>
        </select>
      </div>
      <div className="flex items-center gap-2 text-xs text-fg-muted">
        <span>
          Showing <strong className="text-fg">{shown}</strong> of {total}
        </span>
        {active && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7"
            leadingIcon={X}
            onClick={() => onChange(EMPTY_ANNOUNCEMENT_FILTERS)}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
