import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-brand-xl border-2 border-dashed border-brand-border bg-brand-subtle/50 p-12 text-center my-6">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-subtle text-brand-faint-ink">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <h3 className="text-base font-semibold text-brand-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-brand-muted-ink">{description}</p>
      {actionText && (
        <div className="mt-6">
          {actionHref ? (
            <a href={actionHref}>
              <Button size="sm" variant="primary">
                {actionText}
              </Button>
            </a>
          ) : (
            <Button size="sm" variant="primary" onClick={onAction}>
              {actionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
