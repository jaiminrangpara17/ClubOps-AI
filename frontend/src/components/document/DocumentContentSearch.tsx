import { FileSearch, Search, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, CardContent, EmptyState, ErrorState, Input, Skeleton } from "@/components/ui";
import type { DocumentContentSearchMatch } from "@/types";

/**
 * Search *inside* document text.
 *
 * Rendered only when the backend advertises `capabilities.contentSearch`.
 * This is deliberately separate from the file-name filter above the list so
 * the two are never confused.
 */
export function DocumentContentSearch({
  eventId,
  matches,
  query,
  error,
  isSearching,
  onSearch,
  onReset,
  isSampleIndex,
}: {
  eventId: string;
  matches: DocumentContentSearchMatch[] | null;
  query: string;
  error: string | null;
  isSearching: boolean;
  onSearch: (query: string) => void;
  onReset: () => void;
  isSampleIndex: boolean;
}) {
  const [draft, setDraft] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch(draft);
  };

  const clear = () => {
    setDraft("");
    onReset();
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
            <FileSearch width={15} height={15} aria-hidden className="text-fg-subtle" />
            Search document content
          </h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            Searches the text extracted from documents, not just file names.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
          <Input
            size="sm"
            leadingIcon={Search}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="e.g. cancellation deposit"
            aria-label="Search text inside documents"
            containerClassName="sm:flex-1"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={isSearching} disabled={draft.trim().length === 0}>
              Search
            </Button>
            {matches !== null && (
              <Button type="button" size="sm" variant="ghost" leadingIcon={X} onClick={clear}>
                Clear
              </Button>
            )}
          </div>
        </form>

        {isSampleIndex && (
          <p className="text-[11px] text-fg-subtle">
            Development build: matches come from a plain substring scan over sample text, not a
            search index or embeddings.
          </p>
        )}

        {isSearching ? (
          <div className="space-y-2">
            <Skeleton className="h-16 rounded-control" />
            <Skeleton className="h-16 rounded-control" />
          </div>
        ) : error ? (
          <ErrorState variant="inline" title="Search failed" description={error} />
        ) : matches === null ? null : matches.length === 0 ? (
          <EmptyState
            title="No content matches"
            description={`Nothing in the extracted document text matches “${query}”.`}
          />
        ) : (
          <ul className="space-y-2" aria-live="polite">
            {matches.map((match) => (
              <li
                key={`${match.documentId}-${match.excerpt.slice(0, 24)}`}
                className="rounded-control border border-line bg-surface-subtle p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    to={`/events/${eventId}/documents/${match.documentId}`}
                    className="text-sm font-medium text-fg underline-offset-4 hover:text-brand hover:underline"
                  >
                    {match.documentName}
                  </Link>
                  {match.locator && (
                    <span className="text-[11px] text-fg-subtle">{match.locator}</span>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{match.excerpt}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
