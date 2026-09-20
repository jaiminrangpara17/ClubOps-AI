import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { authService } from "@/services/authService";
import { UNAUTHORIZED_EVENT, ApiError } from "@/services/http";
import {
  clearSession,
  isSessionExpired,
  loadSession,
  saveSession,
} from "@/services/session";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/auth";
import type { LoginRequest, User } from "@/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  /** True for the initial session check; never flashes the app shell. */
  isBootstrapping: boolean;
  /** True while a login request is in flight. */
  isSubmitting: boolean;
  /** Message shown on the login screen (e.g. "session expired"). */
  notice: string | null;
  login(request: LoginRequest): Promise<void>;
  logout(): Promise<void>;
  clearNotice: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface SessionState {
  user: User;
  token: string;
}

/**
 * Authentication state for the whole app.
 * A stored session is trusted immediately (so refreshes don't flash a login
 * screen) and validated in the background against GET /auth/me.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Boot decision is synchronous (session lives in web storage), so the app
  // never needs to flash protected content or a loading screen on refresh.
  const [initialState] = useState(() => {
    const stored = loadSession();
    if (!stored) return { session: null as SessionState | null, notice: null as string | null };
    if (isSessionExpired(stored)) {
      clearSession();
      return { session: null as SessionState | null, notice: SESSION_EXPIRED_MESSAGE };
    }
    return {
      session: { user: stored.user, token: stored.token } satisfies SessionState,
      notice: null as string | null,
    };
  });

  const [session, setSession] = useState<SessionState | null>(initialState.session);
  const [status, setStatus] = useState<AuthStatus>(
    initialState.session ? "authenticated" : "unauthenticated",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(initialState.notice);

  const signOutLocally = useCallback((message: string | null) => {
    clearSession();
    setSession(null);
    setStatus("unauthenticated");
    setNotice(message);
  }, []);

  // Background validation of the stored (or just-created) session.
  const token = session?.token ?? null;
  useEffect(() => {
    if (!token) return;

    authService
      .getCurrentUser(token)
      .then(({ user }) => setSession((current) => (current ? { ...current, user } : current)))
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.kind === "unauthorized") {
          signOutLocally(SESSION_EXPIRED_MESSAGE);
        }
        // Network/server failures keep the local session alive (offline tolerant).
      });
  }, [token, signOutLocally]);

  // Any API call that fires clubops:unauthorized ends the session everywhere.
  useEffect(() => {
    const onUnauthorized = () => signOutLocally(SESSION_EXPIRED_MESSAGE);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [signOutLocally]);

  const login = useCallback(async (request: LoginRequest) => {
    setIsSubmitting(true);
    setNotice(null);
    try {
      const response = await authService.login(request);
      const remember = request.remember ?? true;
      saveSession({
        token: response.accessToken,
        tokenType: response.tokenType,
        user: response.user,
        expiresAt: response.expiresAt,
        remember,
      });
      setSession({ user: response.user, token: response.accessToken });
      setStatus("authenticated");
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (session) await authService.logout(session.token);
    } catch {
      // Logout must succeed locally even if the server call fails.
    } finally {
      signOutLocally(null);
    }
  }, [session, signOutLocally]);

  const clearNotice = useCallback(() => setNotice(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      status,
      isAuthenticated: status === "authenticated",
      isBootstrapping: status === "loading",
      isSubmitting,
      notice,
      login,
      logout,
      clearNotice,
    }),
    [session, status, isSubmitting, notice, login, logout, clearNotice],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
