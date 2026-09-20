import { Link, useNavigate } from "react-router-dom";
import { DOCUMENT_KIND_ICON, DOCUMENT_KIND_LABEL, formatFileSize } from "@/lib/document";
import { formatDate } from "@/lib/format";
import type { DocumentSummary } from "@/types";
import { DocumentStatusBadge } from "./DocumentBadges";

export function DocumentTable({
  eventId,
  documents,
}: {
  eventId: string;
  documents: DocumentSummary[];
}) {
  return (
    <div className="hidden overflow-x-auto rounded-card border border-line bg-surface md:block">
      <table className="w-full min-w-[760px]">
        <thead className="border-b border-line bg-surface-subtle">
          <tr>
            {["Document", "Type", "Size", "Uploaded by", "Uploaded", "Status"].map((label) => (
              <th
                key={label}
                scope="col"
                className="px-4 py-2.5 text-left text-xs font-semibold text-fg-muted"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {documents.map((doc) => {
            const Icon = DOCUMENT_KIND_ICON[doc.kind];
            return (
              <tr key={doc.id} className="transition-colors hover:bg-surface-subtle">
                <td className="max-w-[320px] px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <Icon width={16} height={16} aria-hidden className="mt-0.5 shrink-0 text-fg-subtle" />
                    <div className="min-w-0">
                      <Link
                        to={`/events/${eventId}/documents/${doc.id}`}
                        className="block truncate text-sm font-medium text-fg underline-offset-4 hover:text-brand hover:underline"
                      >
                        {doc.name}
                      </Link>
                      {doc.tags.length > 0 && (
                        <p className="mt-0.5 truncate text-xs text-fg-subtle">
                          {doc.tags.join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-fg-muted">{DOCUMENT_KIND_LABEL[doc.kind]}</td>
                <td className="px-4 py-3 text-xs text-fg-muted tabular-nums">
                  {formatFileSize(doc.sizeBytes)}
                </td>
                <td className="px-4 py-3 text-xs text-fg">{doc.uploadedByName ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-fg-muted">{formatDate(doc.uploadedAt)}</td>
                <td className="px-4 py-3">
                  <DocumentStatusBadge status={doc.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DocumentCards({
  eventId,
  documents,
}: {
  eventId: string;
  documents: DocumentSummary[];
}) {
  const navigate = useNavigate();
  return (
    <div className="grid gap-3 md:hidden">
      {documents.map((doc) => {
        const Icon = DOCUMENT_KIND_ICON[doc.kind];
        return (
          <article key={doc.id} className="rounded-card border border-line bg-surface p-4 shadow-xs">
            <button
              type="button"
              className="flex w-full items-start gap-3 text-left"
              onClick={() => navigate(`/events/${eventId}/documents/${doc.id}`)}
            >
              <Icon width={18} height={18} aria-hidden className="mt-0.5 shrink-0 text-fg-subtle" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-fg">{doc.name}</h3>
                <p className="mt-0.5 text-xs text-fg-muted">
                  {DOCUMENT_KIND_LABEL[doc.kind]} · {formatFileSize(doc.sizeBytes)}
                </p>
              </div>
            </button>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
              <span className="text-xs text-fg-subtle">
                {doc.uploadedByName ? `${doc.uploadedByName} · ` : ""}
                {formatDate(doc.uploadedAt)}
              </span>
              <DocumentStatusBadge status={doc.status} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
