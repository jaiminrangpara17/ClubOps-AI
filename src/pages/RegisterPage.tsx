import { CalendarDays, Eye, EyeOff, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Logo, LogoMark } from "@/components/layout";
import { Button, ErrorState, Input } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { isValidEmail } from "@/lib/auth";
import { describeRegisterError } from "@/services/authService";

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

interface RegisterLocationState {
  from?: { pathname: string; search?: string };
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const PASSWORD_MIN_LENGTH = 8;

export default function RegisterPage() {
  const { register, isAuthenticated, isSubmitting } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTarget =
    (location.state as RegisterLocationState | null)?.from?.pathname ?? "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<keyof FieldErrors, boolean>>({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    // A new server error becomes obsolete as soon as the user edits the form.
    setServerError(null);
  }, [name, email, password, confirmPassword]);

  if (isAuthenticated) return <Navigate to={redirectTarget} replace />;

  const errors: FieldErrors = {};
  if (!name.trim()) errors.name = "Enter your full name.";
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter a password.";
  else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!confirmPassword) errors.confirmPassword = "Confirm your password.";
  else if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match.";

  const show = (field: keyof FieldErrors) => touched[field] || submittedOnce;
  const isInvalid = Boolean(errors.name || errors.email || errors.password || errors.confirmPassword);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setSubmittedOnce(true);
    if (isInvalid) return;

    try {
      await register({ name: name.trim(), email: email.trim(), password });
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      setServerError(describeRegisterError(error));
    }
  };

  const markTouched = (field: keyof FieldErrors) =>
    setTouched((current) => ({ ...current, [field]: true }));

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
            <h2 className="text-xl font-semibold text-fg">Create your account</h2>
            <p className="text-sm text-fg-muted">Join your club&apos;s event operations workspace.</p>
          </div>

          <div className="mt-6 space-y-4">
            {serverError && (
              <ErrorState variant="inline" title="Sign-up failed" description={serverError} />
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                label="Full name"
                autoComplete="name"
                autoFocus
                leadingIcon={UserRound}
                placeholder="Alex Morgan"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => markTouched("name")}
                error={show("name") ? errors.name : undefined}
              />

              <Input
                label="Email"
                type="email"
                autoComplete="email"
                inputMode="email"
                leadingIcon={Mail}
                placeholder="you@club.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => markTouched("email")}
                error={show("email") ? errors.email : undefined}
              />

              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={() => markTouched("password")}
                error={show("password") ? errors.password : undefined}
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

              <Input
                label="Confirm password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                onBlur={() => markTouched("confirmPassword")}
                error={show("confirmPassword") ? errors.confirmPassword : undefined}
              />

              <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
                {isSubmitting ? "Creating account…" : "Create account"}
              </Button>
            </form>

            <p className="text-center text-sm text-fg-muted">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-brand underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-fg-subtle">
            By creating an account you agree to the workspace usage policy.
          </p>
        </div>
      </main>
    </div>
  );
}
