import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, EmptyState } from "@/components/ui";
import { modulePath } from "@/lib/dashboardModules";
import { SEVERITY_LABEL, SEVERITY_TONE } from "@/lib/status";
import { cn } from "@/lib/cn";
import type { DashboardRisk } from "@/types/dashboard";

const SEVERITY_WEIGHT = { high: 0, medium: 1, low: 2 } as const;

/**
 * Active risks — answers "What risks currently exist?".
 * Critical risks are given clearly more visual weight than lower severities.
 */
export function RiskSummary({ eventId, risks }: { eventId: string; risks: DashboardRisk[] }) {
  const sorted = [...risks].sort(
    (a, b) => SEVERITY_WEIGHT[a.severity] - SEVERITY_WEIGHT[b.severity],
  );

  if (sorted.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          title="No active risks"
          description="Risks raised against this event are tracked here with severity and owner."
        />
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {sorted.map((risk) => {
        const critical = risk.severity === "high";
        return (
          <li
            key={risk.id}
            className={cn(
              "group px-5 py-3.5 transition-colors hover:bg-surface-subtle",
              critical && "bg-danger-soft/30",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    critical ? "text-danger" : "text-fg",
                  )}
                >
                  {risk.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-fg-muted">{risk.detail}</p>
              </div>

              <Badge tone={SEVERITY_TONE[risk.severity]} dot>
                {SEVERITY_LABEL[risk.severity]}
              </Badge>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="truncate text-[11px] text-fg-subtle">
                {risk.area} · Owner: {risk.owner}
              </p>
              <Link
                to={modulePath(eventId, "risks")}
                aria-label={`View ${risk.title} in the risk register`}
                className="flex shrink-0 items-center gap-1 rounded-sm text-[11px] font-medium text-brand underline-offset-4 hover:underline"
              >
                View
                <ArrowUpRight width={12} height={12} aria-hidden />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
