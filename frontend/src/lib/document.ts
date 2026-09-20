import {
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  Presentation,
} from "lucide-react";
import type {
  DocumentFilters,
  DocumentKind,
  DocumentStats,
  DocumentStatus,
  DocumentSummary,
  IconComponent,
  Tone,
} from "@/types";

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  uploaded: "Uploaded",
  queued: "Queued",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

export const DOCUMENT_STATUS_TONE: Record<DocumentStatus, Tone> = {
  uploaded: "neutral",
  queued: "info",
  processing: "warning",
  ready: "success",
  failed: "danger",
};

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
  pdf: "PDF",
  text: "Text",
  spreadsheet: "Spreadsheet",
  presentation: "Presentation",
  image: "Image",
  other: "Other",
};

export const DOCUMENT_KIND_ICON: Record<DocumentKind, IconComponent> = {
  pdf: FileType,
  text: FileText,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation,
  image: FileImage,
  other: FileText,
};

export const EMPTY_DOCUMENT_FILTERS: DocumentFilters = {
  search: "",
  kind: "all",
  status: "all",
};

/** Statuses where processing is still in flight. */
export function isDocumentProcessing(status: DocumentStatus): boolean {
  return status === "queued" || status === "processing";
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/** Display-only counts derived from already-loaded records. */
export function computeDocumentStats(documents: DocumentSummary[]): DocumentStats {
  return {
    total: documents.length,
    processing: documents.filter((doc) => isDocumentProcessing(doc.status)).length,
    ready: documents.filter((doc) => doc.status === "ready").length,
    failed: documents.filter((doc) => doc.status === "failed").length,
  };
}

/** Metadata-only filtering. This is NOT content search. */
export function filterDocuments(
  documents: DocumentSummary[],
  filters: DocumentFilters,
): DocumentSummary[] {
  const query = filters.search.trim().toLowerCase();
  return documents.filter((doc) => {
    if (query && !doc.name.toLowerCase().includes(query)) return false;
    if (filters.kind !== "all" && doc.kind !== filters.kind) return false;
    if (filters.status !== "all" && doc.status !== filters.status) return false;
    return true;
  });
}

export function sortDocuments(documents: DocumentSummary[]): DocumentSummary[] {
  return [...documents].sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt));
}

/** Client-side pre-checks that mirror backend-advertised limits. */
export function validateUploadFile(
  file: File,
  acceptedMimeTypes: string[],
  maxUploadBytes: number | null,
): string | null {
  if (acceptedMimeTypes.length > 0 && !acceptedMimeTypes.includes(file.type)) {
    return "That file type is not supported.";
  }
  if (maxUploadBytes !== null && file.size > maxUploadBytes) {
    return `That file is larger than the ${formatFileSize(maxUploadBytes)} limit.`;
  }
  if (file.size === 0) return "That file is empty.";
  return null;
}
