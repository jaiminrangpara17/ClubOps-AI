/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the ClubOps API, e.g. "http://localhost:8000/api". */
  readonly VITE_API_BASE_URL?: string;
  /** "api" hits real endpoints, "mock" uses the local development session. */
  readonly VITE_AUTH_MODE?: "api" | "mock";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
