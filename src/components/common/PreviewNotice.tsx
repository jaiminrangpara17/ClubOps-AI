import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PreviewNoticeProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Honest banner marking screens that render temporary preview content.
 * Removed per screen as each module gets its real implementation.
 */
export function PreviewNotice({ children, className }: PreviewNoticeProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-control border border-info/25 bg-info-soft px-3.5 py-2.5",
        className,
      )}
    >
      <Info width={15} height={15} aria-hidden className="mt-0.5 shrink-0 text-info" />
      <p className="text-xs text-fg-muted">
        {children ?? (
          <>
            <span className="font-medium text-fg">Preview interface.</span> Content is temporary
            sample data and primary actions stay disabled until this module is implemented.
          </>
        )}
      </p>
    </div>
  );
}
