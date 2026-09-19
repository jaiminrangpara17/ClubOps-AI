import { Plus, ShieldAlert, ShieldCheck } from "lucide-react";
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
import { SEVERITY_LABEL, SEVERITY_TONE } from "@/lib/status";
import type { Severity } from "@/types";

const SEVERITIES: Severity[] = ["high", "medium", "low"];

export default function EventRisksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="Risks"
        description="Track operational risks, their severity and mitigation owners."
        actions={
          <Button leadingIcon={Plus} disabled title="Risk logging ships with the risks module">
            Log risk
          </Button>
        }
      />

      <PreviewNotice />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open risks" value="—" hint="Awaiting data" icon={ShieldAlert} tone="danger" />
        <StatCard label="Mitigated" value="—" hint="Awaiting data" icon={ShieldCheck} tone="success" />
        <StatCard label="Unassigned" value="—" hint="Awaiting data" icon={ShieldAlert} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            actions={
              <div className="flex flex-wrap gap-1.5">
                {SEVERITIES.map((severity) => (
                  <Badge key={severity} tone={SEVERITY_TONE[severity]} dot>
                    {SEVERITY_LABEL[severity]}
                  </Badge>
                ))}
              </div>
            }
          >
            <CardTitle>Risk register</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {SEVERITIES.map((severity) => (
                <div
                  key={severity}
                  className="rounded-control border border-dashed border-line-strong bg-surface-subtle p-3 text-center"
                >
                  <p className="text-xs font-semibold text-fg-muted">{SEVERITY_LABEL[severity]}</p>
                  <p className="mt-1 text-lg font-semibold text-fg-subtle tabular-nums">0</p>
                </div>
              ))}
            </div>
            <EmptyState
              icon={ShieldCheck}
              title="No risks logged"
              description="Risks raised for this event will appear here with severity, likelihood and the owner responsible for mitigation."
            />
          </CardContent>
        </Card>

        <PlannedCapabilities
          items={[
            "Severity and likelihood scoring",
            "Mitigation owners with review dates",
            "Escalation when a risk stays unresolved",
            "Risk summary on the event dashboard",
          ]}
        />
      </div>
    </div>
  );
}
