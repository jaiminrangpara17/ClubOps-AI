import { loadSession } from "./session";

/**
 * Minimal fetch client shared by all ClubOps services.
 * Centralises the base URL, JSON handling, auth headers, timeouts and error
 * mapping so feature services never call fetch directly.
 */

export type ApiErrorKind =
  | "network"
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "conflict"
  | "rate-limited"
  | "payload-too-large"
  | "unsupported-media"
  | "validation"
  | "server"
  | "unexpected";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

/** Broadcast when any request is rejected with 401 so the app can re-authenticate. */
export const UNAUTHORIZED_EVENT = "clubops:unauthorized";

/**
 * Maps any thrown value to a message that is safe to show to end users.
 * Never surfaces stack traces, URLs or internal API details.
 */
export function describeApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case "unauthorized":
        return "Your session has expired. Please sign in again.";
      case "forbidden":
        return "You do not have permission to view this data.";
      case "not-found":
        return "This data is not available.";
      case "conflict":
        return "This action conflicts with the current state. Refresh and try again.";
      case "rate-limited":
        return "This service is temporarily rate limited. Please try again shortly.";
      case "payload-too-large":
        return "That file is larger than the maximum allowed size.";
      case "unsupported-media":
        return "That file type is not supported.";
      case "validation":
        return "Some of the submitted values were rejected. Please review and try again.";
      case "network":
        return "Unable to connect to ClubOps. Please check your connection and try again.";
      case "server":
        return "Something went wrong on our side. Please try again in a moment.";
      default:
        return "We received an unexpected response. Please try again.";
    }
  }
  return fallback;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const REQUEST_TIMEOUT_MS = 12_000;

/**
 * Resolves the Bearer token for a request.
 * Every authenticated endpoint gets the session token automatically; an
 * explicit `token` option (used by authService during login/bootstrap)
 * overrides it. Reading through session.ts keeps token storage in one module.
 */
function resolveToken(explicit?: string): string | undefined {
  if (explicit) return explicit;
  try {
    return loadSession()?.token;
  } catch {
    return undefined;
  }
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Bearer token; omitted for unauthenticated calls. */
  token?: string;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  if (options.signal) {
    if (options.signal.aborted) controller.abort(options.signal.reason);
    else options.signal.addEventListener("abort", () => controller.abort(options.signal?.reason));
  }
  const timeout = window.setTimeout(() => controller.abort("timeout"), REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const bearer = resolveToken(options.token);
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: "same-origin",
      signal: controller.signal,
    });
  } catch (cause) {
    throw new ApiError(
      "network",
      cause instanceof DOMException && cause.name === "AbortError"
        ? "Request aborted"
        : "Network request failed",
    );
  } finally {
    window.clearTimeout(timeout);
  }

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    throw new ApiError("unauthorized", "Unauthorised", 401);
  }
  if (response.status === 403) throw new ApiError("forbidden", "Forbidden", 403);
  if (response.status === 404) throw new ApiError("not-found", "Not found", 404);
  if (response.status === 409) throw new ApiError("conflict", "Conflict", 409);
  if (response.status === 429) throw new ApiError("rate-limited", "Rate limited", 429);
  if (response.status === 413) throw new ApiError("payload-too-large", "Payload too large", 413);
  if (response.status === 415) throw new ApiError("unsupported-media", "Unsupported media type", 415);
  if (response.status === 400 || response.status === 422) {
    throw new ApiError("validation", "Validation failed", response.status);
  }
  if (response.status >= 500) throw new ApiError("server", "Server error", response.status);
  if (!response.ok) throw new ApiError("unexpected", `Request failed (${response.status})`, response.status);

  if (response.status === 204) return undefined as T;

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("unexpected", "Malformed JSON response", response.status);
  }
}

/** Maps an HTTP status to the shared ApiError taxonomy. */
function errorForStatus(status: number): ApiError {
  if (status === 401) {
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    return new ApiError("unauthorized", "Unauthorised", 401);
  }
  if (status === 403) return new ApiError("forbidden", "Forbidden", 403);
  if (status === 404) return new ApiError("not-found", "Not found", 404);
  if (status === 409) return new ApiError("conflict", "Conflict", 409);
  if (status === 429) return new ApiError("rate-limited", "Rate limited", 429);
  if (status === 413) return new ApiError("payload-too-large", "Payload too large", 413);
  if (status === 415) return new ApiError("unsupported-media", "Unsupported media type", 415);
  if (status === 400 || status === 422) return new ApiError("validation", "Validation failed", status);
  if (status >= 500) return new ApiError("server", "Server error", status);
  return new ApiError("unexpected", `Request failed (${status})`, status);
}

export interface ApiUploadOptions {
  token?: string;
  /** Reports 0–100 while the request body is being sent. */
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

/**
 * Multipart upload helper.
 *
 * Uses XMLHttpRequest because `fetch` cannot report upload progress. The
 * Content-Type header is deliberately left unset so the browser can add the
 * multipart boundary.
 */
export function apiUpload<T>(
  path: string,
  formData: FormData,
  options: ApiUploadOptions = {},
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}${path}`);
    xhr.setRequestHeader("Accept", "application/json");
    const token = resolveToken(options.token);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    if (options.onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          options.onProgress?.(Math.round((event.loaded / event.total) * 100));
        }
      });
    }

    const abort = () => xhr.abort();
    options.signal?.addEventListener("abort", abort);

    const cleanup = () => options.signal?.removeEventListener("abort", abort);

    xhr.addEventListener("load", () => {
      cleanup();
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(errorForStatus(xhr.status));
        return;
      }
      if (xhr.status === 204 || !xhr.responseText) {
        resolve(undefined as T);
        return;
      }
      try {
        resolve(JSON.parse(xhr.responseText) as T);
      } catch {
        reject(new ApiError("unexpected", "Malformed JSON response", xhr.status));
      }
    });

    xhr.addEventListener("error", () => {
      cleanup();
      reject(new ApiError("network", "Network request failed"));
    });
    xhr.addEventListener("abort", () => {
      cleanup();
      reject(new ApiError("network", "Upload cancelled"));
    });

    xhr.send(formData);
  });
}
