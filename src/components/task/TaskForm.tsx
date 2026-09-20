/**
 * TaskForm — reusable form for creating/editing tasks.
 *
 * Required fields:
 * - Title (required, trimmed, reasonable length)
 * - Priority (required)
 * - Due date (required if present; must be valid)
 *
 * Optional:
 * - Description
 * - Assignee (from members list)
 * - Status (defaults to todo)
 * - Blocker (if backend supports it)
 */
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { TASK_PRIORITY_DEFINITIONS, TASK_STATUS_DEFINITIONS } from "@/lib/taskStatus";
import type { CreateTaskRequest, EventMember, Task, TaskPriority, TaskStatus, UpdateTaskRequest } from "@/types";

export interface TaskFormProps {
  task?: Task;
  members: EventMember[];
  onSubmit: (data: CreateTaskRequest | UpdateTaskRequest) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  loading?: boolean;
}

const TITLE_MIN = 3;
const TITLE_MAX = 120;

export function TaskForm({
  task,
  members,
  onSubmit,
  onCancel,
  submitLabel = task ? "Save changes" : "Create task",
  loading = false,
}: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [dueDate, setDueDate] = useState(task?.dueIso ? task.dueIso.slice(0, 10) : "");
  const [assigneeId, setAssigneeId] = useState<string>(task?.assigneeId ?? "");
  const [blocker, setBlocker] = useState(task?.blocker ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    const trimmed = title.trim();
    if (!trimmed) {
      next.title = "Task title is required.";
    } else if (trimmed.length < TITLE_MIN) {
      next.title = `Title must be at least ${TITLE_MIN} characters.`;
    } else if (trimmed.length > TITLE_MAX) {
      next.title = `Title cannot exceed ${TITLE_MAX} characters.`;
    }
    if (dueDate && Number.isNaN(Date.parse(dueDate))) {
      next.dueDate = "Invalid date.";
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload: CreateTaskRequest | UpdateTaskRequest = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status,
      dueIso: dueDate ? new Date(dueDate + "T09:00:00").toISOString() : null,
      assigneeId: assigneeId || null,
      blocker: blocker.trim() || null,
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Input
        label="Task title"
        required
        placeholder="e.g. Finalize venue booking"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
      />

      <div>
        <label htmlFor="task-description" className="block text-xs font-medium text-fg-muted">
          Description
        </label>
        <textarea
          id="task-description"
          rows={3}
          placeholder="What needs to happen? Any context?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1.5 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-fg shadow-xs placeholder:text-fg-subtle hover:border-line-strong focus:border-brand focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="task-priority" className="block text-xs font-medium text-fg-muted">
            Priority <span className="text-danger">*</span>
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="mt-1.5 h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-fg shadow-xs hover:border-line-strong focus:border-brand focus:outline-none"
          >
            {TASK_PRIORITY_DEFINITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="task-status" className="block text-xs font-medium text-fg-muted">
            Status
          </label>
          <select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="mt-1.5 h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-fg shadow-xs hover:border-line-strong focus:border-brand focus:outline-none"
          >
            {TASK_STATUS_DEFINITIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          error={errors.dueDate}
        />

        <div>
          <label htmlFor="task-assignee" className="block text-xs font-medium text-fg-muted">
            Assignee
          </label>
          <select
            id="task-assignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="mt-1.5 h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-fg shadow-xs hover:border-line-strong focus:border-brand focus:outline-none"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.role ? ` (${m.role})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label="Blocker / dependency"
        placeholder="e.g. Waiting for faculty approval"
        value={blocker}
        onChange={(e) => setBlocker(e.target.value)}
      />

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-5">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
