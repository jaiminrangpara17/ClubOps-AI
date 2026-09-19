import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  ListChecks,
  MoreVertical,
  MoveRight,
  Plus,
  Search,
  SquareCheckBig,
  Tag,
  User,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  Progress,
  StatCard,
} from "@/components/ui";
import { useCurrentEvent } from "@/hooks/useCurrentEvent";

type TaskStatus = "To do" | "In progress" | "Blocked" | "Done";

interface EventTask {
  id: string;
  title: string;
  owner: string;
  status: TaskStatus;
  dueDays: number;
  module: string;
  priority: "high" | "medium" | "low";
}

const INITIAL_TASKS: EventTask[] = [
  {
    id: "TF-101",
    title: "Finalize stage lighting and sound rider",
    owner: "Marcus L.",
    status: "In progress",
    dueDays: 2,
    module: "AV & Tech",
    priority: "high",
  },
  {
    id: "TF-102",
    title: "Obtain electrical safety inspection certificate",
    owner: "Priya N.",
    status: "Blocked",
    dueDays: 1,
    module: "Compliance",
    priority: "high",
  },
  {
    id: "TF-103",
    title: "Distribute volunteer shift schedules to 112 members",
    owner: "Rina K.",
    status: "In progress",
    dueDays: 4,
    module: "Volunteers",
    priority: "medium",
  },
  {
    id: "TF-104",
    title: "Review speaker keynote presentations & format",
    owner: "Tomás B.",
    status: "To do",
    dueDays: 6,
    module: "Programming",
    priority: "medium",
  },
  {
    id: "TF-105",
    title: "Catering allergen manifest confirmation",
    owner: "Rina K.",
    status: "Blocked",
    dueDays: 3,
    module: "Operations",
    priority: "high",
  },
  {
    id: "TF-106",
    title: "Prepare badge printing station & lanyard stock",
    owner: "Priya N.",
    status: "To do",
    dueDays: 5,
    module: "Registration",
    priority: "low",
  },
  {
    id: "TF-107",
    title: "Book standby medic team and first aid station",
    owner: "Marcus L.",
    status: "Done",
    dueDays: -2,
    module: "Safety",
    priority: "high",
  },
  {
    id: "TF-108",
    title: "Publish attendee campus arrival guide",
    owner: "Tomás B.",
    status: "Done",
    dueDays: -1,
    module: "Marketing",
    priority: "medium",
  },
];

const BOARD_COLUMNS: TaskStatus[] = ["To do", "In progress", "Blocked", "Done"];

const STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
  "To do": "In progress",
  "In progress": "Done",
  Blocked: "In progress",
  Done: "To do",
};

export default function EventTasksPage() {
  const event = useCurrentEvent();
  const [tasks, setTasks] = useState<EventTask[]>(INITIAL_TASKS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newModule, setNewModule] = useState("Operations");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newDueDays, setNewDueDays] = useState(3);

  const modules = ["all", ...Array.from(new Set(tasks.map((t) => t.module)))];

  const handleAdvanceStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: STATUS_NEXT[t.status] } : t))
    );
  };

  const handleSetStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: EventTask = {
      id: `TF-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      owner: newOwner.trim() || "Unassigned",
      status: "To do",
      dueDays: Number(newDueDays) || 3,
      module: newModule,
      priority: newPriority,
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTitle("");
    setNewOwner("");
    setIsNewTaskOpen(false);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesQuery =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = selectedModule === "all" || task.module === selectedModule;
    return matchesQuery && matchesModule;
  });

  const openTasksCount = tasks.filter((t) => t.status !== "Done").length;
  const dueThisWeekCount = tasks.filter((t) => t.dueDays >= 0 && t.dueDays <= 7 && t.status !== "Done").length;
  const blockedCount = tasks.filter((t) => t.status === "Blocked").length;
  const doneCount = tasks.filter((t) => t.status === "Done").length;
  const completionPercentage = Math.round((doneCount / tasks.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="Tasks"
        description={`Manage operational work, track blockers and assign roles for ${event.name}.`}
        actions={
          <Button leadingIcon={Plus} onClick={() => setIsNewTaskOpen(true)}>
            New task
          </Button>
        }
      />

      {/* Stats row with live calculated numbers */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Open tasks"
          value={openTasksCount.toString()}
          hint={`${doneCount} completed (${completionPercentage}%)`}
          icon={SquareCheckBig}
          tone="brand"
        />
        <StatCard
          label="Due this week"
          value={dueThisWeekCount.toString()}
          hint="Requires team focus"
          icon={ListChecks}
          tone="warning"
        />
        <StatCard
          label="Blocked"
          value={blockedCount.toString()}
          hint="Requires coordinator action"
          icon={AlertCircle}
          tone="danger"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search width={16} height={16} className="text-fg-subtle shrink-0 ml-1" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, owner, or ID..."
            className="w-full bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-fg-subtle hover:text-fg p-1"
            >
              <X width={14} height={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-medium text-fg-subtle flex items-center gap-1 shrink-0">
            <Filter width={12} height={12} /> Filter:
          </span>
          {modules.map((mod) => (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors shrink-0 ${
                selectedModule === mod
                  ? "bg-brand text-white shadow-xs"
                  : "bg-surface-subtle text-fg-muted hover:bg-surface-inset"
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {BOARD_COLUMNS.map((column) => {
          const colTasks = filteredTasks.filter((t) => t.status === column);
          const toneBadge =
            column === "Blocked"
              ? "danger"
              : column === "Done"
              ? "success"
              : column === "In progress"
              ? "info"
              : "neutral";

          return (
            <div
              key={column}
              className="flex flex-col rounded-2xl border border-line bg-surface-subtle/40 p-3 shadow-xs"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-fg">{column}</span>
                  <Badge tone={toneBadge as any} size="sm">
                    {colTasks.length}
                  </Badge>
                </div>
              </div>

              {/* Task Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-0.5">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group relative flex flex-col justify-between rounded-xl border border-line bg-surface p-3.5 shadow-xs transition-all hover:border-brand/50 hover:shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[11px] font-semibold text-fg-subtle">
                          {task.id}
                        </span>
                        <Badge
                          tone={
                            task.priority === "high"
                              ? "danger"
                              : task.priority === "medium"
                              ? "warning"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {task.priority}
                        </Badge>
                      </div>

                      <h4 className="text-xs font-semibold leading-snug text-fg group-hover:text-brand transition-colors">
                        {task.title}
                      </h4>

                      <div className="flex items-center gap-2 text-[11px] text-fg-muted">
                        <Tag width={11} height={11} className="text-fg-subtle" />
                        <span>{task.module}</span>
                      </div>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between border-t border-line/60 pt-2.5 text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-fg-muted text-[11px]">
                        <User width={12} height={12} className="text-fg-subtle" />
                        {task.owner}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAdvanceStatus(task.id)}
                          title={`Advance to ${STATUS_NEXT[task.status]}`}
                          className="flex items-center gap-1 rounded-md bg-surface-subtle px-2 py-1 text-[11px] font-medium text-fg-muted hover:bg-brand-soft hover:text-brand transition-colors"
                        >
                          <span>Move</span>
                          <MoveRight width={11} height={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong/60 py-8 text-center text-xs text-fg-subtle">
                    <span>No tasks in {column.toLowerCase()}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-base font-bold text-fg">Create Operational Task</h3>
              <button
                onClick={() => setIsNewTaskOpen(false)}
                className="text-fg-subtle hover:text-fg p-1 rounded-lg hover:bg-surface-subtle"
              >
                <X width={18} height={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-fg mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Inspect emergency exits & signage"
                  className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-fg mb-1">Owner</label>
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="e.g. Marcus L."
                    className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-fg mb-1">Module</label>
                  <select
                    value={newModule}
                    onChange={(e) => setNewModule(e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                  >
                    <option value="AV & Tech">AV & Tech</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Volunteers">Volunteers</option>
                    <option value="Operations">Operations</option>
                    <option value="Programming">Programming</option>
                    <option value="Registration">Registration</option>
                    <option value="Safety">Safety</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-fg mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-fg mb-1">Due in (Days)</label>
                  <input
                    type="number"
                    value={newDueDays}
                    onChange={(e) => setNewDueDays(Number(e.target.value))}
                    min={0}
                    max={60}
                    className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line mt-6">
                <Button variant="outline" type="button" onClick={() => setIsNewTaskOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Task</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
