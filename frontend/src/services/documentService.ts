import { isMockApi } from "./apiMode";
import { ApiError, apiRequest, apiUpload } from "./http";
import {
  getInitialDocuments,
  MOCK_CONTENT,
  MOCK_INTELLIGENCE,
  MOCK_RELATIONS,
} from "@/data/mockDocuments";
import type {
  ClubDocument,
  DocumentCapabilities,
  DocumentContent,
  DocumentContentSearchResponse,
  DocumentIntelligence,
  DocumentKind,
  DocumentRelations,
  DocumentsListResponse,
} from "@/types";

/**
 * Document service — the ONLY module that talks to document endpoints.
 *
 * Proposed contract (no backend implementation exists yet):
 *   GET    /events/:eventId/documents/capabilities              → DocumentCapabilities
 *   GET    /events/:eventId/documents                           → DocumentsListResponse
 *   GET    /events/:eventId/documents/:documentId               → ClubDocument
 *   POST   /events/:eventId/documents            (multipart)    → ClubDocument
 *   DELETE /events/:eventId/documents/:documentId               → 204
 *   GET    /events/:eventId/documents/:documentId/content       → DocumentContent (404 → null)
 *   GET    /events/:eventId/documents/:documentId/intelligence  → DocumentIntelligence (404 → null)
 *   GET    /events/:eventId/documents/:documentId/relations     → DocumentRelations
 *   POST   /events/:eventId/documents/:documentId/retry         → ClubDocument
 *   GET    /events/:eventId/documents/search?q=                 → DocumentContentSearchResponse
 *   GET    /events/:eventId/documents/:documentId/file          → binary (browser-navigated)
 *
 * Every optional operation is gated on `getCapabilities()` so the UI never
 * offers upload, download, preview, delete, retry, content search or
 * intelligence unless the backend advertises support.
 */
export interface DocumentService {
  getCapabilities(eventId: string): Promise<DocumentCapabilities>;
  listDocuments(eventId: string): Promise<DocumentsListResponse>;
  getDocument(eventId: string, documentId: string): Promise<ClubDocument>;
  uploadDocument(
    eventId: string,
    file: File,
    options?: { onProgress?: (percent: number) => void; signal?: AbortSignal },
  ): Promise<ClubDocument>;
  deleteDocument(eventId: string, documentId: string): Promise<void>;
  getDocumentContent(eventId: string, documentId: string): Promise<DocumentContent | null>;
  getDocumentIntelligence(
    eventId: string,
    documentId: string,
  ): Promise<DocumentIntelligence | null>;
  getDocumentRelations(eventId: string, documentId: string): Promise<DocumentRelations>;
  retryProcessing(eventId: string, documentId: string): Promise<ClubDocument>;
  searchDocumentContent(eventId: string, query: string): Promise<DocumentContentSearchResponse>;
  /** Absolute URL the browser can navigate to for download/preview. */
  getFileUrl(eventId: string, documentId: string): string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

const httpDocumentService: DocumentService = {
  getCapabilities(eventId) {
    return apiRequest<DocumentCapabilities>(`/events/${eventId}/documents/capabilities`);
  },
  listDocuments(eventId) {
    return apiRequest<DocumentsListResponse>(`/events/${eventId}/documents`);
  },
  getDocument(eventId, documentId) {
    return apiRequest<ClubDocument>(`/events/${eventId}/documents/${documentId}`);
  },
  uploadDocument(eventId, file, options) {
    const formData = new FormData();
    formData.append("file", file);
    return apiUpload<ClubDocument>(`/events/${eventId}/documents`, formData, {
      onProgress: options?.onProgress,
      signal: options?.signal,
    });
  },
  async deleteDocument(eventId, documentId) {
    await apiRequest<void>(`/events/${eventId}/documents/${documentId}`, { method: "DELETE" });
  },
  async getDocumentContent(eventId, documentId) {
    try {
      return await apiRequest<DocumentContent>(
        `/events/${eventId}/documents/${documentId}/content`,
      );
    } catch (error) {
      if (error instanceof ApiError && error.kind === "not-found") return null;
      throw error;
    }
  },
  async getDocumentIntelligence(eventId, documentId) {
    try {
      return await apiRequest<DocumentIntelligence>(
        `/events/${eventId}/documents/${documentId}/intelligence`,
      );
    } catch (error) {
      if (error instanceof ApiError && error.kind === "not-found") return null;
      throw error;
    }
  },
  getDocumentRelations(eventId, documentId) {
    return apiRequest<DocumentRelations>(`/events/${eventId}/documents/${documentId}/relations`);
  },
  retryProcessing(eventId, documentId) {
    return apiRequest<ClubDocument>(`/events/${eventId}/documents/${documentId}/retry`, {
      method: "POST",
    });
  },
  searchDocumentContent(eventId, query) {
    return apiRequest<DocumentContentSearchResponse>(
      `/events/${eventId}/documents/search?q=${encodeURIComponent(query)}`,
    );
  },
  getFileUrl(eventId, documentId) {
    return `${API_BASE_URL}/events/${eventId}/documents/${documentId}/file`;
  },
};

/* ------------------------------------------------------------------ */
/* LOCAL_DEVELOPMENT — temporary mock                                  */
/*                                                                     */
/* ⚠️ Simulates the contract above in memory. There is no OCR, no       */
/* extraction model, no embeddings and no search index. "Processing"    */
/* is a timer and content search is a substring scan over hand-written  */
/* sample text. Delete when the backend ships.                          */
/* ------------------------------------------------------------------ */

const LATENCY_MS = 300;
const SIMULATED_PROCESSING_MS = 4_000;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const DOCUMENT_STORE = new Map<string, ClubDocument[]>();
const CONTENT_STORE = new Map<string, DocumentContent>(Object.entries(MOCK_CONTENT));
const INTELLIGENCE_STORE = new Map<string, DocumentIntelligence>(
  Object.entries(structuredClone(MOCK_INTELLIGENCE)),
);

const MOCK_CAPABILITIES: DocumentCapabilities = {
  upload: true,
  // The mock stores no real bytes, so file-backed operations stay disabled.
  download: false,
  preview: false,
  delete: true,
  contentSearch: true,
  intelligence: true,
  retryProcessing: true,
  acceptedMimeTypes: [
    "application/pdf",
    "text/plain",
    "text/csv",
    "image/png",
    "image/jpeg",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  maxUploadBytes: 10 * 1024 * 1024,
};

function documentsFor(eventId: string): ClubDocument[] {
  let list = DOCUMENT_STORE.get(eventId);
  if (!list) {
    list = getInitialDocuments(eventId);
    DOCUMENT_STORE.set(eventId, list);
  }
  return list;
}

/** Event scoping is enforced here: an id from another event is a 404. */
function findScoped(eventId: string, documentId: string): ClubDocument {
  const doc = documentsFor(eventId).find((entry) => entry.id === documentId);
  if (!doc) throw new ApiError("not-found", "Document not found", 404);
  return doc;
}

function kindForMime(mimeType: string, name: string): DocumentKind {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("text/")) return "text";
  if (mimeType.includes("spreadsheet") || name.endsWith(".csv")) return "spreadsheet";
  if (mimeType.includes("presentation")) return "presentation";
  if (mimeType.includes("word")) return "text";
  return "other";
}

const mockDocumentService: DocumentService = {
  async getCapabilities() {
    await wait(120);
    return { ...MOCK_CAPABILITIES };
  },

  async listDocuments(eventId) {
    await wait(LATENCY_MS);
    const documents = documentsFor(eventId);
    return { documents: structuredClone(documents), totalCount: documents.length };
  },

  async getDocument(eventId, documentId) {
    await wait(LATENCY_MS);
    return structuredClone(findScoped(eventId, documentId));
  },

  async uploadDocument(eventId, file, options) {
    // Mirror the advertised limits so the mock rejects like the real API.
    if (
      MOCK_CAPABILITIES.acceptedMimeTypes.length > 0 &&
      !MOCK_CAPABILITIES.acceptedMimeTypes.includes(file.type)
    ) {
      throw new ApiError("unsupported-media", "Unsupported media type", 415);
    }
    if (MOCK_CAPABILITIES.maxUploadBytes !== null && file.size > MOCK_CAPABILITIES.maxUploadBytes) {
      throw new ApiError("payload-too-large", "Payload too large", 413);
    }

    for (let percent = 20; percent <= 100; percent += 20) {
      await wait(120);
      options?.onProgress?.(percent);
    }

    const timestamp = new Date().toISOString();
    const doc: ClubDocument = {
      id: `doc_${Date.now().toString(36)}`,
      eventId,
      name: file.name,
      kind: kindForMime(file.type, file.name),
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      status: "queued",
      uploadedByName: null,
      uploadedAt: timestamp,
      updatedAt: timestamp,
      tags: [],
      processingError: null,
      hasFile: false,
      hasExtractedContent: false,
      description: null,
    };
    documentsFor(eventId).unshift(doc);

    // Simulated async pipeline: queued → processing → ready (no content produced).
    window.setTimeout(() => {
      const current = documentsFor(eventId).find((entry) => entry.id === doc.id);
      if (!current) return;
      current.status = "processing";
      current.updatedAt = new Date().toISOString();
      window.setTimeout(() => {
        const settled = documentsFor(eventId).find((entry) => entry.id === doc.id);
        if (!settled) return;
        settled.status = "ready";
        settled.updatedAt = new Date().toISOString();
      }, SIMULATED_PROCESSING_MS);
    }, 800);

    return structuredClone(doc);
  },

  async deleteDocument(eventId, documentId) {
    await wait(LATENCY_MS);
    const list = documentsFor(eventId);
    const index = list.findIndex((entry) => entry.id === documentId);
    if (index === -1) throw new ApiError("not-found", "Document not found", 404);
    list.splice(index, 1);
    CONTENT_STORE.delete(documentId);
    INTELLIGENCE_STORE.delete(documentId);
  },

  async getDocumentContent(eventId, documentId) {
    await wait(LATENCY_MS);
    const doc = findScoped(eventId, documentId);
    if (!doc.hasExtractedContent) return null;
    const content = CONTENT_STORE.get(documentId);
    return content ? structuredClone(content) : null;
  },

  async getDocumentIntelligence(eventId, documentId) {
    await wait(LATENCY_MS);
    const doc = findScoped(eventId, documentId);
    if (doc.status !== "ready") return null;
    const intelligence = INTELLIGENCE_STORE.get(documentId);
    return intelligence ? structuredClone(intelligence) : null;
  },

  async getDocumentRelations(eventId, documentId) {
    await wait(LATENCY_MS);
    findScoped(eventId, documentId);
    return structuredClone(MOCK_RELATIONS[documentId] ?? { relatedTaskIds: [], relatedMeetingIds: [] });
  },

  async retryProcessing(eventId, documentId) {
    await wait(LATENCY_MS);
    const doc = findScoped(eventId, documentId);
    doc.status = "processing";
    doc.processingError = null;
    doc.updatedAt = new Date().toISOString();
    window.setTimeout(() => {
      const current = documentsFor(eventId).find((entry) => entry.id === documentId);
      if (!current || current.status !== "processing") return;
      current.status = "failed";
      current.processingError = "Text extraction produced no readable content.";
      current.updatedAt = new Date().toISOString();
    }, SIMULATED_PROCESSING_MS);
    return structuredClone(doc);
  },

  async searchDocumentContent(eventId, query) {
    await wait(LATENCY_MS);
    const needle = query.trim().toLowerCase();
    if (!needle) return { matches: [], query };

    const matches = documentsFor(eventId).flatMap((doc) => {
      const content = CONTENT_STORE.get(doc.id);
      if (!content) return [];
      const haystack = content.text.toLowerCase();
      const index = haystack.indexOf(needle);
      if (index === -1) return [];
      const start = Math.max(0, index - 60);
      const end = Math.min(content.text.length, index + needle.length + 90);
      return [
        {
          documentId: doc.id,
          documentName: doc.name,
          excerpt: `${start > 0 ? "…" : ""}${content.text.slice(start, end).trim()}${
            end < content.text.length ? "…" : ""
          }`,
          locator: content.pageCount ? `Page 1 of ${content.pageCount}` : null,
        },
      ];
    });

    return { matches, query };
  },

  getFileUrl() {
    // The mock stores no bytes; `download`/`preview` capabilities are false.
    return "";
  },
};

export const documentService: DocumentService = isMockApi
  ? mockDocumentService
  : httpDocumentService;
