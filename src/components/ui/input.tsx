import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-brand-muted-ink">
            {label}
          </label>
        )}
        <div className="relative rounded-brand shadow-sm">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-brand-faint-ink">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              clsx(
                "block w-full rounded-brand border bg-white px-3.5 py-2.5 text-sm text-brand-ink placeholder-brand-faint-ink transition-colors focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:cursor-not-allowed disabled:bg-brand-subtle disabled:text-brand-muted-ink",
                leftIcon && "pl-10",
                rightIcon && "pr-10",
                error
                  ? "border-brand-danger-border text-brand-danger focus:border-brand-danger focus:ring-brand-danger"
                  : "border-brand-border-strong hover:border-brand-ink",
                className
              )
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-faint-ink">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-brand-danger font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-brand-muted-ink">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
