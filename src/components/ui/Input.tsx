import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { ControlSize, IconComponent } from "@/types";

const SIZES: Record<ControlSize, string> = {
  sm: "h-8 text-xs",
  md: "h-10 text-sm",
  lg: "h-11 text-sm",
};

const GLYPH: Record<ControlSize, number> = { sm: 14, md: 16, lg: 18 };

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  /** Error text; also switches the field to the danger state. */
  error?: string;
  size?: ControlSize;
  leadingIcon?: IconComponent;
  /** Trailing adornment (unit, shortcut hint, small button). */
  trailing?: ReactNode;
  containerClassName?: string;
}

export function Input({
  label,
  hint,
  error,
  size = "md",
  leadingIcon: LeadingIcon,
  trailing,
  className,
  containerClassName,
  id,
  disabled,
  required,
  ...props
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const glyph = GLYPH[size];

  return (
    <div className={cn("w-full space-y-1.5", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-fg-muted">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {LeadingIcon && (
          <LeadingIcon
            width={glyph}
            height={glyph}
            aria-hidden
            className="pointer-events-none absolute left-3 text-fg-subtle"
          />
        )}
        <input
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full rounded-control border bg-surface px-3 text-fg shadow-xs",
            "placeholder:text-fg-subtle transition-colors duration-150",
            "hover:border-line-strong focus:border-brand focus:outline-none",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
            "disabled:cursor-not-allowed disabled:bg-surface-inset disabled:text-fg-subtle",
            SIZES[size],
            LeadingIcon && "pl-9",
            trailing && "pr-10",
            error ? "border-danger" : "border-line-strong",
            className,
          )}
          {...props}
        />
        {trailing && (
          <div className="absolute right-3 flex items-center text-xs text-fg-subtle">
            {trailing}
          </div>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
