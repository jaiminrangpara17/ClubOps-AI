/**
 * Task status and priority badges.
 *
 * Pure presentational components that read from the status/priority
 * definitions. Backend values remain authoritative; these only render.
 */
import { cn } from "@/lib/cn";
import { getTaskPriorityDefinition, getTaskStatusDefinition } from "@/lib/taskStatus";
import type { TaskPriority, TaskStatus } from "@/types";
import { Badge } from "@/components/ui";

export interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const def = getTaskStatusDefinition(status);
  return (
    <Badge tone={def.tone} dot className={className}>
      {def.shortLabel}
    </Badge>
  );
}

export interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  /** Compact variant drops the label for dense tables. */
  compact?: boolean;
  className?: string;
}

export function TaskPriorityBadge({ priority, compact = false, className }: TaskPriorityBadgeProps) {
  const def = getTaskPriorityDefinition(priority);
  return (
    <Badge
      tone={def.tone}
      variant={compact ? "outline" : "soft"}
      className={cn(className)}
    >
      {def.label}
    </Badge>
  );
}
