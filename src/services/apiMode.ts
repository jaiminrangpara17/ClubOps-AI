/**
 * Single switch that decides whether services talk to the real backend or to
 * local development mocks. Set `VITE_API_MODE=api` (or the legacy
 * `VITE_AUTH_MODE=api`) once the endpoints are deployed.
 */
const mode = import.meta.env.VITE_API_MODE ?? import.meta.env.VITE_AUTH_MODE ?? "mock";

export const API_MODE: "api" | "mock" = mode === "api" ? "api" : "mock";

export const isMockApi = API_MODE !== "api";
