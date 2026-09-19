import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { useCurrentEvent } from "@/hooks/useCurrentEvent";
import { SEVERITY_LABEL, SEVERITY_TONE } from "@/lib/status";
import type { Severity } from "@/types";

interface OperationalRisk {
  id: string;
  title: string;
  area: string;
  severity: Severity;
  likelihood: "high" | "medium" | "low";
  mitigation: string;
  owner: string;
  status: "open" | "mitigated" | "monitoring";
}

const INITIAL_RISKS: OperationalRisk[] = [
  {
    id: "RSK-01",
    title: "Registration desk understaffed on morning of Day 1",
    area: "Volunteers",
    severity: "high",
    likelihood: "high",
    mitigation: "Reassign 4 floaters from the expo team and call 10 reserve volunteers.",
    owner: "Priya N.",
    status: "open",
  },
  {
    id: "RSK-02",
    title: "Outdoor main stage adverse weather exposure",
    area: "Operations",
    severity: "medium",
    likelihood: "medium",
    mitigation: "Hold secondary covered hall as contingency until day -3 inspection.",
    owner: "Marcus L.",
    status: "monitoring",
  },
  {
    id: "RSK-03",
    title: "Sponsor stage banners delivery delay from printer",
    area: "Partnerships",
    severity: "low",
    likelihood: "low",
    mitigation: "Secondary local campus print supplier on standby with pre-approved specs.",
    owner: "Tomás B.",
    status: "mitigated",
  },
  {
    id: "RSK-04",
    title: "Auditorium WiFi bandwidth throttling under peak concurrency",
    area: "AV & Tech",
    severity: "high",
    likelihood: "medium",
    mitigation: "Engage campus network ops for a dedicated 1Gbps fiber uplink on stage VLAN.",
    owner: "Unassigned",
    status: "open",
  },
];

const SEVERITIES: Severity[] = ["high", "medium", "low"];

export default function EventRisksPage() {
  const event = useCurrentEvent();
  const [risks, setRisks] = useState<OperationalRisk[]>(INITIAL_RISKS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [isNewRiskOpen, setIsNewRiskOpen] = useState(false);

  // New risk form
  const [newTitle, setNewTitle] = useState("");
  const [newArea, setNewArea] = useState("Operations");
  const [newSeverity, setNewSeverity] = useState<Severity>("medium");
  const [newLikelihood, setNewLikelihood] = useState<"high" | "medium" | "low">("medium");
  const [newMitigation, setNewMitigation] = useState("");
  const [newOwner, setNewOwner] = useState("");

  const handleCreateRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newRisk: OperationalRisk = {
      id: `RSK-${String(risks.length + 1).padStart(2, "0")}`,
      title: newTitle.trim(),
      area: newArea,
      severity: newSeverity,
      likelihood: newLikelihood,
      mitigation: newMitigation.trim() || "Mitigation plan under development.",
      owner: newOwner.trim() || "Unassigned",
      status: "open",
    };

    setRisks([newRisk, ...risks]);
    setNewTitle("");
    setNewMitigation("");
    setNewOwner("");
    setIsNewRiskOpen(false);
  };

  const handleToggleMitigated = (id: string) => {
    setRisks((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "mitigated" ? "open" : "mitigated" }
          : r
      )
    );
  };

  const filteredRisks = risks.filter((r) => {
    const matchesQuery =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = selectedSeverity === "all" || r.severity === selectedSeverity;
    return matchesQuery && matchesSeverity;
  });

  const openCount = risks.filter((r) => r.status === "open").length;
  const mitigatedCount = risks.filter((r) => r.status === "mitigated").length;
  const unassignedCount = risks.filter((r) => r.owner === "Unassigned").length;

  const countBySeverity = {
    high: risks.filter((r) => r.severity === "high" && r.status !== "mitigated").length,
    medium: risks.filter((r) => r.severity === "medium" && r.status !== "mitigated").length,
    low: risks.filter((r) => r.severity === "low" && r.status !== "mitigated").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="Risks"
        description={`Track operational risks, severity levels and mitigation progress for ${event.name}.`}
        actions={
          <Button leadingIcon={Plus} onClick={() => setIsNewRiskOpen(true)}>
            Log risk
          </Button>
        }
      />

      {/* Dynamic Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Open risks"
          value={openCount.toString()}
          hint={`${countBySeverity.high} high severity requiring attention`}
          icon={ShieldAlert}
          tone="danger"
        />
        <StatCard
          label="Mitigated"
          value={mitigatedCount.toString()}
          hint="Safeguards active"
          icon={ShieldCheck}
          tone="success"
        />
        <StatCard
          label="Unassigned"
          value={unassignedCount.toString()}
          hint="Awaiting designated lead"
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Risk List */}
        <div className="space-y-4 lg:col-span-2">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <Search width={16} height={16} className="text-fg-subtle shrink-0 ml-1" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search risks by keyword, owner, or area..."
                className="w-full bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-fg-subtle hover:text-fg p-1"
                >
                  <X width={14} height={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-medium text-fg-subtle flex items-center gap-1 shrink-0 mr-1">
                <Filter width={12} height={12} /> Severity:
              </span>
              <button
                onClick={() => setSelectedSeverity("all")}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0 ${
                  selectedSeverity === "all"
                    ? "bg-brand text-white shadow-xs"
                    : "bg-surface-subtle text-fg-muted hover:bg-surface-inset"
                }`}
              >
                All
              </button>
              {SEVERITIES.map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors shrink-0 ${
                    selectedSeverity === sev
                      ? "bg-brand text-white shadow-xs"
                      : "bg-surface-subtle text-fg-muted hover:bg-surface-inset"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Cards */}
          <div className="space-y-3">
            {filteredRisks.map((risk) => {
              const isMitigated = risk.status === "mitigated";
              return (
                <Card
                  key={risk.id}
                  className={`transition-all ${isMitigated ? "opacity-75 bg-surface-subtle/50" : "hover:border-line-strong"}`}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-fg-subtle">
                            {risk.id}
                          </span>
                          <Badge tone={SEVERITY_TONE[risk.severity]} dot size="sm">
                            {SEVERITY_LABEL[risk.severity]}
                          </Badge>
                          <Badge tone="neutral" size="sm">
                            {risk.area}
                          </Badge>
                          {isMitigated ? (
                            <Badge tone="success" size="sm">
                              Mitigated
                            </Badge>
                          ) : (
                            <Badge tone={risk.status === "monitoring" ? "info" : "warning"} size="sm">
                              {risk.status === "monitoring" ? "Monitoring" : "Open"}
                            </Badge>
                          )}
                        </div>

                        <h4 className={`text-sm font-bold text-fg ${isMitigated ? "line-through text-fg-muted" : ""}`}>
                          {risk.title}
                        </h4>
                      </div>

                      <button
                        onClick={() => handleToggleMitigated(risk.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0 ${
                          isMitigated
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            : "bg-surface-subtle text-fg-muted hover:bg-surface-inset border border-line"
                        }`}
                      >
                        {isMitigated ? "Mark Open" : "Mark Mitigated"}
                      </button>
                    </div>

                    {/* Mitigation Plan Box */}
                    <div className="mt-3 rounded-lg border border-line/60 bg-surface-subtle p-3 text-xs">
                      <p className="font-semibold text-fg-muted">Mitigation Strategy:</p>
                      <p className="mt-1 text-fg">{risk.mitigation}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-fg-muted">
                      <span className="flex items-center gap-1.5">
                        <User width={13} height={13} className="text-fg-subtle" />
                        Lead: <strong className="font-semibold text-fg">{risk.owner}</strong>
                      </span>
                      <span>Likelihood: <strong className="capitalize">{risk.likelihood}</strong></span>
                    </div>
                  </div>
                </Card>
              );
            })}

            {filteredRisks.length === 0 && (
              <div className="rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center text-xs text-fg-subtle">
                No risks matched your search or filters.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Severity Summary & Protocols */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Active Severity Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {SEVERITIES.map((severity) => (
                  <div
                    key={severity}
                    className="rounded-xl border border-line bg-surface-subtle p-3 text-center"
                  >
                    <p className="text-[11px] font-semibold text-fg-muted">{SEVERITY_LABEL[severity]}</p>
                    <p className="mt-1 text-xl font-extrabold text-fg tabular-nums">
                      {countBySeverity[severity]}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-line text-xs space-y-2 text-fg-muted">
                <p className="flex items-center gap-2">
                  <Shield width={14} height={14} className="text-brand shrink-0" />
                  <span>All high severity risks require an assigned owner 48 hours prior to launch.</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Incident Escalation</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-fg-muted leading-relaxed">
              <p>For immediate on-site emergencies during event days:</p>
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-rose-800 font-medium space-y-1">
                <p className="font-bold">Campus Security: ext. 5555</p>
                <p>Medical Station: Innovation Hall Room 102</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Log Risk Modal */}
      {isNewRiskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-base font-bold text-fg">Log Operational Risk</h3>
              <button
                onClick={() => setIsNewRiskOpen(false)}
                className="text-fg-subtle hover:text-fg p-1 rounded-lg hover:bg-surface-subtle"
              >
                <X width={18} height={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRisk} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-fg mb-1">Risk Title / Description</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sound system feedback loop during keynote"
                  className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-fg mb-1">Area</label>
                  <select
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Volunteers">Volunteers</option>
                    <option value="AV & Tech">AV & Tech</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Partnerships">Partnerships</option>
                    <option value="Safety">Safety</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-fg mb-1">Owner</label>
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="e.g. Priya N."
                    className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-fg mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as Severity)}
                    className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-fg mb-1">Likelihood</label>
                  <select
                    value={newLikelihood}
                    onChange={(e) => setNewLikelihood(e.target.value as any)}
                    className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-fg mb-1">Mitigation Plan</label>
                <textarea
                  rows={3}
                  value={newMitigation}
                  onChange={(e) => setNewMitigation(e.target.value)}
                  placeholder="Outline preventive controls and contingency actions..."
                  className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line mt-6">
                <Button variant="outline" type="button" onClick={() => setIsNewRiskOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Log Risk</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
