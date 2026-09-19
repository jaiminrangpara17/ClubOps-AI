/**
 * TaskCard — mobile-friendly card view for tasks.
 *
 * Shows the same info as TaskRow but in a stacked layout with
 * touch-friendly targets and clear visual hierarchy.
 */
import { Calendar, Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, Badge, Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getTaskDueLabel, isTaskOverdue } from "@/lib/taskDateUtils";
import { getNextQuickStatus } from "@/lib/taskStatus";
import type { Task, TaskStatus } from "@/types";
import { TaskPriorityBadge, TaskStatusBadge } from "./TaskBadges";

export interface TaskCardProps {
  task: Task;
  eventId: string;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  isUpdating?: boolean;
}

export function TaskCard({
  task,
  eventId,
  onStatusChange,
  onDelete,
  isUpdating = false,
}: TaskCardProps) {
  const navigate = useNavigate();
  const isOverdue = isTaskOverdue(task);
  const dueLabel = getTaskDueLabel(task);
  const nextStatus = getNextQuickStatus(task.status);

  return (
    <div
      className={cn(
        "space-y-3 rounded-card border border-line bg-surface p-4 transition-colors",
        isOverdue && "border-danger/30 bg-danger-soft/30",
        isUpdating && "opacity-60",
      )}
    >
      {/* Header: title + actions menu */}
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate(`/events/${eventId}/tasks/${task.id}`)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-semibold text-fg">{task.title}</p>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs text-fg-muted">{task.description}</p>
          )}
        </button>
        <Dropdown
          align="end"
          trigger={({ open, toggle }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-haspopup="menu"
              aria-label="Task actions"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-fg-subtle hover:bg-surface-inset hover:text-fg"
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
          {nextStatus && (
            <DropdownItem
              icon={Pencil}
              onClick={() => onStatusChange(task.id, nextStatus)}
              disabled={isUpdating}
            >
              Mark as {nextStatus.replace("_", " ")}
            </DropdownItem>
          )}
          <DropdownSeparator />
          <DropdownItem
            icon={Trash2}
            onClick={() => onDelete(task.id)}
            variant="destructive"
          >
            Delete task
          </DropdownItem>
        </Dropdown>
      </div>

      {/* Meta row: priority + status */}
      <div className="flex flex-wrap items-center gap-1.5">
        <TaskPriorityBadge priority={task.priority} compact />
        <TaskStatusBadge status={task.status} />
      </div>

      {/* Footer: assignee + due date + blocker */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
        <div className="flex items-center gap-2">
          {task.assigneeName ? (
            <>
              <Avatar name={task.assigneeName} size="xs" tone="neutral" />
              <span className="text-xs text-fg">{task.assigneeName}</span>
            </>
          ) : (
            <span className="text-xs text-fg-subtle">Unassigned</span>
          )}
        </div>
        {task.dueIso ? (
          <span
            className={cn(
              "flex items-center gap-1 text-xs tabular-nums",
              isOverdue ? "font-medium text-danger" : "text-fg-muted",
            )}
          >
            <Calendar width={11} height={11} aria-hidden />
            {dueLabel}
          </span>
        ) : (
          <Badge tone="neutral" variant="outline" className="text-[10px]">
            No date
          </Badge>
        )}
      </div>

      {/* Blocker hint */}
      {task.blocker && (
        <div className="rounded-control border border-danger/25 bg-danger-soft/50 px-2.5 py-1.5 text-[11px] text-danger">
          <span className="font-semibold">Blocked:</span> {task.blocker}
        </div>
      )}
    </div>
  );
}
