import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui";
import {
  DOCUMENT_KIND_LABEL,
  DOCUMENT_STATUS_LABEL,
  DOCUMENT_STATUS_TONE,
  isDocumentProcessing,
} from "@/lib/document";
import type { DocumentKind, DocumentStatus } from "@/types";

/** Status is always labelled in text, never by colour alone. */
export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <Badge tone={DOCUMENT_STATUS_TONE[status]} variant="outline" className="gap-1.5">
      {isDocumentProcessing(status) && (
        <Loader2 width={11} height={11} aria-hidden className="animate-spin" />
      )}
      {DOCUMENT_STATUS_LABEL[status]}
    </Badge>
  );
}

export function DocumentKindBadge({ kind }: { kind: DocumentKind }) {
  return (
    <Badge tone="neutral" variant="soft">
      {DOCUMENT_KIND_LABEL[kind]}
    </Badge>
  );
}
