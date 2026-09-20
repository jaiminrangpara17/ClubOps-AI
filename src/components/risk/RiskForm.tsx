import { useState } from "react";
import { Button, ErrorState, Input } from "@/components/ui";
import type {
  CreateRiskRequest,
  EventMember,
  Risk,
  RiskCapabilities,
  RiskImpact,
  RiskLikelihood,
  RiskSeverity,
  Task,
  UpdateRiskRequest,
} from "@/types";

const CONTROL =
  "mt-1.5 h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-fg shadow-xs hover:border-line-strong focus:border-brand focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const TITLE_MIN = 3;
const TITLE_MAX = 140;

export function RiskForm({
  risk,
  capabilities,
  members,
  tasks,
  membersError,
  onSubmit,
  onCancel,
  loading,
}: {
  risk?: Risk;
  capabilities: RiskCapabilities;
  members: EventMember[];
  tasks: Task[];
  membersError?: string | null;
  onSubmit: (request: CreateRiskRequest | UpdateRiskRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [title, setTitle] = useState(risk?.title ?? "");
  const [description, setDescription] = useState(risk?.description ?? "");
  const [severity, setSeverity] = useState<RiskSeverity>(risk?.severity ?? "medium");
  const [likelihood, setLikelihood] = useState<RiskLikelihood | "">(risk?.likelihood ?? "");
  const [impact, setImpact] = useState<RiskImpact | "">(risk?.impact ?? "");
  const [ownerMemberId, setOwnerMemberId] = useState(risk?.ownerMemberId ?? "");
  const [strategy, setStrategy] = useState(risk?.mitigation?.strategy ?? "");
  const [mitigationOwnerMemberId, setMitigationOwnerMemberId] = useState(risk?.mitigation?.ownerMemberId ?? "");
  const [mitigationDue, setMitigationDue] = useState(risk?.mitigation?.dueIso?.slice(0, 10) ?? "");
  const [linkedTaskId, setLinkedTaskId] = useState(risk?.mitigation?.taskId ?? risk?.references.taskId ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    const cleanTitle = title.trim();
    if (cleanTitle.length < TITLE_MIN) next.title = `Risk title must be at least ${TITLE_MIN} characters.`;
    if (cleanTitle.length > TITLE_MAX) next.title = `Risk title cannot exceed ${TITLE_MAX} characters.`;
    if (mitigationDue && Number.isNaN(Date.parse(mitigationDue))) next.mitigationDue = "Enter a valid mitigation deadline.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    await onSubmit({
      title: cleanTitle,
      description: description.trim() || null,
      severity,
      likelihood: capabilities.likelihood ? likelihood || null : undefined,
      impact: capabilities.impact ? impact || null : undefined,
      ownerMemberId: ownerMemberId || null,
      mitigationStrategy: capabilities.mitigation ? strategy.trim() || null : undefined,
      mitigationOwnerMemberId: capabilities.mitigation ? mitigationOwnerMemberId || null : undefined,
      mitigationDueIso: capabilities.mitigation && mitigationDue ? new Date(`${mitigationDue}T09:00:00`).toISOString() : null,
      linkedTaskId: capabilities.linkedTask ? linkedTaskId || null : undefined,
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Input label="Risk title" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Registration coverage may be insufficient" error={errors.title} />
      <div>
        <label htmlFor="risk-description" className="block text-xs font-medium text-fg-muted">Description</label>
        <textarea id="risk-description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What could happen, why, and what it would affect." className={`${CONTROL} py-2`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="risk-severity" className="block text-xs font-medium text-fg-muted">Severity <span className="text-danger">*</span></label>
          <select id="risk-severity" value={severity} onChange={(event) => setSeverity(event.target.value as RiskSeverity)} className={CONTROL}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
          </select>
        </div>
        {capabilities.likelihood && <div>
          <label htmlFor="risk-likelihood" className="block text-xs font-medium text-fg-muted">Likelihood</label>
          <select id="risk-likelihood" value={likelihood} onChange={(event) => setLikelihood(event.target.value as RiskLikelihood | "")} className={CONTROL}>
            <option value="">Not assessed</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </div>}
        {capabilities.impact && <div>
          <label htmlFor="risk-impact" className="block text-xs font-medium text-fg-muted">Impact</label>
          <select id="risk-impact" value={impact} onChange={(event) => setImpact(event.target.value as RiskImpact | "")} className={CONTROL}>
            <option value="">Not assessed</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </div>}
      </div>

      <div>
        <label htmlFor="risk-owner" className="block text-xs font-medium text-fg-muted">Risk owner</label>
        <select id="risk-owner" value={ownerMemberId} onChange={(event) => setOwnerMemberId(event.target.value)} className={CONTROL}>
          <option value="">Unassigned</option>
          {members.map((member) => <option key={member.id} value={member.id}>{member.name}{member.role ? ` — ${member.role}` : ""}</option>)}
        </select>
        {membersError && <ErrorState variant="inline" title="Members unavailable" description={membersError} />}
      </div>

      {capabilities.mitigation && <fieldset className="space-y-4 rounded-card border border-line bg-surface-subtle p-4">
        <legend className="px-1 text-xs font-semibold text-fg-muted">Mitigation plan</legend>
        <div>
          <label htmlFor="risk-strategy" className="block text-xs font-medium text-fg-muted">Strategy</label>
          <textarea id="risk-strategy" rows={3} value={strategy} onChange={(event) => setStrategy(event.target.value)} placeholder="What will be done to reduce this risk?" className={`${CONTROL} py-2`} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="risk-mitigation-owner" className="block text-xs font-medium text-fg-muted">Mitigation owner</label>
            <select id="risk-mitigation-owner" value={mitigationOwnerMemberId} onChange={(event) => setMitigationOwnerMemberId(event.target.value)} className={CONTROL}>
              <option value="">Unassigned</option>
              {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          </div>
          <Input label="Mitigation deadline" type="date" value={mitigationDue} onChange={(event) => setMitigationDue(event.target.value)} error={errors.mitigationDue} />
        </div>
      </fieldset>}

      {capabilities.linkedTask && <div>
        <label htmlFor="risk-task" className="block text-xs font-medium text-fg-muted">Linked mitigation task</label>
        <select id="risk-task" value={linkedTaskId} onChange={(event) => setLinkedTaskId(event.target.value)} className={CONTROL}>
          <option value="">No linked task</option>
          {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
        </select>
        <p className="mt-1.5 text-xs text-fg-subtle">Links an existing task; it does not create or assign work automatically.</p>
      </div>}

      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{risk ? "Save changes" : "Add risk"}</Button>
      </div>
    </form>
  );
}