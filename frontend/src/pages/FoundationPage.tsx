import { ArrowRight, CalendarPlus, Mail, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { STATUS_DEFINITIONS } from "@/lib/status";
import type { StatusKind, Tone } from "@/types";

const TONES: Tone[] = ["neutral", "brand", "success", "warning", "danger", "info"];
const STATUSES = Object.keys(STATUS_DEFINITIONS) as StatusKind[];

const SURFACE_TOKENS = [
  { name: "canvas", className: "bg-canvas" },
  { name: "surface", className: "bg-surface" },
  { name: "surface-subtle", className: "bg-surface-subtle" },
  { name: "surface-inset", className: "bg-surface-inset" },
  { name: "brand", className: "bg-brand" },
  { name: "brand-soft", className: "bg-brand-soft" },
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "danger", className: "bg-danger" },
  { name: "info", className: "bg-info" },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        <p className="text-sm text-fg-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default function FoundationPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const emailError =
    email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Enter a valid email address."
      : undefined;

  const handleSubmit = () => {
    setSubmitting(true);
    setSaved(false);
    window.setTimeout(() => {
      setSubmitting(false);
      setSaved(true);
    }, 900);
  };

  return (
    <div className="space-y-10 pb-8">
      <PageHeader
        eyebrow="Internal"
        title="Design system foundation"
        description="Reference screen for the ClubOps AI visual language. Every module reuses these tokens, components and states — this page is not the product dashboard."
        actions={
          <>
            <Button variant="outline" leadingIcon={Search}>
              Inspect tokens
            </Button>
            <Button leadingIcon={Plus}>Primary action</Button>
          </>
        }
        meta={
          <>
            <Badge tone="brand">Part 01</Badge>
            <Badge tone="neutral" variant="outline">
              v0.1.0
            </Badge>
            <StatusBadge status="active" />
          </>
        }
      />

      <Section
        title="Typography"
        description="Inter with tight tracking on headings. Body copy stays at 14px for dense operations screens."
      >
        <Card padding="lg" className="space-y-4">
          <h1 className="text-2xl font-semibold text-fg">Display / Page title — 24px semibold</h1>
          <h2 className="text-lg font-semibold text-fg">Section heading — 18px semibold</h2>
          <h3 className="text-sm font-semibold text-fg">Card title — 14px semibold</h3>
          <p className="max-w-2xl text-sm text-fg-muted">
            Body text — 14px regular, muted foreground. Used for descriptions, table cells and
            supporting copy throughout the platform.
          </p>
          <p className="text-xs text-fg-subtle">
            Caption / helper text — 12px, subtle foreground for metadata and timestamps.
          </p>
          <p className="font-mono text-xs text-fg-muted">
            Mono — EVT-2026-0148 · used for identifiers and technical detail
          </p>
        </Card>
      </Section>

      <Section
        title="Colour tokens"
        description="Semantic tokens defined once in styles/tokens.css and re-exposed as Tailwind utilities. They adapt automatically to light and dark themes."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {SURFACE_TOKENS.map((token) => (
            <div key={token.name} className="overflow-hidden rounded-card border border-line">
              <div className={`h-14 ${token.className}`} />
              <p className="bg-surface px-3 py-2 font-mono text-[11px] text-fg-muted">
                {token.name}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Buttons"
        description="Six variants, three sizes, icon-only and loading states. Focus rings are consistent product-wide."
      >
        <Card padding="lg" className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger" leadingIcon={Trash2}>
              Delete
            </Button>
            <Button variant="link" trailingIcon={ArrowRight}>
              Learn more
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" leadingIcon={CalendarPlus}>
              Small
            </Button>
            <Button size="md" leadingIcon={CalendarPlus}>
              Medium
            </Button>
            <Button size="lg" leadingIcon={CalendarPlus}>
              Large
            </Button>
            <Button iconOnly leadingIcon={Plus} aria-label="Add item" />
            <Button variant="outline" iconOnly leadingIcon={Search} aria-label="Search" />
            <Button loading>Saving…</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Card>
      </Section>

      <Section
        title="Cards"
        description="Composable card primitives: header, content, footer, plus subtle and ghost surfaces."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader actions={<Badge tone="success">Healthy</Badge>}>
              <CardTitle>Standard card</CardTitle>
              <CardDescription>Header, content and footer composition.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-fg-muted">
                Default surface with a hairline border and extra-small elevation.
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="ghost">
                Dismiss
              </Button>
              <Button size="sm">Confirm</Button>
            </CardFooter>
          </Card>

          <Card variant="raised" padding="lg" interactive>
            <p className="text-xs font-medium tracking-wide text-fg-subtle uppercase">
              Raised / interactive
            </p>
            <p className="mt-3 text-2xl font-semibold text-fg">128</p>
            <p className="mt-1 text-sm text-fg-muted">
              Metric-style card with hover elevation for clickable surfaces.
            </p>
          </Card>

          <Card variant="subtle" padding="lg">
            <p className="text-sm font-semibold text-fg">Subtle card</p>
            <p className="mt-1 text-sm text-fg-muted">
              Lower-emphasis surface for secondary panels and inline groupings.
            </p>
          </Card>
        </div>
      </Section>

      <Section
        title="Badges & statuses"
        description="Tone-based badges plus the shared operational status vocabulary used by every module."
      >
        <Card padding="lg" className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone} variant="solid">
                {tone}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone} variant="outline" dot>
                {tone}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-line pt-5">
            {STATUSES.map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </div>
        </Card>
      </Section>

      <Section
        title="Inputs"
        description="Labels, hints, validation and adornments. Try typing an invalid email to see the error state."
      >
        <Card padding="lg">
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Event name"
              placeholder="Spring Volunteer Gala"
              hint="Shown to volunteers and attendees."
            />
            <Input
              label="Contact email"
              type="email"
              required
              leadingIcon={Mail}
              placeholder="ops@clubops.ai"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={emailError}
            />
            <Input label="Search" size="sm" leadingIcon={Search} placeholder="Filter results…" />
            <Input label="Capacity" size="lg" placeholder="250" trailing="seats" />
            <Input label="Disabled" placeholder="Not editable" disabled />
            <div className="flex items-end gap-3">
              <Button onClick={handleSubmit} loading={submitting} fullWidth>
                {submitting ? "Saving…" : "Save changes"}
              </Button>
              {saved && !submitting && <Badge tone="success">Saved</Badge>}
            </div>
          </div>
        </Card>
      </Section>

      <Section
        title="Feedback states"
        description="Standardised loading, empty and error presentations so every future screen behaves identically."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card variant="subtle" padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-fg">Loading</p>
              <Button size="sm" variant="outline" onClick={() => setShowLoading((v) => !v)}>
                {showLoading ? "Show skeleton" : "Show spinner"}
              </Button>
            </div>
            {showLoading ? (
              <LoadingState title="Loading events…" description="Fetching the latest operations data." />
            ) : (
              <LoadingState variant="skeleton" rows={3} />
            )}
          </Card>

          <Card variant="subtle" padding="md" className="space-y-3">
            <p className="text-sm font-semibold text-fg">Empty</p>
            <EmptyState
              title="No events scheduled"
              description="Once events are created they will appear here with their readiness status."
              actions={<Button size="sm" leadingIcon={Plus}>Create event</Button>}
            />
          </Card>

          <Card variant="subtle" padding="md" className="space-y-3 lg:col-span-2">
            <p className="text-sm font-semibold text-fg">Error</p>
            <ErrorState
              detail="ERR_NETWORK · request timed out after 30s"
              onRetry={() => undefined}
              actions={
                <Button size="sm" variant="ghost">
                  Contact support
                </Button>
              }
            />
            <ErrorState
              variant="inline"
              title="Two volunteer shifts could not be synced"
              description="Retry the sync or review the affected shifts."
              onRetry={() => undefined}
            />
          </Card>
        </div>
      </Section>
    </div>
  );
}
