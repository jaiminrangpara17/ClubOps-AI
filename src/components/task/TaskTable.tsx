/**
 * TaskTable — desktop structured table view for tasks.
 *
 * Shows sortable columns: Title, Assignee, Priority, Status, Due date.
 * Switches to TaskCards on mobile via the parent page's responsive wrapper.
 */
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Task, TaskSort, TaskSortField, TaskStatus } from "@/types";
import { TaskRow } from "./TaskRow";

export interface TaskTableProps {
  tasks: Task[];
  eventId: string;
  sort: TaskSort;
  onSortChange: (sort: TaskSort) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  updatingIds?: Set<string>;
}

const COLUMNS: { field: TaskSortField; label: string; className?: string }[] = [
  { field: "title", label: "Task", className: "min-w-[220px]" },
  { field: "title", label: "Assignee" },
  { field: "priority", label: "Priority" },
  { field: "title", label: "Status" },
  { field: "due_date", label: "Due date" },
];

export function TaskTable({
  tasks,
  eventId,
  sort,
  onSortChange,
  onStatusChange,
  onDelete,
  updatingIds = new Set(),
}: TaskTableProps) {
  const handleSort = (field: TaskSortField) => {
    if (field === "title") {
      // Title column doesn't support sort toggle in this view
      return;
    }
    const direction = sort.field === field && sort.direction === "asc" ? "desc" : "asc";
    onSortChange({ field, direction });
  };

  return (
    <div className="scrollbar-slim overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full min-w-[720px]">
        <thead className="border-b border-line bg-surface-subtle">
          <tr>
            {COLUMNS.map((col, idx) => (
              <th
                key={`${col.label}-${idx}`}
                scope="col"
                className={cn("px-4 py-2.5 text-left text-xs font-semibold text-fg-muted", col.className)}
              >
                <button
                  type="button"
                  onClick={() => handleSort(col.field)}
                  disabled={col.field === "title"}
                  className={cn(
                    "inline-flex items-center gap-1",
                    col.field === "title" && "cursor-default",
                    col.field !== "title" && "hover:text-fg",
                  )}
                >
                  {col.label}
                  {col.field !== "title" && sort.field === col.field && (
                    sort.direction === "asc" ? (
                      <ChevronUp width={12} height={12} aria-hidden />
                    ) : (
                      <ChevronDown width={12} height={12} aria-hidden />
                    )
                  )}
                </button>
              </th>
            ))}
            <th scope="col" className="w-12 px-2 py-2.5" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              eventId={eventId}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              isUpdating={updatingIds.has(task.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
