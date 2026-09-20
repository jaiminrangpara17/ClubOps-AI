import { Plus, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import { RiskCards, RiskFilters, RiskStats, RiskTable } from "@/components/risk";
import { Button, Card, EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { useRiskCapabilities, useRiskMembers, useRisks } from "@/hooks/useRisks";
import { computeRiskStats, EMPTY_RISK_FILTERS, filterRisks, sortRisks } from "@/lib/risk";
import { isMockApi } from "@/services/apiMode";
import type { RiskFilters as RiskFiltersData } from "@/types";

export default function EventRisksPage() {
  const { eventId = "" } = useParams();
  const navigate = useNavigate();
  const { capabilities } = useRiskCapabilities(eventId);
  const { risks, error, isLoading, refetch } = useRisks(eventId);
  const { members } = useRiskMembers(eventId);
  const [filters, setFilters] = useState<RiskFiltersData>(EMPTY_RISK_FILTERS);

  const sorted = useMemo(() => sortRisks(risks), [risks]);
  const filtered = useMemo(() => filterRisks(sorted, filters), [sorted, filters]);
  const stats = useMemo(() => computeRiskStats(risks), [risks]);
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_RISK_FILTERS);

  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="Risk Management"
        description="Identify, track, and mitigate operational risks before they affect the event."
        actions={capabilities?.manualCreation ? <Button leadingIcon={Plus} onClick={() => navigate(`/events/${eventId}/risks/new`)}>Add risk</Button> : undefined}
      />
      {isMockApi && <PreviewNotice><span className="font-medium text-fg">Development data.</span> Risks use the isolated adapter. No AI risk detector is connected, and no sample risk is labelled as AI-detected.</PreviewNotice>}

      {isLoading ? <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-card" />)}</div>
        <Card padding="md" className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 rounded-control" />)}</Card>
      </> : error ? <ErrorState title="Unable to load risks" description={error} onRetry={refetch} retryLabel="Retry" /> : risks.length === 0 ? (
        <EmptyState variant="page" icon={ShieldAlert} title="No risks logged" description="Capture operational risks early so the team can plan clear mitigation work." actions={capabilities?.manualCreation ? <Button leadingIcon={Plus} onClick={() => navigate(`/events/${eventId}/risks/new`)}>Add risk</Button> : undefined} />
      ) : <>
        <RiskStats stats={stats} />
        <Card padding="md"><RiskFilters filters={filters} members={members} onChange={setFilters} total={risks.length} shown={filtered.length} showLikelihood={Boolean(capabilities?.likelihood)} /></Card>
        {filtered.length === 0 && hasFilters ? <EmptyState icon={ShieldAlert} title="No risks match these filters" description="Try changing or clearing your filters." actions={<Button variant="outline" onClick={() => setFilters(EMPTY_RISK_FILTERS)}>Clear filters</Button>} /> : <><RiskTable eventId={eventId} risks={filtered} /><RiskCards eventId={eventId} risks={filtered} /></>}
      </>}
    </div>
  );
}