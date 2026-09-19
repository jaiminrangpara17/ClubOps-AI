/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the ClubOps API, e.g. "http://localhost:8000/api". */
  readonly VITE_API_BASE_URL?: string;
  /** "api" hits real endpoints, "mock" uses the local development session. */
  /** Legacy alias for VITE_API_MODE, kept so existing setups keep working. */
  readonly VITE_AUTH_MODE?: "api" | "mock";
  /** "api" hits real endpoints, "mock" uses local development data. */
  readonly VITE_API_MODE?: "api" | "mock";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
