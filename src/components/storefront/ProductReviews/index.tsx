"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { Review } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStoreFeatures } from "@/features/settings/StoreFeaturesContext";
import type { ReviewSummary } from "@/services/review.service";

/** Row of stars. Read-only unless `onRate` is supplied. */
function Stars({
  value,
  size = "sm",
  onRate,
}: {
  value: number;
  size?: "sm" | "lg";
  onRate?: (rating: number) => void;
}) {
  const dimension = size === "lg" ? "h-6 w-6" : "h-3.5 w-3.5";

  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) =>
        onRate ? (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            aria-pressed={value === star}
          >
            <Star
              className={`${dimension} ${
                star <= value ? "fill-amber-400 text-amber-400" : "text-brand-faint-ink"
              }`}
            />
          </button>
        ) : (
          <Star
            key={star}
            className={`${dimension} ${
              star <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-brand-border"
            }`}
          />
        )
      )}
    </span>
  );
}

export function ProductReviews({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const { reviews: reviewsEnabled } = useStoreFeatures();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [thankYou, setThankYou] = useState("");

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setReviews(data.data.reviews || []);
        setSummary(data.data.summary || null);
      }
    } catch {
      // A failed review fetch must not break the product page; the section
      // simply shows its empty state.
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (reviewsEnabled) void fetchReviews();
    else setIsLoading(false);
  }, [reviewsEnabled, fetchReviews]);

  // The whole section disappears when the merchant switches reviews off.
  if (!reviewsEnabled) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (rating === 0) {
      setFormError("Please choose a star rating.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, customerName: name, rating, title, comment }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Could not send your review.");
      }

      setThankYou(data.message || "Thank you — your review will appear once it has been checked.");
      setIsFormOpen(false);
      setName("");
      setRating(0);
      setTitle("");
      setComment("");
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = summary?.count ?? 0;

  return (
    <section className="border-t border-brand-border pt-10" aria-labelledby="reviews-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="reviews-heading" className="text-xl font-bold font-heading text-brand-ink">
            Customer Reviews
          </h2>
          {total > 0 ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Stars value={summary!.average} />
              <span className="text-sm font-bold text-brand-ink">
                {summary!.average.toFixed(1)}
              </span>
              <span className="text-xs text-brand-muted-ink">
                from {total} review{total === 1 ? "" : "s"}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-xs text-brand-muted-ink">
              No reviews yet. Be the first to write one.
            </p>
          )}
        </div>

        {!isFormOpen && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsFormOpen(true);
              setThankYou("");
            }}
            className="gap-1.5 self-start"
          >
            <MessageSquare className="h-3.5 w-3.5" /> Write a review
          </Button>
        )}
      </div>

      {thankYou && (
        <p className="mt-4 rounded-brand border border-brand-success/30 bg-brand-success/10 p-3 text-xs font-semibold text-brand-success">
          {thankYou}
        </p>
      )}

      {/* Rating distribution */}
      {total > 0 && summary && (
        <div className="mt-6 max-w-sm space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = summary.distribution[star] ?? 0;
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-right font-semibold text-brand-muted-ink tabular-nums">
                  {star}
                </span>
                <Star className="h-3 w-3 flex-shrink-0 fill-amber-400 text-amber-400" />
                <span
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-subtle"
                  role="presentation"
                >
                  <span
                    className="block h-full rounded-full bg-amber-400"
                    style={{ width: `${percent}%` }}
                  />
                </span>
                <span className="w-6 text-right text-brand-faint-ink tabular-nums">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission form */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-brand-xl border border-brand-border bg-brand-subtle p-4 sm:p-6"
        >
          <p className="text-sm font-semibold text-brand-ink">
            Reviewing <span className="font-bold">{productName}</span>
          </p>

          <div className="space-y-1.5">
            <span className="block text-xs font-semibold uppercase tracking-wider text-brand-muted-ink">
              Your rating
            </span>
            <Stars value={rating} size="lg" onRate={setRating} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Your name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How it should appear publicly"
            />
            <Input
              label="Headline (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sums up your experience"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="reviewComment"
              className="block text-xs font-semibold uppercase tracking-wider text-brand-muted-ink"
            >
              Your review
            </label>
            <textarea
              id="reviewComment"
              required
              rows={4}
              minLength={10}
              maxLength={2000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-brand border border-brand-border-strong p-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              placeholder="How does it fit? How does it wear? What would you tell a friend?"
            />
            <p className="text-[11px] text-brand-muted-ink">
              Reviews are read before they are published, so yours will not appear straight away.
            </p>
          </div>

          {formError && (
            <p className="rounded-brand border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsFormOpen(false);
                setFormError("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Submit review
            </Button>
          </div>
        </form>
      )}

      {/* The reviews themselves */}
      <div className="mt-8">
        {isLoading ? (
          <p className="flex items-center gap-2 text-xs text-brand-faint-ink">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading reviews…
          </p>
        ) : reviews.length === 0 ? null : (
          <ul className="divide-y divide-brand-border">
            {reviews.map((review) => (
              <li key={review.id} className="py-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={review.rating} />
                  <span className="text-sm font-bold text-brand-ink">{review.customer_name}</span>
                  <span className="text-xs text-brand-faint-ink">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.title && (
                  <p className="mt-1.5 text-sm font-semibold text-brand-ink">{review.title}</p>
                )}
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-brand-muted-ink">
                  {review.comment}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
