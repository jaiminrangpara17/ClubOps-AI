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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const REQUEST_TIMEOUT_MS = 12_000;

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

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
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
  if (response.status >= 500) throw new ApiError("server", "Server error", response.status);
  if (!response.ok) throw new ApiError("unexpected", `Request failed (${response.status})`, response.status);

  if (response.status === 204) return undefined as T;

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("unexpected", "Malformed JSON response", response.status);
  }
}
