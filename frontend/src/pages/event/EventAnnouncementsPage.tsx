import { AtSign, Bell, Megaphone, MessageSquare, Send } from "lucide-react";
import { PlannedCapabilities } from "@/components/common/PlannedCapabilities";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/ui";
import type { IconComponent } from "@/types";

const CHANNELS: { id: string; name: string; detail: string; icon: IconComponent }[] = [
  { id: "email", name: "Email", detail: "Committee, crew and attendee lists", icon: AtSign },
  { id: "in-app", name: "In-app", detail: "Notifications inside ClubOps", icon: Bell },
  { id: "chat", name: "Chat", detail: "Connected messaging channels", icon: MessageSquare },
];

export default function EventAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="Announcements"
        description="Publish updates to members, volunteers and stakeholders."
        actions={
          <Button leadingIcon={Send} disabled title="Sending ships with the announcements module">
            New announcement
          </Button>
        }
      />

      <PreviewNotice />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Published" value="—" hint="Awaiting data" icon={Megaphone} tone="brand" />
        <StatCard label="Scheduled" value="—" hint="Awaiting data" icon={Send} tone="info" />
        <StatCard label="Drafts" value="—" hint="Awaiting data" icon={Megaphone} tone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Delivery channels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {CHANNELS.map((channel) => {
                const Icon = channel.icon;
                return (
                  <div
                    key={channel.id}
                    className="rounded-control border border-dashed border-line-strong bg-surface-subtle p-3.5"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-control bg-surface text-fg-subtle">
                      <Icon width={15} height={15} aria-hidden />
                    </span>
                    <p className="mt-2 text-sm font-medium text-fg">{channel.name}</p>
                    <p className="mt-0.5 text-xs text-fg-muted">{channel.detail}</p>
                    <Badge tone="neutral" variant="outline" className="mt-2">
                      Inactive
                    </Badge>
                  </div>
                );
              })}
            </div>
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              description="Published and scheduled updates for this event will be listed here with their audience and delivery status."
            />
          </CardContent>
        </Card>

        <PlannedCapabilities
          items={[
            "Audience targeting per role and shift",
            "Scheduled and recurring sends",
            "Reusable announcement templates",
            "Delivery and read reporting",
          ]}
        />
      </div>
    </div>
  );
}
