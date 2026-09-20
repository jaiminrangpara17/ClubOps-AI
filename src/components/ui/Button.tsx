import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { ControlSize, IconComponent } from "@/types";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap " +
  "transition-colors duration-150 select-none " +
  "disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white shadow-xs hover:bg-brand-hover active:bg-brand-hover",
  secondary: "bg-brand-soft text-brand-soft-fg hover:bg-brand-100/70",
  outline:
    "border border-line-strong bg-surface text-fg shadow-xs hover:bg-surface-inset hover:border-line-strong",
  ghost: "text-fg-muted hover:bg-surface-inset hover:text-fg",
  danger: "bg-danger text-white shadow-xs hover:opacity-90",
  link: "text-brand underline-offset-4 hover:underline px-0",
};

const SIZES: Record<ControlSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

const ICON_SIZES: Record<ControlSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-11 w-11",
};

const GLYPH: Record<ControlSize, number> = { sm: 14, md: 16, lg: 18 };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ControlSize;
  /** Renders a square icon-only button; `aria-label` is then required. */
  iconOnly?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: IconComponent;
  trailingIcon?: IconComponent;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  iconOnly = false,
  loading = false,
  fullWidth = false,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  className,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const glyph = GLYPH[size];

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        BASE,
        iconOnly ? cn(ICON_SIZES[size], "px-0") : SIZES[size],
        VARIANTS[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 width={glyph} height={glyph} className="animate-spin" aria-hidden />
      ) : (
        LeadingIcon && <LeadingIcon width={glyph} height={glyph} aria-hidden />
      )}
      {!iconOnly && children}
      {!iconOnly && !loading && TrailingIcon && (
        <TrailingIcon width={glyph} height={glyph} aria-hidden />
      )}
    </button>
  );
}
