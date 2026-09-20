import { CalendarDays, Eye, EyeOff, Info, LogIn, Mail, ShieldCheck, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Logo, LogoMark } from "@/components/layout";
import { Button, ErrorState, Input } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { getUserRoleLabel, isValidEmail } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { DEV_ACCOUNTS, DEV_PASSWORD, describeAuthError, isDevAuthMode } from "@/services/authService";

const CAPABILITIES = [
  {
    icon: CalendarDays,
    title: "Events & operations",
    text: "Plan events, track tasks and keep every deadline visible.",
  },
  {
    icon: ShieldCheck,
    title: "People & governance",
    text: "Coordinate volunteers, documents and risk in one workspace.",
  },
  {
    icon: Sparkles,
    title: "AI-assisted planning",
    text: "Briefings and copilot answers grounded in your club's data.",
  },
] as const;

interface LoginLocationState {
  from?: { pathname: string; search?: string };
}

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const { login, isAuthenticated, isSubmitting, notice, clearNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTarget =
    (location.state as LoginLocationState | null)?.from?.pathname ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<keyof FieldErrors, boolean>>({
    email: false,
    password: false,
  });
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [forgotHint, setForgotHint] = useState(false);

  useEffect(() => {
    // A new server error becomes obsolete as soon as the user edits the form.
    setServerError(null);
  }, [email, password]);

  if (isAuthenticated) return <Navigate to={redirectTarget} replace />;

  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";

  const emailError = touched.email || submittedOnce ? errors.email : undefined;
  const passwordError = touched.password || submittedOnce ? errors.password : undefined;
  const isInvalid = Boolean(errors.email || errors.password);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setSubmittedOnce(true);
    if (isInvalid) return;

    try {
      await login({ email: email.trim(), password, remember });
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      setServerError(describeAuthError(error));
    }
  };

  const fillDemoAccount = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword(DEV_PASSWORD);
    setSubmittedOnce(false);
    setTouched({ email: false, password: false });
  };

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2">
      {/* ---- Brand panel ---------------------------------------------------- */}
      <aside className="relative hidden flex-col justify-between bg-nav p-12 lg:flex xl:p-16">
        <Logo />

        <div className="max-w-md">
          <p className="text-xs font-semibold tracking-[0.22em] text-brand-400 uppercase">
            ClubOps AI
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white xl:text-4xl">
            AI Operating System for College Clubs
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-nav-fg-muted">
            One workspace for events, volunteers, documents and risks — so your club runs on
            operations, not on scattered chats.
          </p>

          <ul className="mt-10 space-y-5">
            {CAPABILITIES.map((capability) => {
              const Icon = capability.icon;
              return (
                <li key={capability.title} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-nav-line bg-white/[0.04] text-nav-fg">
                    <Icon width={16} height={16} aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-nav-fg">{capability.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-nav-fg-muted">
                      {capability.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="font-mono text-[11px] tracking-wide text-nav-fg-muted/70">
          CLUBOPS.AI — EVENT OPERATIONS · v0.3.0
        </p>
      </aside>

      {/* ---- Form panel ------------------------------------------------------ */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-card bg-brand text-white">
              <LogoMark size={22} />
            </span>
            <p className="text-sm font-bold tracking-[0.22em] text-fg uppercase">
              Clubops <span className="text-brand">AI</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-fg">Welcome back</h2>
            <p className="text-sm text-fg-muted">Sign in to manage your event operations.</p>
          </div>

          <div className="mt-6 space-y-4">
            {notice && (
              <div className="flex items-start gap-2.5 rounded-control border border-info/25 bg-info-soft px-3.5 py-2.5">
                <Info width={15} height={15} aria-hidden className="mt-0.5 shrink-0 text-info" />
                <p className="flex-1 text-sm text-fg-muted">{notice}</p>
                <button
                  type="button"
                  onClick={clearNotice}
                  aria-label="Dismiss notice"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-fg-subtle hover:text-fg"
                >
                  <X width={13} height={13} aria-hidden />
                </button>
              </div>
            )}

            {serverError && (
              <ErrorState variant="inline" title="Sign-in failed" description={serverError} />
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                inputMode="email"
                autoFocus
                leadingIcon={Mail}
                placeholder="you@club.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                error={emailError}
              />

              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                error={passwordError}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="flex h-6 w-6 items-center justify-center rounded-sm text-fg-subtle transition-colors hover:text-fg"
                  >
                    {showPassword ? (
                      <EyeOff width={15} height={15} aria-hidden />
                    ) : (
                      <Eye width={15} height={15} aria-hidden />
                    )}
                  </button>
                }
              />

              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-fg-muted select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-brand-600"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={(e) => {
                    setForgotHint(true);
                    e.currentTarget.blur();
                  }}
                  className="text-xs font-medium text-brand underline-offset-4 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {forgotHint && (
                <p className="rounded-control border border-line bg-surface-inset px-3 py-2 text-xs text-fg-muted">
                  Password resets are handled by your workspace administrator. Ask them to issue new
                  credentials.
                </p>
              )}

              <Button type="submit" fullWidth size="lg" loading={isSubmitting} leadingIcon={LogIn}>
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            {isDevAuthMode && (
              <section
                aria-label="Development sign-in"
                className={cn(
                  "rounded-card border border-dashed border-line-strong bg-surface-subtle p-3.5",
                )}
              >
                <p className="text-[11px] font-semibold tracking-wider text-fg-subtle uppercase">
                  Development build — local session
                </p>
                <p className="mt-1 text-xs text-fg-muted">
                  Choose an account to fill the form. Real authentication is enabled by setting{" "}
                  <code className="font-mono text-[11px] text-fg">VITE_AUTH_MODE=api</code>.
                </p>
                <div className="mt-2.5 grid gap-1.5">
                  {DEV_ACCOUNTS.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => fillDemoAccount(account.email)}
                      className="flex items-center justify-between gap-2 rounded-control border border-line bg-surface px-2.5 py-2 text-left transition-colors hover:border-brand/40"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium text-fg">
                          {account.name}
                        </span>
                        <span className="block truncate font-mono text-[11px] text-fg-subtle">
                          {account.email}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] font-medium text-brand">
                        {getUserRoleLabel(account.role)}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-fg-subtle">
            By signing in you agree to the workspace usage policy.
          </p>
        </div>
      </main>
    </div>
  );
}
