import { Search, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { EMPTY_RISK_FILTERS } from "@/lib/risk";
import type {
  EventMember,
  RiskFilters as RiskFiltersData,
  RiskLikelihood,
  RiskSeverity,
  RiskSource,
  RiskStatus,
} from "@/types";

const SELECT_CLASS =
  "h-9 rounded-control border border-line bg-surface px-3 text-xs text-fg shadow-xs hover:border-line-strong focus:border-brand focus:outline-none";

export function RiskFilters({
  filters,
  members,
  onChange,
  total,
  shown,
  showLikelihood,
}: {
  filters: RiskFiltersData;
  members: EventMember[];
  onChange: (filters: RiskFiltersData) => void;
  total: number;
  shown: number;
  showLikelihood: boolean;
}) {
  const active = JSON.stringify(filters) !== JSON.stringify(EMPTY_RISK_FILTERS);
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          size="sm"
          leadingIcon={Search}
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Search risks…"
          aria-label="Search risks"
          containerClassName="sm:max-w-xs sm:flex-1"
        />
        <select aria-label="Filter by status" className={SELECT_CLASS} value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value as RiskStatus | "all" })}>
          <option value="all">All statuses</option><option value="open">Open</option><option value="monitoring">Monitoring</option><option value="mitigated">Mitigated</option><option value="closed">Closed</option>
        </select>
        <select aria-label="Filter by severity" className={SELECT_CLASS} value={filters.severity} onChange={(event) => onChange({ ...filters, severity: event.target.value as RiskSeverity | "all" })}>
          <option value="all">All severities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
        {showLikelihood && (
          <select aria-label="Filter by likelihood" className={SELECT_CLASS} value={filters.likelihood} onChange={(event) => onChange({ ...filters, likelihood: event.target.value as RiskLikelihood | "all" })}>
            <option value="all">Any likelihood</option><option value="high">High likelihood</option><option value="medium">Medium likelihood</option><option value="low">Low likelihood</option>
          </select>
        )}
        <select aria-label="Filter by owner" className={SELECT_CLASS} value={filters.ownerMemberId} onChange={(event) => onChange({ ...filters, ownerMemberId: event.target.value })}>
          <option value="all">All owners</option>
          <option value="unassigned">Unassigned</option>
          {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
        </select>
        <select aria-label="Filter by source" className={SELECT_CLASS} value={filters.source} onChange={(event) => onChange({ ...filters, source: event.target.value as RiskSource | "all" })}>
          <option value="all">All sources</option><option value="manual">Manual</option><option value="task">Task</option><option value="meeting">Meeting</option><option value="document">Document</option><option value="ai_detected">AI detected</option>
        </select>
      </div>
      <div className="flex items-center gap-2 text-xs text-fg-muted">
        <span>Showing <strong className="text-fg">{shown}</strong> of {total}</span>
        {active && <Button size="sm" variant="ghost" className="h-7" leadingIcon={X} onClick={() => onChange(EMPTY_RISK_FILTERS)}>Clear filters</Button>}
      </div>
    </div>
  );
}