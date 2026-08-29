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

  const variantStyles = {
    default: "bg-slate-100 text-slate-800",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    warning: "bg-amber-50 text-amber-700 border border-amber-200/60",
    danger: "bg-rose-50 text-rose-700 border border-rose-200/60",
    accent: "bg-emerald-600 text-white shadow-xs",
    outline: "border border-slate-300 text-slate-700",
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
