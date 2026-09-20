import { ArrowLeft, CalendarDays, Pencil, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import {
  MitigationPanel,
  RiskAssessmentPanel,
  RiskConnectionsPanel,
  RiskSeverityBadge,
  RiskSourceBadge,
  RiskStatusBadge,
  RiskDescriptionPanel,
} from "@/components/risk";
import { Button, Card, CardContent, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useRisk, useRiskCapabilities, useRiskMutations } from "@/hooks/useRisks";
import { RISK_STATUS_LABEL } from "@/lib/risk";
import { isMockApi } from "@/services/apiMode";
import type { RiskStatus } from "@/types";

function Meta({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return <div className="flex items-start gap-2"><Icon width={15} height={15} aria-hidden className="mt-0.5 shrink-0 text-fg-subtle" /><div><p className="text-xs text-fg-subtle">{label}</p><p className="text-sm text-fg">{value}</p></div></div>;
}

export default function RiskDetailPage() {
  const { eventId = "", riskId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { capabilities } = useRiskCapabilities(eventId);
  const {
    risk,
    error,
    isLoading,
    linkedTask,
    linkedMeeting,
    linkedDocument,
    linksLoading,
    linksError,
    refetch,
    applyRisk,
  } = useRisk(eventId, riskId);
  const mutations = useRiskMutations();
  const [transitioningTo, setTransitioningTo] = useState<RiskStatus | null>(null);

  const canWrite = user?.role === "PRESIDENT" || user?.role === "EVENT_HEAD" || user?.role === "FACULTY";

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-28 rounded-card" /><div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-64 rounded-card" /><Skeleton className="h-64 rounded-card lg:col-span-2" /></div></div>;
  if (!risk || error) return <ErrorState title="Unable to load risk" description={error ?? "This risk does not belong to the current event."} onRetry={refetch} actions={<Button variant="ghost" onClick={() => navigate(`/events/${eventId}/risks`)}>Back to risks</Button>} />;

  const transition = async (status: RiskStatus) => {
    setTransitioningTo(status);
    try { applyRisk(await mutations.transition(eventId, riskId, status)); } catch { /* mutation hook owns safe error */ } finally { setTransitioningTo(null); }
  };
  const createMitigationTask = async () => {
    try { const { risk: updated } = await mutations.createMitigationTask(eventId, riskId); applyRisk(updated); } catch { /* mutation hook owns safe error */ }
  };

  return <div className="space-y-5">
    <PageHeader
      size="md"
      divider={false}
      title={risk.title}
      description={risk.sourceLabel ? `Source: ${risk.sourceLabel}` : "Operational risk record"}
      meta={<><RiskStatusBadge status={risk.status} /><RiskSeverityBadge severity={risk.severity} /><RiskSourceBadge source={risk.source} /></>}
      actions={<><Button variant="outline" leadingIcon={ArrowLeft} onClick={() => navigate(`/events/${eventId}/risks`)}>Back</Button>{canWrite && <Button leadingIcon={Pencil} onClick={() => navigate(`/events/${eventId}/risks/${riskId}/edit`)}>Edit risk</Button>}</>}
    />
    {isMockApi && <PreviewNotice><span className="font-medium text-fg">Development data.</span> Risk relationships and status transitions are simulated through the isolated adapter. No AI risk detection is connected.</PreviewNotice>}
    {mutations.error && <ErrorState variant="inline" title="Action failed" description={mutations.error} onRetry={mutations.clearError} retryLabel="Dismiss" />}

    {canWrite && capabilities?.transitions && risk.allowedTransitions.length > 0 && <Card variant="subtle"><CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-fg">Update risk status</p><p className="text-xs text-fg-muted">Allowed transitions are supplied by the backend.</p></div><div className="flex flex-wrap gap-2">{risk.allowedTransitions.map((status) => <Button key={status} size="sm" variant={status === "mitigated" ? "primary" : "outline"} onClick={() => void transition(status)} loading={transitioningTo === status} disabled={transitioningTo !== null && transitioningTo !== status}>{RISK_STATUS_LABEL[status]}</Button>)}</div></CardContent></Card>}

    <div className="grid gap-4 lg:grid-cols-3">
      <Card><CardContent className="space-y-4"><Meta icon={UserRound} label="Risk owner" value={risk.ownerName ?? "Unassigned"} /><Meta icon={CalendarDays} label="Identified" value={new Date(risk.identifiedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} /><div className="border-t border-line pt-3"><p className="text-xs text-fg-subtle">Source</p><div className="mt-1"><RiskSourceBadge source={risk.source} /></div></div></CardContent></Card>
      <div className="space-y-4 lg:col-span-2"><RiskDescriptionPanel risk={risk} /><RiskAssessmentPanel risk={risk} /></div>
    </div>

    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3"><MitigationPanel eventId={eventId} risk={risk} linkedTask={linkedTask} linksLoading={linksLoading} linksError={linksError} canCreateTask={canWrite && Boolean(capabilities?.createMitigationTask)} isCreatingTask={mutations.isSaving} onCreateTask={() => void createMitigationTask()} /></div>
      <div className="lg:col-span-2"><RiskConnectionsPanel eventId={eventId} risk={risk} linkedMeeting={linkedMeeting} linkedDocument={linkedDocument} linksLoading={linksLoading} /></div>
    </div>
  </div>;
}