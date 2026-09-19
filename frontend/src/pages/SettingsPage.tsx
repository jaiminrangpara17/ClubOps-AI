import { Moon, Plug, Sun, UserPlus } from "lucide-react";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getUserRoleLabel } from "@/lib/auth";
import { cn } from "@/lib/cn";

const INTEGRATIONS = [
  { id: "calendar", name: "Calendar sync", detail: "Two-way sync for event and meeting dates." },
  { id: "storage", name: "Document storage", detail: "Connect a drive for permits and contracts." },
  { id: "messaging", name: "Messaging", detail: "Deliver announcements to chat channels." },
];

export default function SettingsPage() {
  const { mode, setMode } = useTheme();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Workspace preferences, members and integrations."
        meta={<Badge tone="warning">Preview</Badge>}
      />

      <PreviewNotice>
        <span className="font-medium text-fg">Appearance works today.</span> Organisation, member
        and integration settings are laid out here but are not persisted until the API is connected.
      </PreviewNotice>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organisation profile</CardTitle>
            <CardDescription>Identity used across events and communications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Organisation name" defaultValue="ClubOps Demo Society" />
            <Input label="Primary contact" type="email" defaultValue={user?.email ?? ""} />
            <Input label="Timezone" defaultValue="Europe/Berlin" hint="Used for deadlines and run sheets." />
          </CardContent>
          <CardFooter>
            <Button variant="ghost" disabled>
              Reset
            </Button>
            <Button disabled title="Persisting settings requires the API">
              Save changes
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Applies immediately and is stored in this browser.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                role="radiogroup"
                aria-label="Theme"
                className="inline-flex gap-1 rounded-control border border-line bg-surface-inset p-1"
              >
                {(
                  [
                    { value: "light", label: "Light", icon: Sun },
                    { value: "dark", label: "Dark", icon: Moon },
                  ] as const
                ).map((option) => {
                  const Icon = option.icon;
                  const active = mode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setMode(option.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-[0.4rem] px-3 py-1.5 text-sm font-medium transition-colors",
                        active ? "bg-surface text-fg shadow-xs" : "text-fg-muted hover:text-fg",
                      )}
                    >
                      <Icon width={15} height={15} aria-hidden />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader actions={<Badge tone="neutral">1 member</Badge>}>
              <CardTitle>Members &amp; roles</CardTitle>
              <CardDescription>Invite the committee and assign permissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {user && (
                <div className="flex items-center justify-between gap-3 rounded-control border border-line px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{user.name}</p>
                    <p className="truncate text-xs text-fg-subtle">{user.email}</p>
                  </div>
                  <Badge tone="brand">{getUserRoleLabel(user.role)}</Badge>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                leadingIcon={UserPlus}
                disabled
                title="Member management ships with authentication"
              >
                Invite member
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>External services ClubOps will connect to.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {INTEGRATIONS.map((integration) => (
              <div
                key={integration.id}
                className="flex flex-col gap-2 rounded-control border border-dashed border-line-strong bg-surface-subtle p-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-control bg-surface text-fg-subtle">
                  <Plug width={15} height={15} aria-hidden />
                </span>
                <p className="text-sm font-medium text-fg">{integration.name}</p>
                <p className="text-xs text-fg-muted">{integration.detail}</p>
                <Badge tone="neutral" variant="outline" className="mt-1 self-start">
                  Not connected
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
