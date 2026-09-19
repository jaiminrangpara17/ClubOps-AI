import { CalendarRange, UserPlus, Users } from "lucide-react";
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
  Progress,
  StatCard,
} from "@/components/ui";

const SHIFT_AREAS = ["Registration", "Stage crew", "Expo floor", "Hospitality"];

export default function EventVolunteersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="Volunteers"
        description="Coordinate volunteer rosters, roles and shift coverage."
        actions={
          <Button leadingIcon={UserPlus} disabled title="Volunteer management ships with this module">
            Add volunteer
          </Button>
        }
      />

      <PreviewNotice />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Registered" value="—" hint="Awaiting data" icon={Users} tone="brand" />
        <StatCard label="Shifts defined" value="—" hint="Awaiting data" icon={CalendarRange} tone="info" />
        <StatCard label="Unfilled shifts" value="—" hint="Awaiting data" icon={CalendarRange} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Shift coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {SHIFT_AREAS.map((area) => (
                <Progress key={area} value={0} label={area} showValue size="sm" tone="neutral" />
              ))}
            </div>
            <EmptyState
              icon={Users}
              title="No volunteers registered"
              description="Once volunteers sign up, coverage per area and shift will be tracked here."
            />
          </CardContent>
        </Card>

        <PlannedCapabilities
          items={[
            "Volunteer profiles with skills and availability",
            "Shift planning with automatic coverage warnings",
            "Self-service sign-up links for volunteers",
            "Check-in tracking during the event",
          ]}
        />
      </div>
    </div>
  );
}
