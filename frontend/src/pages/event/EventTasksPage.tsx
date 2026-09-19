import { ListChecks, Plus, SquareCheckBig } from "lucide-react";
import { PlannedCapabilities } from "@/components/common/PlannedCapabilities";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/ui";

const BOARD_COLUMNS = ["To do", "In progress", "Blocked", "Done"];

export default function EventTasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="Tasks"
        description="Manage responsibilities, deadlines and task progress."
        actions={
          <Button leadingIcon={Plus} disabled title="Task creation ships with the tasks module">
            New task
          </Button>
        }
      />

      <PreviewNotice />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open tasks" value="—" hint="Awaiting data" icon={SquareCheckBig} tone="brand" />
        <StatCard label="Due this week" value="—" hint="Awaiting data" icon={ListChecks} tone="warning" />
        <StatCard label="Blocked" value="—" hint="Awaiting data" icon={ListChecks} tone="danger" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Task board</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {BOARD_COLUMNS.map((column) => (
                <div
                  key={column}
                  className="rounded-control border border-dashed border-line-strong bg-surface-subtle p-3"
                >
                  <p className="text-xs font-semibold text-fg-muted">{column}</p>
                  <p className="mt-1 text-lg font-semibold text-fg-subtle tabular-nums">0</p>
                </div>
              ))}
            </div>
            <EmptyState
              title="No tasks yet"
              description="Tasks created for this event will appear here grouped by status, owner and due date."
            />
          </CardContent>
        </Card>

        <PlannedCapabilities
          items={[
            "Create tasks with owners, due dates and dependencies",
            "Kanban board and list views with filters",
            "Automatic escalation of overdue and blocked work",
            "Links from tasks to meetings, documents and risks",
          ]}
        />
      </div>
    </div>
  );
}
