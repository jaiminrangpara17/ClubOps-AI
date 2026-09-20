import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Card, CardContent, ErrorState, Progress } from "@/components/ui";
import { formatFileSize, validateUploadFile } from "@/lib/document";
import type { DocumentCapabilities } from "@/types";

/**
 * Inline upload panel.
 *
 * Rendered only when the backend advertises `capabilities.upload`. Client-side
 * validation mirrors the advertised limits; the backend remains authoritative
 * and its 413/415 responses are surfaced verbatim through `serverError`.
 */
export function DocumentUpload({
  capabilities,
  isUploading,
  progress,
  serverError,
  onUpload,
  onDismiss,
}: {
  capabilities: DocumentCapabilities;
  isUploading: boolean;
  progress: number | null;
  serverError: string | null;
  onUpload: (file: File) => Promise<void>;
  onDismiss: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectFile = (next: File | null) => {
    setValidationError(null);
    if (!next) {
      setFile(null);
      return;
    }
    const problem = validateUploadFile(
      next,
      capabilities.acceptedMimeTypes,
      capabilities.maxUploadBytes,
    );
    if (problem) {
      setValidationError(problem);
      setFile(null);
      return;
    }
    setFile(next);
  };

  const submit = async () => {
    if (!file) return;
    await onUpload(file);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-fg">Upload a document</h2>
            <p className="mt-0.5 text-xs text-fg-muted">
              {capabilities.maxUploadBytes !== null
                ? `Up to ${formatFileSize(capabilities.maxUploadBytes)} per file.`
                : "No size limit advertised by the server."}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            leadingIcon={X}
            aria-label="Close upload panel"
            onClick={onDismiss}
            disabled={isUploading}
          />
        </div>

        <div>
          <label htmlFor="document-file" className="block text-xs font-medium text-fg-muted">
            Choose a file
          </label>
          <input
            id="document-file"
            ref={inputRef}
            type="file"
            accept={
              capabilities.acceptedMimeTypes.length > 0
                ? capabilities.acceptedMimeTypes.join(",")
                : undefined
            }
            disabled={isUploading}
            onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            aria-describedby="document-file-hint"
            className="mt-1.5 block w-full cursor-pointer rounded-control border border-line bg-surface text-sm text-fg shadow-xs file:mr-3 file:cursor-pointer file:rounded-l-control file:border-0 file:bg-surface-inset file:px-3 file:py-2 file:text-xs file:font-medium file:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p id="document-file-hint" className="mt-1.5 text-xs text-fg-subtle">
            {capabilities.acceptedMimeTypes.length > 0
              ? "Only file types accepted by the server can be selected."
              : "The server accepts any file type."}
          </p>
        </div>

        {file && !isUploading && (
          <p className="rounded-control border border-line bg-surface-subtle px-3 py-2 text-xs text-fg">
            {file.name} · {formatFileSize(file.size)}
          </p>
        )}

        {validationError && (
          <p role="alert" className="text-xs font-medium text-danger">
            {validationError}
          </p>
        )}

        {serverError && <ErrorState variant="inline" title="Upload failed" description={serverError} />}

        {isUploading && progress !== null && (
          <Progress value={progress} label="Uploading" showValue tone="brand" />
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onDismiss} disabled={isUploading}>
            Cancel
          </Button>
          <Button leadingIcon={Upload} onClick={() => void submit()} loading={isUploading} disabled={!file}>
            Upload
          </Button>
        </div>

        <p className="text-[11px] text-fg-subtle">
          Processing runs after upload. The document appears in the list immediately and updates
          when the server finishes.
        </p>
      </CardContent>
    </Card>
  );
}
