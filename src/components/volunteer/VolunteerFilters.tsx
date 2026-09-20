import { Search, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { EMPTY_VOLUNTEER_FILTERS } from "@/lib/volunteer";
import type {
  VolunteerAvailability,
  VolunteerFilters as VolunteerFiltersData,
  VolunteerStatus,
  VolunteerWorkloadLevel,
} from "@/types";

const SELECT_CLASS =
  "h-9 rounded-control border border-line bg-surface px-3 text-xs text-fg shadow-xs hover:border-line-strong focus:border-brand focus:outline-none";

export function VolunteerFilters({
  filters,
  roles,
  onChange,
  total,
  shown,
}: {
  filters: VolunteerFiltersData;
  roles: string[];
  onChange: (value: VolunteerFiltersData) => void;
  total: number;
  shown: number;
}) {
  const active = JSON.stringify(filters) !== JSON.stringify(EMPTY_VOLUNTEER_FILTERS);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          size="sm"
          leadingIcon={Search}
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Search volunteers or roles…"
          aria-label="Search volunteers"
          containerClassName="sm:max-w-xs sm:flex-1"
        />
        <select
          aria-label="Filter by status"
          className={SELECT_CLASS}
          value={filters.status}
          onChange={(event) => onChange({ ...filters, status: event.target.value as VolunteerStatus | "all" })}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          aria-label="Filter by role"
          className={SELECT_CLASS}
          value={filters.role}
          onChange={(event) => onChange({ ...filters, role: event.target.value })}
        >
          <option value="all">All roles</option>
          {roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <select
          aria-label="Filter by availability"
          className={SELECT_CLASS}
          value={filters.availability}
          onChange={(event) => onChange({
            ...filters,
            availability: event.target.value as VolunteerAvailability | "all",
          })}
        >
          <option value="all">Any availability</option>
          <option value="available">Available</option>
          <option value="partially_available">Partially available</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <select
          aria-label="Filter by workload"
          className={SELECT_CLASS}
          value={filters.workload}
          onChange={(event) => onChange({
            ...filters,
            workload: event.target.value as VolunteerWorkloadLevel | "all",
          })}
        >
          <option value="all">Any workload</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="overloaded">Overloaded</option>
        </select>
      </div>
      <div className="flex items-center gap-2 text-xs text-fg-muted">
        <span>Showing <strong className="text-fg">{shown}</strong> of {total}</span>
        {active && (
          <Button size="sm" variant="ghost" leadingIcon={X} onClick={() => onChange(EMPTY_VOLUNTEER_FILTERS)} className="h-7">
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}