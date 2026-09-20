import { Compass } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card } from "@/components/ui";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card padding="lg" className="w-full max-w-lg text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-soft-fg">
          <Compass width={22} height={22} aria-hidden />
        </span>
        <p className="mt-5 font-mono text-xs tracking-widest text-fg-subtle uppercase">Error 404</p>
        <h1 className="mt-2 text-xl font-semibold text-fg">Page not found</h1>
        <p className="mt-2 text-sm text-fg-muted">
          We couldn&apos;t find anything at{" "}
          <span className="font-mono text-xs text-fg">{pathname}</span>. The page may have moved or
          the module is not available yet.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
          <Button variant="outline" onClick={() => navigate("/events")}>
            Browse events
          </Button>
        </div>
      </Card>
    </div>
  );
}
