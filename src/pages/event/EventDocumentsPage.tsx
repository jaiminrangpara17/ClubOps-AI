import { AlertTriangle, CheckCircle2, FileText, Loader2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import {
  DocumentCards,
  DocumentContentSearch,
  DocumentFilters,
  DocumentTable,
  DocumentUpload,
} from "@/components/document";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StatCard,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import {
  useDocumentCapabilities,
  useDocumentContentSearch,
  useDocumentMutations,
  useDocuments,
} from "@/hooks/useDocuments";
import {
  computeDocumentStats,
  EMPTY_DOCUMENT_FILTERS,
  filterDocuments,
  sortDocuments,
} from "@/lib/document";
import { isMockApi } from "@/services/apiMode";
import type { DocumentFilters as DocumentFiltersData } from "@/types";

export default function EventDocumentsPage() {
  const { eventId = "" } = useParams();
  const { user } = useAuth();
  const { capabilities } = useDocumentCapabilities(eventId);
  const { documents, error, isLoading, refetch } = useDocuments(eventId);
  const mutations = useDocumentMutations();
  const contentSearch = useDocumentContentSearch(eventId);

  const [filters, setFilters] = useState<DocumentFiltersData>(EMPTY_DOCUMENT_FILTERS);
  const [uploadOpen, setUploadOpen] = useState(false);

  const sorted = useMemo(() => sortDocuments(documents), [documents]);
  const filtered = useMemo(() => filterDocuments(sorted, filters), [sorted, filters]);
  const stats = useMemo(() => computeDocumentStats(documents), [documents]);
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_DOCUMENT_FILTERS);

  // UX-only gating; the backend remains authoritative and 403s are handled by the API client.
  const hasWriteRole =
    user?.role === "PRESIDENT" || user?.role === "EVENT_HEAD" || user?.role === "FACULTY";
  const canUpload = Boolean(capabilities?.upload) && hasWriteRole;

  const handleUpload = async (file: File) => {
    try {
      await mutations.upload(eventId, file);
      setUploadOpen(false);
      refetch();
    } catch {
      // mutations.error carries the user-safe message and stays visible in the panel.
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="Documents"
        description="Keep event knowledge organized and accessible."
        actions={
          canUpload ? (
            <Button leadingIcon={Upload} onClick={() => setUploadOpen((open) => !open)}>
              Upload document
            </Button>
          ) : undefined
        }
      />

      {isMockApi && (
        <PreviewNotice>
          <span className="font-medium text-fg">Development data.</span> Documents are served by the
          isolated document adapter. There is no OCR, extraction model or search index — processing
          is simulated and extracted text is hand-written sample content.
        </PreviewNotice>
      )}

      {canUpload && uploadOpen && capabilities && (
        <DocumentUpload
          capabilities={capabilities}
          isUploading={mutations.isBusy}
          progress={mutations.uploadProgress}
          serverError={mutations.error}
          onUpload={handleUpload}
          onDismiss={() => {
            mutations.clearError();
            setUploadOpen(false);
          }}
        />
      )}

      {isLoading ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-card" />
            ))}
          </div>
          <Card padding="md" className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 rounded-control" />
            ))}
          </Card>
        </>
      ) : error ? (
        <ErrorState
          title="Unable to load documents"
          description={error}
          onRetry={refetch}
          retryLabel="Retry"
        />
      ) : documents.length === 0 ? (
        <EmptyState
          variant="page"
          icon={FileText}
          title="No documents yet"
          description="Upload permits, contracts and run sheets so the whole team works from the same source."
          actions={
            canUpload ? (
              <Button leadingIcon={Upload} onClick={() => setUploadOpen(true)}>
                Upload document
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Documents" value={stats.total} hint="In this event" icon={FileText} tone="brand" />
            <StatCard label="Processing" value={stats.processing} hint="Queued or running" icon={Loader2} tone="warning" />
            <StatCard label="Ready" value={stats.ready} hint="Processing complete" icon={CheckCircle2} tone="success" />
            <StatCard label="Failed" value={stats.failed} hint="Needs attention" icon={AlertTriangle} tone="danger" />
          </div>

          {capabilities?.contentSearch && (
            <DocumentContentSearch
              eventId={eventId}
              matches={contentSearch.matches}
              query={contentSearch.query}
              error={contentSearch.error}
              isSearching={contentSearch.isSearching}
              onSearch={contentSearch.search}
              onReset={contentSearch.reset}
              isSampleIndex={isMockApi}
            />
          )}

          <Card padding="md">
            <DocumentFilters
              filters={filters}
              onChange={setFilters}
              total={documents.length}
              shown={filtered.length}
            />
          </Card>

          {filtered.length === 0 && hasFilters ? (
            <EmptyState
              icon={FileText}
              title="No documents match these filters"
              description="Try changing or clearing your filters."
              actions={
                <Button variant="outline" onClick={() => setFilters(EMPTY_DOCUMENT_FILTERS)}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <DocumentTable eventId={eventId} documents={filtered} />
              <DocumentCards eventId={eventId} documents={filtered} />
            </>
          )}
        </>
      )}
    </div>
  );
}
