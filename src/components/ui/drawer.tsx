"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: "left" | "right";
  width?: "sm" | "md" | "lg";
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = "right",
  width = "md",
}: DrawerProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(isOpen);
  const titleId = React.useId();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-ink/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className={clsx("fixed inset-y-0 flex max-w-full", position === "right" ? "right-0" : "left-0")}>
        <div
          className={twMerge(
            clsx(
              "w-screen bg-white shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out",
              widthStyles[width]
            )
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-label={title ? undefined : "Panel"}
          ref={panelRef}
          tabIndex={-1}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
            <h3
              id={titleId}
              className="text-base font-semibold uppercase tracking-wider text-brand-ink"
            >
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-brand-faint-ink hover:bg-brand-subtle hover:text-brand-ink transition-colors"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="relative flex-1 overflow-y-auto px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
