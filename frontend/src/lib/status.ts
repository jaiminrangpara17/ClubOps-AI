import type { StatusKind, Tone } from "@/types";

interface StatusDefinition {
  label: string;
  tone: Tone;
}

/**
 * Shared operational status vocabulary. Modules map their own domain states
 * onto these keys so colour meaning stays consistent product-wide.
 */
export const STATUS_DEFINITIONS: Record<StatusKind, StatusDefinition> = {
  draft: { label: "Draft", tone: "neutral" },
  planned: { label: "Planned", tone: "info" },
  active: { label: "Active", tone: "brand" },
  blocked: { label: "Blocked", tone: "danger" },
  "at-risk": { label: "At risk", tone: "warning" },
  complete: { label: "Complete", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export function getStatusDefinition(status: StatusKind): StatusDefinition {
  return STATUS_DEFINITIONS[status];
}
