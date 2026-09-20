import { Search, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { EMPTY_MEETING_FILTERS } from "@/lib/meeting";
import type { MeetingFilters as MeetingFiltersData, MeetingProcessingStatus, MeetingStatus } from "@/types";

const SELECT_CLASS =
  "h-9 rounded-control border border-line bg-surface px-3 text-xs text-fg shadow-xs hover:border-line-strong focus:border-brand focus:outline-none";

export function MeetingFilters({
  filters,
  onChange,
  total,
  shown,
}: {
  filters: MeetingFiltersData;
  onChange: (value: MeetingFiltersData) => void;
  total: number;
  shown: number;
}) {
  const active = JSON.stringify(filters) !== JSON.stringify(EMPTY_MEETING_FILTERS);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          size="sm"
          leadingIcon={Search}
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Search meetings…"
          aria-label="Search meetings"
          containerClassName="sm:max-w-xs sm:flex-1"
        />
        <select
          aria-label="Filter by timeframe"
          className={SELECT_CLASS}
          value={filters.timeframe}
          onChange={(event) =>
            onChange({ ...filters, timeframe: event.target.value as MeetingFiltersData["timeframe"] })
          }
        >
          <option value="all">All dates</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
        <select
          aria-label="Filter by meeting status"
          className={SELECT_CLASS}
          value={filters.status}
          onChange={(event) =>
            onChange({ ...filters, status: event.target.value as MeetingStatus | "all" })
          }
        >
          <option value="all">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="held">Held</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          aria-label="Filter by processing state"
          className={SELECT_CLASS}
          value={filters.processingStatus}
          onChange={(event) =>
            onChange({
              ...filters,
              processingStatus: event.target.value as MeetingProcessingStatus | "all",
            })
          }
        >
          <option value="all">Any processing state</option>
          <option value="not_processed">Not processed</option>
          <option value="processing">Processing</option>
          <option value="completed">Intelligence ready</option>
          <option value="failed">Failed</option>
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
            leadingIcon={X}
            className="h-7"
            onClick={() => onChange(EMPTY_MEETING_FILTERS)}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
