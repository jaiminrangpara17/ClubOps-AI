import { Badge } from "@/components/ui";
import {
  RISK_SEVERITY_LABEL,
  RISK_SEVERITY_TONE,
  RISK_SOURCE_LABEL,
  RISK_SOURCE_TONE,
  RISK_STATUS_LABEL,
  RISK_STATUS_TONE,
} from "@/lib/risk";
import type { RiskSeverity, RiskSource, RiskStatus } from "@/types";

export function RiskStatusBadge({ status }: { status: RiskStatus }) {
  return <Badge tone={RISK_STATUS_TONE[status]} dot>{RISK_STATUS_LABEL[status]}</Badge>;
}

/** Severity always includes the text label — never colour alone. */
export function RiskSeverityBadge({ severity }: { severity: RiskSeverity }) {
  return <Badge tone={RISK_SEVERITY_TONE[severity]}>{RISK_SEVERITY_LABEL[severity]}</Badge>;
}

export function RiskSourceBadge({ source }: { source: RiskSource }) {
  return <Badge tone={RISK_SOURCE_TONE[source]} variant="outline">{RISK_SOURCE_LABEL[source]}</Badge>;
}