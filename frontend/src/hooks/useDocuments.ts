import { useCallback, useEffect, useRef, useState } from "react";
import { documentService } from "@/services/documentService";
import { describeApiError } from "@/services/http";
import { isDocumentProcessing } from "@/lib/document";
import type {
  ClubDocument,
  DocumentCapabilities,
  DocumentContent,
  DocumentContentSearchMatch,
  DocumentIntelligence,
  DocumentRelations,
  DocumentSummary,
} from "@/types";

const POLL_INTERVAL_MS = 3_000;

/** Backend-advertised capabilities. Everything optional in the UI is gated on this. */
export function useDocumentCapabilities(eventId: string) {
  const [capabilities, setCapabilities] = useState<DocumentCapabilities | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    documentService
      .getCapabilities(eventId)
      .then((result) => {
        if (!active) return;
        setCapabilities(result);
        setIsLoading(false);
      })
      .catch(() => {
        // Capability probe failure degrades to "nothing optional is available".
        if (!active) return;
        setCapabilities(null);
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  return { capabilities, isLoading };
}

export function useDocuments(eventId: string) {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    documentService
      .listDocuments(eventId)
      .then((response) => {
        if (!active) return;
        setDocuments(response.documents);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeApiError(cause, "Unable to load documents."));
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId, nonce]);

  const refetch = useCallback(() => setNonce((value) => value + 1), []);

  // Poll only while something is still processing.
  const hasPending = documents.some((doc) => isDocumentProcessing(doc.status));
  useEffect(() => {
    if (!hasPending) return;
    const timer = window.setInterval(() => {
      documentService
        .listDocuments(eventId)
        .then((response) => setDocuments(response.documents))
        .catch(() => {
          /* transient poll failure — next tick retries */
        });
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [eventId, hasPending]);

  return { documents, error, isLoading, refetch };
}

/**
 * Document workspace data. The record, extracted content, intelligence and
 * relations load independently so one failing section never blanks the page.
 */
export function useDocument(eventId: string, documentId: string) {
  const [document, setDocument] = useState<ClubDocument | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [documentLoading, setDocumentLoading] = useState(true);

  const [content, setContent] = useState<DocumentContent | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  const [intelligence, setIntelligence] = useState<DocumentIntelligence | null>(null);
  const [intelligenceError, setIntelligenceError] = useState<string | null>(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);

  const [relations, setRelations] = useState<DocumentRelations | null>(null);

  const [nonce, setNonce] = useState(0);
  const pollRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    setDocumentLoading(true);
    setDocumentError(null);
    documentService
      .getDocument(eventId, documentId)
      .then((result) => {
        if (!active) return;
        setDocument(result);
        setDocumentLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setDocumentError(describeApiError(cause, "Unable to load this document."));
        setDocumentLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId, documentId, nonce]);

  // Content is only requested when the backend says it exists.
  const hasExtractedContent = document?.hasExtractedContent ?? false;
  useEffect(() => {
    if (!hasExtractedContent) {
      setContent(null);
      return;
    }
    let active = true;
    setContentLoading(true);
    setContentError(null);
    documentService
      .getDocumentContent(eventId, documentId)
      .then((result) => {
        if (!active) return;
        setContent(result);
        setContentLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setContentError(describeApiError(cause, "Unable to load extracted content."));
        setContentLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId, documentId, hasExtractedContent, nonce]);

  // Intelligence is only requested once processing has completed.
  const isReady = document?.status === "ready";
  useEffect(() => {
    if (!isReady) {
      setIntelligence(null);
      return;
    }
    let active = true;
    setIntelligenceLoading(true);
    setIntelligenceError(null);
    Promise.all([
      documentService.getDocumentIntelligence(eventId, documentId),
      documentService.getDocumentRelations(eventId, documentId),
    ])
      .then(([intelligenceResult, relationsResult]) => {
        if (!active) return;
        setIntelligence(intelligenceResult);
        setRelations(relationsResult);
        setIntelligenceLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setIntelligenceError(describeApiError(cause, "Unable to load document intelligence."));
        setIntelligenceLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId, documentId, isReady, nonce]);

  // Poll while the backend reports the document as still processing.
  const status = document?.status ?? null;
  useEffect(() => {
    if (!status || !isDocumentProcessing(status)) return;
    pollRef.current = documentId;
    const timer = window.setInterval(() => {
      documentService
        .getDocument(eventId, documentId)
        .then((result) => {
          if (pollRef.current !== documentId) return;
          setDocument(result);
        })
        .catch(() => {
          /* transient poll failure — next tick retries */
        });
    }, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
      pollRef.current = null;
    };
  }, [eventId, documentId, status]);

  return {
    document,
    documentError,
    documentLoading,
    content,
    contentError,
    contentLoading,
    intelligence,
    intelligenceError,
    intelligenceLoading,
    relations,
    refetch: () => setNonce((value) => value + 1),
    applyDocument: (next: ClubDocument) => setDocument(next),
  };
}

/** Content search runs only when the user explicitly submits a query. */
export function useDocumentContentSearch(eventId: string) {
  const [matches, setMatches] = useState<DocumentContentSearchMatch[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(
    async (nextQuery: string) => {
      const trimmed = nextQuery.trim();
      setQuery(trimmed);
      if (!trimmed) {
        setMatches(null);
        setError(null);
        return;
      }
      setIsSearching(true);
      setError(null);
      try {
        const response = await documentService.searchDocumentContent(eventId, trimmed);
        setMatches(response.matches);
      } catch (cause: unknown) {
        setError(describeApiError(cause, "Unable to search document content."));
        setMatches(null);
      } finally {
        setIsSearching(false);
      }
    },
    [eventId],
  );

  const reset = useCallback(() => {
    setMatches(null);
    setQuery("");
    setError(null);
  }, []);

  return { matches, query, error, isSearching, search, reset };
}

export function useDocumentMutations() {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const run = useCallback(async <T,>(work: () => Promise<T>, fallback: string): Promise<T> => {
    setIsBusy(true);
    setError(null);
    try {
      return await work();
    } catch (cause: unknown) {
      setError(describeApiError(cause, fallback));
      throw cause;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const upload = useCallback(
    async (eventId: string, file: File) => {
      setUploadProgress(0);
      try {
        return await run(
          () =>
            documentService.uploadDocument(eventId, file, {
              onProgress: setUploadProgress,
            }),
          "Unable to upload this document.",
        );
      } finally {
        setUploadProgress(null);
      }
    },
    [run],
  );

  return {
    isBusy,
    error,
    uploadProgress,
    clearError: () => setError(null),
    upload,
    remove: (eventId: string, documentId: string) =>
      run(() => documentService.deleteDocument(eventId, documentId), "Unable to delete this document."),
    retry: (eventId: string, documentId: string) =>
      run(() => documentService.retryProcessing(eventId, documentId), "Unable to retry processing."),
  };
}
