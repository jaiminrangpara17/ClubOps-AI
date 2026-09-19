import { CalendarPlus, FileClock, Video } from "lucide-react";
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

const AGENDA_SLOTS = ["Agenda", "Attendees", "Decisions", "Follow-up actions"];

export default function EventMeetingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="Meetings"
        description="Schedule meetings and keep agendas, minutes and follow-ups together."
        actions={
          <Button leadingIcon={CalendarPlus} disabled title="Scheduling ships with the meetings module">
            Schedule meeting
          </Button>
        }
      />

      <PreviewNotice />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming" value="—" hint="Awaiting data" icon={Video} tone="brand" />
        <StatCard label="Minutes pending" value="—" hint="Awaiting data" icon={FileClock} tone="warning" />
        <StatCard label="Open actions" value="—" hint="Awaiting data" icon={FileClock} tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Meeting record structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {AGENDA_SLOTS.map((slot) => (
                <div
                  key={slot}
                  className="rounded-control border border-dashed border-line-strong bg-surface-subtle px-3.5 py-3"
                >
                  <p className="text-xs font-semibold text-fg-muted">{slot}</p>
                  <p className="mt-1 text-xs text-fg-subtle">Captured per meeting</p>
                </div>
              ))}
            </div>
            <EmptyState
              icon={Video}
              title="No meetings scheduled"
              description="Committee and crew meetings for this event will be listed here with their agendas and minutes."
            />
          </CardContent>
        </Card>

        <PlannedCapabilities
          items={[
            "Agenda templates per meeting type",
            "Minutes with decisions and owners",
            "Follow-up actions pushed into Tasks",
            "Attendance history across the committee",
          ]}
        />
      </div>
    </div>
  );
}
