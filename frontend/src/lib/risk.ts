import type {
  Risk,
  RiskFilters,
  RiskImpact,
  RiskLikelihood,
  RiskSeverity,
  RiskSource,
  RiskStats,
  RiskStatus,
  Tone,
} from "@/types";

export const RISK_STATUS_LABEL: Record<RiskStatus, string> = {
  open: "Open",
  monitoring: "Monitoring",
  mitigated: "Mitigated",
  closed: "Closed",
};

export const RISK_STATUS_TONE: Record<RiskStatus, Tone> = {
  open: "danger",
  monitoring: "warning",
  mitigated: "success",
  closed: "neutral",
};

export const RISK_SEVERITY_LABEL: Record<RiskSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const RISK_SEVERITY_TONE: Record<RiskSeverity, Tone> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

export const RISK_LIKELIHOOD_LABEL: Record<RiskLikelihood, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const RISK_IMPACT_LABEL: Record<RiskImpact, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const RISK_SOURCE_LABEL: Record<RiskSource, string> = {
  manual: "Manual",
  task: "Task",
  meeting: "Meeting",
  document: "Document",
  ai_detected: "AI detected",
};

export const RISK_SOURCE_TONE: Record<RiskSource, Tone> = {
  manual: "neutral",
  task: "brand",
  meeting: "info",
  document: "warning",
  ai_detected: "brand",
};

export const EMPTY_RISK_FILTERS: RiskFilters = {
  search: "",
  status: "all",
  severity: "all",
  likelihood: "all",
  ownerMemberId: "all",
  source: "all",
};

/** Safe, display-only counts derived from already-loaded records. */
export function computeRiskStats(risks: Risk[]): RiskStats {
  return {
    total: risks.length,
    critical: risks.filter((risk) => risk.severity === "critical").length,
    high: risks.filter((risk) => risk.severity === "high").length,
    open: risks.filter((risk) => risk.status === "open" || risk.status === "monitoring").length,
    mitigated: risks.filter((risk) => risk.status === "mitigated").length,
  };
}

export function filterRisks(risks: Risk[], filters: RiskFilters): Risk[] {
  const query = filters.search.trim().toLowerCase();
  return risks.filter((risk) => {
    if (query && !`${risk.title} ${risk.description ?? ""}`.toLowerCase().includes(query)) return false;
    if (filters.status !== "all" && risk.status !== filters.status) return false;
    if (filters.severity !== "all" && risk.severity !== filters.severity) return false;
    if (filters.likelihood !== "all" && risk.likelihood !== filters.likelihood) return false;
    if (filters.ownerMemberId === "unassigned" && risk.ownerMemberId !== null) return false;
    if (
      filters.ownerMemberId !== "all" &&
      filters.ownerMemberId !== "unassigned" &&
      risk.ownerMemberId !== filters.ownerMemberId
    ) return false;
    if (filters.source !== "all" && risk.source !== filters.source) return false;
    return true;
  });
}

const SEVERITY_WEIGHT: Record<RiskSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/** Operational default: severity first, then recent changes. */
export function sortRisks(risks: Risk[]): Risk[] {
  return [...risks].sort((a, b) => {
    const severity = SEVERITY_WEIGHT[a.severity] - SEVERITY_WEIGHT[b.severity];
    if (severity !== 0) return severity;
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}