import { useNavigate, useParams } from "react-router-dom";
import { RiskForm } from "@/components/risk";
import { Button, Card, CardContent, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useRisk, useRiskCapabilities, useRiskMembers, useRiskMutations } from "@/hooks/useRisks";
import { useTasks } from "@/hooks/useTasks";
import type { CreateRiskRequest, UpdateRiskRequest } from "@/types";

export default function RiskEditPage() {
  const { eventId = "", riskId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { capabilities, error: capabilitiesError, isLoading: capabilitiesLoading } = useRiskCapabilities(eventId);
  const { risk, error: loadError, isLoading, refetch } = useRisk(eventId, riskId);
  const { members, error: membersError } = useRiskMembers(eventId);
  const { data: tasks } = useTasks(eventId);
  const { update, isSaving, error } = useRiskMutations();
  if (isLoading || capabilitiesLoading) return <Skeleton className="mx-auto h-[38rem] max-w-3xl rounded-card" />;
  if (!capabilities) return <ErrorState title="Risk editing unavailable" description={capabilitiesError ?? "The server has not enabled risk editing."} onRetry={() => navigate(`/events/${eventId}/risks`)} retryLabel="Back to risks" />;
  const canWrite = user?.role === "PRESIDENT" || user?.role === "EVENT_HEAD" || user?.role === "FACULTY";
  if (!canWrite) return <ErrorState title="Risk editing unavailable" description="You do not have permission to edit risks for this event." actions={<Button variant="ghost" onClick={() => navigate(`/events/${eventId}/risks`)}>Back to risks</Button>} />;
  if (!risk || loadError) return <ErrorState title="Unable to load risk" description={loadError ?? "Risk not found."} onRetry={refetch} />;
  const submit = async (request: CreateRiskRequest | UpdateRiskRequest) => {
    try { await update(eventId, riskId, request); navigate(`/events/${eventId}/risks/${riskId}`, { replace: true }); } catch { /* mutation hook owns the safe error */ }
  };
  return <div className="mx-auto max-w-3xl space-y-5">
    <PageHeader size="md" divider={false} title="Edit risk" description={risk.title} />
    {error && <ErrorState variant="inline" title="Unable to save changes" description={error} />}
    <Card><CardContent padding="lg"><RiskForm risk={risk} capabilities={capabilities} members={members} tasks={tasks} membersError={membersError} onSubmit={submit} onCancel={() => navigate(`/events/${eventId}/risks/${riskId}`)} loading={isSaving} /></CardContent></Card>
  </div>;
}