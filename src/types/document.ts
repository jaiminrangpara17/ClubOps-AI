/**
 * Document domain types.
 *
 * No backend document contract exists yet. These types describe the contract
 * the frontend is prepared to consume; sync with the API team when it ships.
 *
 * Capability flags (`DocumentCapabilities`) let the backend advertise which
 * operations it actually supports, so the UI never offers upload, preview,
 * download, content search, retry or intelligence unless they are real.
 */

export type DocumentStatus = "uploaded" | "queued" | "processing" | "ready" | "failed";

/** Coarse file classification used for icons and filtering. */
export type DocumentKind = "pdf" | "text" | "spreadsheet" | "presentation" | "image" | "other";

export interface DocumentSummary {
  id: string;
  eventId: string;
  name: string;
  kind: DocumentKind;
  /** IANA media type reported by the backend. */
  mimeType: string;
  /** Bytes; null when the backend does not expose size. */
  sizeBytes: number | null;
  status: DocumentStatus;
  uploadedByName: string | null;
  uploadedAt: string;
  updatedAt: string;
  /** Free-form categories supplied by the backend; never inferred client-side. */
  tags: string[];
}

export interface ClubDocument extends DocumentSummary {
  /** Reason surfaced by the backend when status is `failed`. */
  processingError: string | null;
  /** True when the backend can serve the original file. */
  hasFile: boolean;
  /** True when extracted text exists for this document. */
  hasExtractedContent: boolean;
  description: string | null;
}

/** Extracted plain text. Never HTML — rendered as text only. */
export interface DocumentContent {
  documentId: string;
  text: string;
  /** Page count when the backend can determine it. */
  pageCount: number | null;
  extractedAt: string;
}

/** Structured extraction output produced by the backend, not the frontend. */
export interface DocumentIntelligence {
  documentId: string;
  summary: string | null;
  keyPoints: string[];
  /** Dates the backend recognised inside the document. */
  importantDates: { label: string; iso: string }[];
  generatedAt: string | null;
}

/** Operational links the backend explicitly stores — never guessed from names. */
export interface DocumentRelations {
  relatedTaskIds: string[];
  relatedMeetingIds: string[];
}

export interface DocumentContentSearchMatch {
  documentId: string;
  documentName: string;
  /** Snippet supplied by the backend search index. */
  excerpt: string;
  /** Page/section locator when the backend provides one. */
  locator: string | null;
}

export interface DocumentsListResponse {
  documents: DocumentSummary[];
  totalCount: number;
}

export interface DocumentContentSearchResponse {
  matches: DocumentContentSearchMatch[];
  query: string;
}

/**
 * Backend-advertised capabilities. Every optional feature in the UI is gated
 * on one of these flags so nothing is faked.
 */
export interface DocumentCapabilities {
  upload: boolean;
  download: boolean;
  preview: boolean;
  delete: boolean;
  contentSearch: boolean;
  intelligence: boolean;
  retryProcessing: boolean;
  /** Accepted MIME types for upload; empty means the backend accepts anything. */
  acceptedMimeTypes: string[];
  /** Maximum upload size in bytes; null means no advertised limit. */
  maxUploadBytes: number | null;
}

export interface DocumentFilters {
  search: string;
  kind: DocumentKind | "all";
  status: DocumentStatus | "all";
}

export interface DocumentStats {
  total: number;
  processing: number;
  ready: number;
  failed: number;
}
