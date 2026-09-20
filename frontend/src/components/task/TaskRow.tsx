/**
 * TaskRow — a single row in the desktop task table.
 *
 * Shows:
 * - Title (with description preview)
 * - Assignee (avatar + name)
 * - Priority badge
 * - Status badge (with quick transition)
 * - Due date (with overdue indicator)
 * - Blocker hint (if present)
 * - Actions menu
 */
import { Calendar, Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, Badge, Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getTaskDueLabel, getTaskDeadlineState, isTaskOverdue } from "@/lib/taskDateUtils";
import { getNextQuickStatus } from "@/lib/taskStatus";
import type { Task, TaskStatus } from "@/types";
import { TaskPriorityBadge, TaskStatusBadge } from "./TaskBadges";

export interface TaskRowProps {
  task: Task;
  eventId: string;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  isUpdating?: boolean;
}

export function TaskRow({
  task,
  eventId,
  onStatusChange,
  onDelete,
  isUpdating = false,
}: TaskRowProps) {
  const navigate = useNavigate();
  const isOverdue = isTaskOverdue(task);
  const deadlineState = getTaskDeadlineState(task);
  const dueLabel = getTaskDueLabel(task);
  const nextStatus = getNextQuickStatus(task.status);

  return (
    <tr
      className={cn(
        "group border-b border-line transition-colors hover:bg-surface-subtle",
        isOverdue && "bg-danger-soft/30",
        isUpdating && "opacity-60",
      )}
    >
      {/* Title + description + blocker */}
      <td className="min-w-[220px] max-w-[480px] px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(`/events/${eventId}/tasks/${task.id}`)}
          className="block text-left"
        >
          <div className="flex items-start gap-2">
            <span
              className={cn(
                "mt-1 h-2 w-2 shrink-0 rounded-full",
                task.status === "completed" ? "bg-success" :
                task.status === "blocked" ? "bg-danger" :
                task.status === "in_progress" ? "bg-brand" :
                "bg-neutral",
              )}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fg">{task.title}</p>
              {task.description && (
                <p className="mt-0.5 line-clamp-1 text-xs text-fg-muted">
                  {task.description}
                </p>
              )}
              {task.blocker && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-danger">
                  <span aria-hidden>⚠</span>
                  <span className="line-clamp-1">{task.blocker}</span>
                </p>
              )}
            </div>
          </div>
        </button>
      </td>

      {/* Assignee */}
      <td className="px-4 py-3">
        {task.assigneeName ? (
          <div className="flex items-center gap-2">
            <Avatar name={task.assigneeName} size="xs" tone="neutral" />
            <span className="text-xs text-fg">{task.assigneeName}</span>
          </div>
        ) : (
          <span className="text-xs text-fg-subtle">Unassigned</span>
        )}
      </td>

      {/* Priority */}
      <td className="px-4 py-3">
        <TaskPriorityBadge priority={task.priority} compact />
      </td>

      {/* Status (with quick transition button) */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <TaskStatusBadge status={task.status} />
          {nextStatus && (
            <button
              type="button"
              onClick={() => onStatusChange(task.id, nextStatus)}
              disabled={isUpdating}
              className="rounded-sm p-0.5 text-fg-subtle opacity-0 transition-opacity hover:bg-surface-inset hover:text-fg group-hover:opacity-100 disabled:opacity-0"
              aria-label={`Mark as ${nextStatus}`}
              title={`Mark as ${nextStatus}`}
            >
              <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden>
                <path d="M3 6l2.5 2.5L9 4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </td>

      {/* Due date */}
      <td className="px-4 py-3">
        {task.dueIso ? (
          <div className="flex items-center gap-1.5">
            <Calendar
              width={12}
              height={12}
              className={cn(
                "shrink-0",
                isOverdue ? "text-danger" :
                deadlineState === "due_today" ? "text-warning" :
                "text-fg-subtle",
              )}
            />
            <span
              className={cn(
                "text-xs tabular-nums",
                isOverdue ? "font-medium text-danger" :
                deadlineState === "due_today" ? "font-medium text-warning" :
                "text-fg-muted",
              )}
            >
              {dueLabel}
            </span>
          </div>
        ) : (
          <Badge tone="neutral" variant="outline" className="text-[10px]">
            No date
          </Badge>
        )}
      </td>

      {/* Actions */}
      <td className="w-12 px-2 py-3">
        <Dropdown
          align="end"
          trigger={({ open, toggle }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-haspopup="menu"
              aria-label="Task actions"
              className="flex h-7 w-7 items-center justify-center rounded-control text-fg-subtle hover:bg-surface-inset hover:text-fg"
            >
              <MoreVertical width={14} height={14} />
            </button>
          )}
        >
          <DropdownItem
            icon={Eye}
            onClick={() => navigate(`/events/${eventId}/tasks/${task.id}`)}
          >
            View details
          </DropdownItem>
          <DropdownItem
            icon={Pencil}
            onClick={() => navigate(`/events/${eventId}/tasks/${task.id}/edit`)}
          >
            Edit task
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem
            icon={Trash2}
            onClick={() => onDelete(task.id)}
            variant="destructive"
          >
            Delete task
          </DropdownItem>
        </Dropdown>
      </td>
    </tr>
  );
}
