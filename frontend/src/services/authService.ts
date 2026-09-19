import { apiRequest, ApiError } from "./http";
import type { GetCurrentUserResponse, LoginRequest, LoginResponse, User } from "@/types";

/**
 * Authentication service — the ONLY module that talks to the auth endpoints.
 *
 * Contract (owned by the backend, Member 2):
 *   POST /auth/login   { email, password }          → LoginResponse
 *   POST /auth/logout  (Bearer)                     → 204
 *   GET  /auth/me      (Bearer)                     → GetCurrentUserResponse
 *
 * Selection:  VITE_AUTH_MODE=api  → real HTTP implementation
 *             otherwise           → LOCAL_DEVELOPMENT mock below (delete once
 *                                     the backend is available).
 */
export interface AuthService {
  login(request: LoginRequest): Promise<LoginResponse>;
  logout(token: string): Promise<void>;
  getCurrentUser(token: string): Promise<GetCurrentUserResponse>;
}

/* ------------------------------------------------------------------ */
/* Real API (used when VITE_AUTH_MODE=api)                             */
/* ------------------------------------------------------------------ */

const httpAuthService: AuthService = {
  login(request) {
    return apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email: request.email, password: request.password },
    });
  },

  async logout(token) {
    await apiRequest<void>("/auth/logout", { method: "POST", token });
  },

  getCurrentUser(token) {
    return apiRequest<GetCurrentUserResponse>("/auth/me", { token });
  },
};

/* ------------------------------------------------------------------ */
/* LOCAL_DEVELOPMENT — temporary mock                                  */
/*                                                                     */
/* ⚠️ Exists ONLY until the backend endpoints are available. There is   */
/* no real credential checking here — it enables offline UI work.       */
/* Remove this block and default AUTH_MODE to "api" for staging/prod.   */
/* ------------------------------------------------------------------ */

interface DevAccount extends User {
  password: string;
}

/** Shared development password for every mock account. */
export const DEV_PASSWORD = "clubops2026";

export const DEV_ACCOUNTS: readonly User[] = [
  {
    id: "usr_rahul",
    name: "Rahul Kapoor",
    email: "rahul@clubops.dev",
    role: "EVENT_HEAD",
    organisation: "ClubOps Demo Society",
  },
  {
    id: "usr_aisha",
    name: "Aisha Verma",
    email: "president@clubops.dev",
    role: "PRESIDENT",
    organisation: "ClubOps Demo Society",
  },
  {
    id: "usr_dev",
    name: "Dev Patel",
    email: "volunteer@clubops.dev",
    role: "VOLUNTEER",
    organisation: "ClubOps Demo Society",
  },
  {
    id: "usr_meera",
    name: "Dr. Meera Iyer",
    email: "faculty@clubops.dev",
    role: "FACULTY",
    organisation: "ClubOps Demo Society",
  },
];

const DEV_DB: DevAccount[] = DEV_ACCOUNTS.map((account) => ({
  ...account,
  password: DEV_PASSWORD,
}));

const MOCK_LATENCY_MS = 650;
const SESSION_MS = 8 * 60 * 60 * 1000; // 8h for tab sessions
const REMEMBERED_MS = 7 * 24 * 60 * 60 * 1000; // 7d for remembered sessions

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockAuthService: AuthService = {
  async login(request) {
    await wait(MOCK_LATENCY_MS);
    const account = DEV_DB.find(
      (entry) => entry.email.toLowerCase() === request.email.trim().toLowerCase(),
    );
    if (!account || account.password !== request.password) {
      throw new ApiError("unauthorized", "Invalid credentials", 401);
    }

    const { password: _password, ...user } = account;
    return {
      user,
      accessToken: `dev.${account.id}.${Math.random().toString(36).slice(2, 12)}`,
      tokenType: "Bearer",
      expiresAt: new Date(Date.now() + (request.remember ? REMEMBERED_MS : SESSION_MS)).toISOString(),
    };
  },

  async logout() {
    await wait(120);
  },

  async getCurrentUser(token) {
    const id = token.split(".")[1];
    const account = DEV_DB.find((entry) => entry.id === id);
    if (!account) throw new ApiError("unauthorized", "Session not recognised", 401);
    const { password: _password, ...user } = account;
    return { user };
  },
};

/* ------------------------------------------------------------------ */

export const authService: AuthService =
  import.meta.env.VITE_AUTH_MODE === "api" ? httpAuthService : mockAuthService;

export const isDevAuthMode = import.meta.env.VITE_AUTH_MODE !== "api";

/** Maps any thrown value to a message that is safe to show to end users. */
export function describeAuthError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case "unauthorized":
        return "Email or password is incorrect.";
      case "forbidden":
        return "Your account does not have access yet. Contact your workspace admin.";
      case "network":
        return "Unable to connect to ClubOps. Please check your connection and try again.";
      case "server":
        return "Something went wrong on our side. Please try again in a moment.";
      default:
        return "We received an unexpected response. Please try again.";
    }
  }
  return "Something went wrong while signing in. Please try again.";
}
