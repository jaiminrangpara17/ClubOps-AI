import { Search, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { EMPTY_DOCUMENT_FILTERS } from "@/lib/document";
import type { DocumentFilters as DocumentFiltersData, DocumentKind, DocumentStatus } from "@/types";

const SELECT_CLASS =
  "h-9 rounded-control border border-line bg-surface px-3 text-xs text-fg shadow-xs hover:border-line-strong focus:border-brand focus:outline-none";

export function DocumentFilters({
  filters,
  onChange,
  total,
  shown,
}: {
  filters: DocumentFiltersData;
  onChange: (value: DocumentFiltersData) => void;
  total: number;
  shown: number;
}) {
  const active = JSON.stringify(filters) !== JSON.stringify(EMPTY_DOCUMENT_FILTERS);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          size="sm"
          leadingIcon={Search}
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Search by file name…"
          aria-label="Search documents by file name"
          containerClassName="sm:max-w-xs sm:flex-1"
        />
        <select
          aria-label="Filter by file type"
          className={SELECT_CLASS}
          value={filters.kind}
          onChange={(event) => onChange({ ...filters, kind: event.target.value as DocumentKind | "all" })}
        >
          <option value="all">All types</option>
          <option value="pdf">PDF</option>
          <option value="text">Text</option>
          <option value="spreadsheet">Spreadsheet</option>
          <option value="presentation">Presentation</option>
          <option value="image">Image</option>
          <option value="other">Other</option>
        </select>
        <select
          aria-label="Filter by processing status"
          className={SELECT_CLASS}
          value={filters.status}
          onChange={(event) =>
            onChange({ ...filters, status: event.target.value as DocumentStatus | "all" })
          }
        >
          <option value="all">Any status</option>
          <option value="uploaded">Uploaded</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <div className="flex items-center gap-2 text-xs text-fg-muted">
        <span>
          Showing <strong className="text-fg">{shown}</strong> of {total}
        </span>
        {active && (
          <Button
            size="sm"
            variant="ghost"
            leadingIcon={X}
            className="h-7"
            onClick={() => onChange(EMPTY_DOCUMENT_FILTERS)}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
