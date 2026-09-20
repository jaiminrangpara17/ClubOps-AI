import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui";
import { Logo } from "@/components/layout";
import { useAuth } from "@/context/AuthContext";

/** Application-level gate shown while an async auth check is in flight. */
function AuthBootScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
      <Logo compact />
      <Spinner size={22} label="Checking your session" />
      <p className="text-sm text-fg-muted">Preparing ClubOps…</p>
    </div>
  );
}

/**
 * Guard for the authenticated application shell.
 * Unauthenticated users are sent to /login and the requested location is
 * preserved so they return there after signing in.
 */
export function ProtectedRoute() {
  const { status, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) return <AuthBootScreen />;

  if (status !== "authenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: { pathname: location.pathname, search: location.search } }}
      />
    );
  }

  return <Outlet />;
}
