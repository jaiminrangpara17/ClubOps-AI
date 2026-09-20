import { useNavigate, useParams } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import { RiskForm } from "@/components/risk";
import { Button, Card, CardContent, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useRiskCapabilities, useRiskMembers, useRiskMutations } from "@/hooks/useRisks";
import { useTasks } from "@/hooks/useTasks";
import { isMockApi } from "@/services/apiMode";
import type { CreateRiskRequest, UpdateRiskRequest } from "@/types";

export default function RiskCreatePage() {
  const { eventId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { capabilities, error: capabilitiesError, isLoading: capabilitiesLoading } = useRiskCapabilities(eventId);
  const { members, error: membersError } = useRiskMembers(eventId);
  const { data: tasks } = useTasks(eventId);
  const { create, isSaving, error } = useRiskMutations();
  const submit = async (request: CreateRiskRequest | UpdateRiskRequest) => {
    if (!("severity" in request) || !request.title) return;
    try { const risk = await create(eventId, request as CreateRiskRequest); navigate(`/events/${eventId}/risks/${risk.id}`, { replace: true }); } catch { /* mutation hook owns the safe error */ }
  };
  if (capabilitiesLoading) return <Skeleton className="mx-auto h-[38rem] max-w-3xl rounded-card" />;
  if (!capabilities) return <ErrorState title="Risk creation unavailable" description={capabilitiesError ?? "The server has not enabled manual risk creation."} onRetry={() => navigate(`/events/${eventId}/risks`)} retryLabel="Back to risks" />;
  const canWrite = user?.role === "PRESIDENT" || user?.role === "EVENT_HEAD" || user?.role === "FACULTY";
  if (!canWrite || !capabilities.manualCreation) return <ErrorState title="Risk creation unavailable" description="You do not have permission to add risks for this event." actions={<Button variant="ghost" onClick={() => navigate(`/events/${eventId}/risks`)}>Back to risks</Button>} />;
  return <div className="mx-auto max-w-3xl space-y-5">
    <PageHeader size="md" divider={false} title="Add risk" description="Log a risk and assign a clear mitigation plan before it affects the event." />
    {isMockApi && <PreviewNotice />}
    {error && <ErrorState variant="inline" title="Unable to add risk" description={error} />}
    <Card><CardContent padding="lg"><RiskForm capabilities={capabilities} members={members} tasks={tasks} membersError={membersError} onSubmit={submit} onCancel={() => navigate(`/events/${eventId}/risks`)} loading={isSaving} /></CardContent></Card>
  </div>;
}