/**
 * Task filters — search and filters for task lists.
 *
 * Combines:
 * - Text search (title/description/assignee)
 * - Status filter
 * - Priority filter
 * - Assignee filter
 * - Deadline state filter
 * - Clear filters action
 */
import { Search, X } from "lucide-react";
import { useMemo } from "react";
import { Badge, Button, Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { TASK_PRIORITY_DEFINITIONS, TASK_STATUS_DEFINITIONS } from "@/lib/taskStatus";
import type { DeadlineState, EventMember, TaskFilters, TaskPriority, TaskStatus } from "@/types";

export interface TaskFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  members: EventMember[];
  totalCount: number;
  filteredCount: number;
  className?: string;
}

export function TaskFilters({
  filters,
  onFiltersChange,
  members,
  totalCount,
  filteredCount,
  className,
}: TaskFiltersProps) {
  const hasActiveFilters = useMemo(() => {
    return (
      (filters.search && filters.search.trim().length > 0) ||
      (filters.status && filters.status !== "all") ||
      (filters.priority && filters.priority !== "all") ||
      (filters.assigneeId && filters.assigneeId !== "all") ||
      (filters.deadlineState && filters.deadlineState !== "any")
    );
  }, [filters]);

  const handleReset = () => {
    onFiltersChange({
      status: "all",
      priority: "all",
      assigneeId: "all",
      deadlineState: "any",
      search: "",
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search tasks, assignees…"
          value={filters.search ?? ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          leadingIcon={Search}
          size="sm"
          containerClassName="max-w-xs flex-1"
        />

        <SelectPill
          label="Status"
          value={filters.status ?? "all"}
          onChange={(value) => onFiltersChange({ ...filters, status: value as TaskStatus | "all" })}
          options={[
            { value: "all", label: "All statuses" },
            ...TASK_STATUS_DEFINITIONS.map((s) => ({ value: s.value, label: s.label })),
          ]}
        />

        <SelectPill
          label="Priority"
          value={filters.priority ?? "all"}
          onChange={(value) =>
            onFiltersChange({ ...filters, priority: value as TaskPriority | "all" })
          }
          options={[
            { value: "all", label: "All priorities" },
            ...TASK_PRIORITY_DEFINITIONS.map((p) => ({ value: p.value, label: p.label })),
          ]}
        />

        <SelectPill
          label="Deadline"
          value={filters.deadlineState ?? "any"}
          onChange={(value) =>
            onFiltersChange({ ...filters, deadlineState: value as DeadlineState })
          }
          options={[
            { value: "any", label: "Any" },
            { value: "overdue", label: "Overdue" },
            { value: "due_today", label: "Due today" },
            { value: "upcoming", label: "Upcoming" },
          ]}
        />

        <SelectPill
          label="Assignee"
          value={filters.assigneeId ?? "all"}
          onChange={(value) => onFiltersChange({ ...filters, assigneeId: value })}
          options={[
            { value: "all", label: "All assignees" },
            { value: "unassigned", label: "Unassigned" },
            ...members.map((m) => ({ value: m.id, label: m.name })),
          ]}
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-fg-muted">
        <span>
          Showing <span className="font-medium text-fg">{filteredCount}</span> of{" "}
          <span className="font-medium text-fg">{totalCount}</span>
        </span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            leadingIcon={X}
            className="h-6 px-2 text-xs"
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

/** Compact select pill with active-state styling. */
function SelectPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const active = value !== "all" && value !== "any";

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-8 appearance-none rounded-full border pl-3 pr-8 text-xs font-medium transition-colors",
          "focus:border-brand focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          active
            ? "border-brand bg-brand-soft text-brand-soft-fg"
            : "border-line bg-surface text-fg-muted hover:border-line-strong",
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        width={12}
        height={12}
        className="pointer-events-none absolute right-2.5 text-fg-subtle"
      >
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}

/** Active filter chip — for showing active filters at a glance. */
export function ActiveFilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Badge variant="outline" tone="brand" className="gap-1 pl-2.5 pr-1">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-brand-soft-fg/10"
        aria-label={`Remove ${label}`}
      >
        <X width={10} height={10} />
      </button>
    </Badge>
  );
}
