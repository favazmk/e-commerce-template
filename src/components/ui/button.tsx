import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent" | "inverse";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-brand transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    /**
     * `primary` is the hot brand colour and `accent` is the deep neutral, which
     * is the pairing marketplaces use for "Add to bag" next to "Buy now": two
     * strong buttons that are still visually ranked. Making both the same
     * colour would leave the shopper choosing between identical options.
     */
    const variantStyles = {
      primary:
        "bg-brand-primary text-white hover:bg-brand-primary-hover focus:ring-brand-primary shadow-sm",
      secondary:
        "bg-brand-subtle text-brand-ink hover:bg-brand-border focus:ring-brand-border-strong",
      outline:
        "border border-brand-border-strong bg-white text-brand-ink hover:border-brand-ink focus:ring-brand-border-strong",
      ghost:
        "bg-transparent text-brand-muted-ink hover:bg-brand-subtle hover:text-brand-ink",
      accent:
        "bg-brand-ink text-white hover:bg-brand-ink/90 focus:ring-brand-ink shadow-sm",
      /**
       * For controls sitting on a dark surface. Every other variant assumes the
       * brand colour contrasts with the page ink; a monochrome brand, where
       * primary and ink are the same value, renders those invisible on a dark
       * panel. This one is defined against the surface rather than the palette,
       * so it holds whatever the brand colour is.
       */
      inverse:
        "bg-white text-brand-ink hover:bg-white/90 focus:ring-white shadow-sm",
      danger:
        "bg-brand-danger text-white hover:brightness-95 focus:ring-brand-danger shadow-sm",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2.5 gap-2",
      lg: "text-sm px-6 py-3.5 gap-2.5 font-bold uppercase tracking-wide",
      icon: "p-2 rounded-full",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variantStyles[variant], sizeStyles[size], className))}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
