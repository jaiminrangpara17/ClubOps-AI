import type { User } from "@/types";

/**
 * Client-side session storage.
 * Persists the access token + cached user so a page reload does not force a
 * re-login. Everything touch-related lives here so swapping to httpOnly
 * cookies later (recommended before production) changes exactly one module.
 */

export interface StoredSession {
  token: string;
  tokenType: "Bearer";
  user: User;
  /** ISO timestamp; sessions past this point are discarded locally. */
  expiresAt: string;
  remember: boolean;
}

const STORAGE_KEY = "clubops.session.v1";

function storageFor(remember: boolean): Storage {
  return remember ? window.localStorage : window.sessionStorage;
}

export function saveSession(session: StoredSession): void {
  // Always write to exactly one storage so a stale "remembered" session cannot
  // shadow a fresh tab session.
  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
  storageFor(session.remember).setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadSession(): StoredSession | null {
  const raw =
    window.localStorage.getItem(STORAGE_KEY) ?? window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.token || !parsed.user || !parsed.expiresAt) return null;
    return parsed;
  } catch {
    // Corrupt payloads are treated as signed out.
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function isSessionExpired(session: StoredSession): boolean {
  return Date.parse(session.expiresAt) <= Date.now();
}
