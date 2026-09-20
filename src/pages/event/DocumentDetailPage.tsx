import { ArrowLeft, Download, Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import {
  DocumentContentPanel,
  DocumentIntelligencePanel,
  DocumentKindBadge,
  DocumentProcessingPanel,
  DocumentRelationsPanel,
  DocumentStatusBadge,
} from "@/components/document";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useDocument, useDocumentCapabilities, useDocumentMutations } from "@/hooks/useDocuments";
import { formatFileSize } from "@/lib/document";
import { formatDate } from "@/lib/format";
import { isMockApi } from "@/services/apiMode";
import { documentService } from "@/services/documentService";

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-0">
      <dt className="text-xs text-fg-subtle">{label}</dt>
      <dd className="text-right text-sm text-fg">{value}</dd>
    </div>
  );
}

export default function DocumentDetailPage() {
  const { eventId = "", documentId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { capabilities } = useDocumentCapabilities(eventId);
  const {
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
    refetch,
    applyDocument,
  } = useDocument(eventId, documentId);
  const mutations = useDocumentMutations();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const hasWriteRole =
    user?.role === "PRESIDENT" || user?.role === "EVENT_HEAD" || user?.role === "FACULTY";

  if (documentLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-card" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-card" />
          <Skeleton className="h-64 rounded-card lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!document || documentError) {
    return (
      <ErrorState
        title="Unable to load document"
        description={documentError ?? "This document does not belong to the current event."}
        onRetry={refetch}
        actions={
          <Button variant="ghost" onClick={() => navigate(`/events/${eventId}/documents`)}>
            Back to documents
          </Button>
        }
      />
    );
  }

  const canDownload = Boolean(capabilities?.download) && document.hasFile;
  const canPreview = Boolean(capabilities?.preview) && document.hasFile;
  const canDelete = Boolean(capabilities?.delete) && hasWriteRole;
  const canRetry = Boolean(capabilities?.retryProcessing) && hasWriteRole;
  const fileUrl = canDownload || canPreview ? documentService.getFileUrl(eventId, documentId) : "";

  const handleRetry = async () => {
    try {
      const updated = await mutations.retry(eventId, documentId);
      applyDocument(updated);
    } catch {
      // mutations.error carries the user-safe message.
    }
  };

  const handleDelete = async () => {
    try {
      await mutations.remove(eventId, documentId);
      navigate(`/events/${eventId}/documents`, { replace: true });
    } catch {
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        size="md"
        divider={false}
        title={document.name}
        description={document.description ?? undefined}
        meta={
          <>
            <DocumentStatusBadge status={document.status} />
            <DocumentKindBadge kind={document.kind} />
            {document.tags.map((tag) => (
              <Badge key={tag} tone="neutral" variant="outline">
                {tag}
              </Badge>
            ))}
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              leadingIcon={ArrowLeft}
              onClick={() => navigate(`/events/${eventId}/documents`)}
            >
              Back
            </Button>
            {canPreview && (
              <a href={fileUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" leadingIcon={Eye}>
                  Open
                </Button>
              </a>
            )}
            {canDownload && (
              <a href={fileUrl} download>
                <Button leadingIcon={Download}>Download</Button>
              </a>
            )}
          </>
        }
      />

      {isMockApi && <PreviewNotice />}
      {mutations.error && (
        <ErrorState
          variant="inline"
          title="Action failed"
          description={mutations.error}
          onRetry={mutations.clearError}
          retryLabel="Dismiss"
        />
      )}

      {/* 1 — Metadata */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>File details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <MetaRow label="File name" value={document.name} />
              <MetaRow label="Type" value={document.mimeType} />
              <MetaRow label="Size" value={formatFileSize(document.sizeBytes)} />
              <MetaRow label="Uploaded by" value={document.uploadedByName ?? "—"} />
              <MetaRow label="Uploaded" value={formatDate(document.uploadedAt)} />
              <MetaRow label="Updated" value={formatDate(document.updatedAt)} />
            </dl>
            {!canDownload && !canPreview && (
              <p className="mt-3 text-[11px] text-fg-subtle">
                The server does not expose the original file for download or preview.
              </p>
            )}
            {canDelete && (
              <div className="mt-4 border-t border-line pt-3">
                {confirmingDelete ? (
                  <div className="space-y-2">
                    <p className="text-xs text-fg">Delete this document permanently?</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmingDelete(false)}
                        disabled={mutations.isBusy}
                      >
                        Keep
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        leadingIcon={Trash2}
                        onClick={() => void handleDelete()}
                        loading={mutations.isBusy}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    leadingIcon={Trash2}
                    onClick={() => setConfirmingDelete(true)}
                  >
                    Delete document
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2 — Content */}
        <div className="space-y-4 lg:col-span-2">
          <DocumentProcessingPanel
            document={document}
            canRetry={canRetry}
            isRetrying={mutations.isBusy}
            onRetry={() => void handleRetry()}
          />
          <DocumentContentPanel
            document={document}
            content={content}
            isLoading={contentLoading}
            error={contentError}
            onRetry={refetch}
          />
        </div>
      </div>

      {/* 3 — Intelligence and 4 — Operational connections */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <DocumentIntelligencePanel
            document={document}
            intelligence={intelligence}
            isLoading={intelligenceLoading}
            error={intelligenceError}
            supported={Boolean(capabilities?.intelligence)}
            isSample={isMockApi}
            onRetry={refetch}
          />
        </div>
        <div className="lg:col-span-2">
          <DocumentRelationsPanel eventId={eventId} relations={relations} />
        </div>
      </div>
    </div>
  );
}
