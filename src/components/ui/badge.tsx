import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "outline" | "accent";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-medium rounded-full tracking-wide";

  // Semantic, not decorative: green means approved, orange means a deal, red
  // means running out. Shoppers read these before they read the label.
  const variantStyles = {
    default: "bg-brand-subtle text-brand-muted-ink",
    success: "bg-brand-success/10 text-brand-success border border-brand-success/25",
    warning: "bg-brand-discount/10 text-brand-discount border border-brand-discount/25",
    danger: "bg-brand-urgent/10 text-brand-danger border border-brand-urgent/25",
    accent: "bg-brand-primary text-white",
    outline: "border border-brand-border-strong text-brand-muted-ink",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] uppercase font-bold",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, variantStyles[variant], sizeStyles[size], className))}
      {...props}
    >
      {children}
    </span>
  );
}
