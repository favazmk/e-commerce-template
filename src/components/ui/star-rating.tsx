import React from "react";
import { Star } from "lucide-react";

export interface StarRatingProps {
  /** 0–5. Halves are rendered as a partial fill. */
  rating: number;
  /** Number of reviews behind the rating. Omitted when zero. */
  count?: number;
  size?: "xs" | "sm" | "md";
  /** Compact single-star pill, as used on dense product grids. */
  variant?: "stars" | "pill";
  className?: string;
}

const SIZE_CLASSES = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
} as const;

const TEXT_CLASSES = {
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-sm",
} as const;

/**
 * Star rating display.
 *
 * A rating is the single strongest trust signal on a product grid, but only
 * when it is real: `count` of 0 renders nothing at all rather than five empty
 * stars, which read as "rated badly" rather than "not yet rated".
 */
export function StarRating({
  rating,
  count,
  size = "sm",
  variant = "stars",
  className = "",
}: StarRatingProps) {
  if (!rating || rating <= 0 || (count !== undefined && count <= 0)) return null;

  const rounded = Math.round(rating * 10) / 10;
  const label = `Rated ${rounded} out of 5${count ? ` from ${count} reviews` : ""}`;

  if (variant === "pill") {
    // The compact treatment used by large marketplaces: one star, the number,
    // then the count. Survives a 2-column phone grid where five stars cannot.
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-brand-sm border border-brand-border bg-white px-1.5 py-0.5 ${TEXT_CLASSES[size]} font-semibold text-brand-muted-ink ${className}`}
        aria-label={label}
      >
        <span aria-hidden="true">{rounded.toFixed(1)}</span>
        <Star className={`${SIZE_CLASSES[size]} fill-brand-rating text-brand-rating`} aria-hidden="true" />
        {count ? (
          <span className="font-normal text-brand-faint-ink" aria-hidden="true">
            | {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} aria-label={label}>
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((position) => {
          const fill = Math.min(1, Math.max(0, rounded - position + 1));
          return (
            <span key={position} className="relative inline-block">
              <Star className={`${SIZE_CLASSES[size]} text-brand-border`} fill="currentColor" />
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star
                    className={`${SIZE_CLASSES[size]} text-amber-400`}
                    fill="currentColor"
                  />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {count ? (
        <span className={`${TEXT_CLASSES[size]} text-brand-faint-ink`} aria-hidden="true">
          ({count})
        </span>
      ) : null}
    </span>
  );
}
