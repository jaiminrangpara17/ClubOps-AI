import { CalendarDays, ShieldAlert, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/format";
import type { Risk } from "@/types";
import { RiskSeverityBadge, RiskSourceBadge, RiskStatusBadge } from "./RiskBadges";

function Assessment({ risk }: { risk: Risk }) {
  if (!risk.likelihood && !risk.impact) return <span className="text-xs text-fg-subtle">—</span>;
  return (
    <span className="text-xs text-fg-muted">
      {risk.likelihood ? `L: ${risk.likelihood}` : ""}
      {risk.likelihood && risk.impact ? " · " : ""}
      {risk.impact ? `I: ${risk.impact}` : ""}
    </span>
  );
}

export function RiskTable({ eventId, risks }: { eventId: string; risks: Risk[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-card border border-line bg-surface md:block">
      <table className="w-full min-w-[850px]">
        <thead className="border-b border-line bg-surface-subtle">
          <tr>
            {["Risk", "Severity", "Assessment", "Status", "Owner", "Source", "Updated"].map((label) => (
              <th key={label} scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-fg-muted">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {risks.map((risk) => (
            <tr key={risk.id} className={risk.severity === "critical" ? "bg-danger-soft/30 hover:bg-danger-soft/50" : "transition-colors hover:bg-surface-subtle"}>
              <td className="max-w-[300px] px-4 py-3">
                <Link to={`/events/${eventId}/risks/${risk.id}`} className="block truncate text-sm font-medium text-fg underline-offset-4 hover:text-brand hover:underline">
                  {risk.title}
                </Link>
                {risk.description && <p className="mt-0.5 line-clamp-1 text-xs text-fg-subtle">{risk.description}</p>}
              </td>
              <td className="px-4 py-3"><RiskSeverityBadge severity={risk.severity} /></td>
              <td className="px-4 py-3"><Assessment risk={risk} /></td>
              <td className="px-4 py-3"><RiskStatusBadge status={risk.status} /></td>
              <td className="px-4 py-3 text-xs text-fg">{risk.ownerName ?? "Unassigned"}</td>
              <td className="px-4 py-3"><RiskSourceBadge source={risk.source} /></td>
              <td className="px-4 py-3 text-xs text-fg-muted">{formatDate(risk.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RiskCards({ eventId, risks }: { eventId: string; risks: Risk[] }) {
  const navigate = useNavigate();
  return (
    <div className="grid gap-3 md:hidden">
      {risks.map((risk) => (
        <article key={risk.id} className={risk.severity === "critical" ? "rounded-card border border-danger/35 bg-danger-soft/30 p-4" : "rounded-card border border-line bg-surface p-4 shadow-xs"}>
          <button type="button" className="block w-full text-left" onClick={() => navigate(`/events/${eventId}/risks/${risk.id}`)}>
            <div className="flex items-start gap-2">
              <ShieldAlert width={17} height={17} aria-hidden className={risk.severity === "critical" ? "mt-0.5 shrink-0 text-danger" : "mt-0.5 shrink-0 text-fg-subtle"} />
              <div className="min-w-0"><h3 className="text-sm font-semibold text-fg">{risk.title}</h3>{risk.description && <p className="mt-1 line-clamp-2 text-xs text-fg-muted">{risk.description}</p>}</div>
            </div>
          </button>
          <div className="mt-3 flex flex-wrap gap-1.5"><RiskSeverityBadge severity={risk.severity} /><RiskStatusBadge status={risk.status} /><RiskSourceBadge source={risk.source} /></div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-xs text-fg-muted">
            <span className="flex items-center gap-1"><UserRound width={11} height={11} aria-hidden />{risk.ownerName ?? "Unassigned"}</span>
            <span className="flex items-center gap-1"><CalendarDays width={11} height={11} aria-hidden />{formatDate(risk.updatedAt)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}