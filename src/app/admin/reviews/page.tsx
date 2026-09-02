"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Star, Check, X, Trash2, MessageSquare, RotateCcw } from "lucide-react";
import { Review, ReviewStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

interface ModerationReview extends Review {
  product_name: string;
}

const FILTERS: Array<{ key: "all" | ReviewStatus; label: string }> = [
  { key: "pending", label: "Needs review" },
  { key: "approved", label: "Published" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "Everything" },
];

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= value ? "fill-amber-400 text-amber-400" : "text-slate-200"
          }`}
        />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ModerationReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ReviewStatus>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ModerationReview | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const notify = (tone: "ok" | "error", text: string) => {
    setFeedback({ tone, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchReviews = useCallback(async () => {
    try {
      const query = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/admin/reviews${query}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setReviews(data.data || []);
      else notify("error", data.error?.message || "Could not load reviews.");
    } catch {
      notify("error", "Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setIsLoading(true);
    void fetchReviews();
  }, [fetchReviews]);

  const setStatus = async (review: ModerationReview, status: ReviewStatus) => {
    setBusyId(review.id);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Update failed.");

      notify(
        "ok",
        status === "approved"
          ? `Published ${review.customer_name}'s review — it is live on the product page.`
          : status === "rejected"
          ? `Rejected ${review.customer_name}'s review. It stays hidden from customers.`
          : `Moved ${review.customer_name}'s review back to the queue.`
      );
      await fetchReviews();
    } catch (err: any) {
      notify("error", err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    try {
      const res = await fetch(`/api/admin/reviews/${target.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Delete failed.");
      notify("ok", "Review deleted.");
      await fetchReviews();
    } catch (err: any) {
      notify("error", err.message);
    }
  };

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
          Customer Feedback
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
          Product Reviews
        </h1>
        <p className="mt-1 max-w-2xl text-xs text-slate-500">
          Nothing a customer writes appears on the storefront until you publish it here.
          {filter === "pending" && pendingCount > 0 && (
            <span className="font-semibold text-slate-700">
              {" "}
              {pendingCount} waiting for you.
            </span>
          )}
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-brand border p-3 text-xs font-semibold ${
            feedback.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-brand border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === f.key
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-xs text-slate-400">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <div className="rounded-brand-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            {filter === "pending" ? "Nothing waiting" : "No reviews here"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {filter === "pending"
              ? "Every review has been dealt with. New ones will appear here."
              : "Try a different filter."}
          </p>
        </div>
      ) : (
        <ul className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle divide-y divide-slate-100 overflow-hidden">
          {reviews.map((review) => (
            <li key={review.id} className="p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Stars value={review.rating} />
                <span className="text-sm font-bold text-slate-900">{review.customer_name}</span>
                <Badge
                  variant={
                    review.status === "approved"
                      ? "success"
                      : review.status === "rejected"
                      ? "danger"
                      : "warning"
                  }
                  size="sm"
                >
                  {review.status === "approved"
                    ? "PUBLISHED"
                    : review.status === "rejected"
                    ? "REJECTED"
                    : "NEEDS REVIEW"}
                </Badge>
                <span className="text-xs text-slate-400">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
                {!review.user_id && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Guest
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500">
                On <span className="font-semibold text-slate-700">{review.product_name}</span>
              </p>

              {review.title && (
                <p className="text-sm font-semibold text-slate-900">{review.title}</p>
              )}
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {review.comment}
              </p>

              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                {review.status !== "approved" && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={busyId === review.id}
                    onClick={() => setStatus(review, "approved")}
                    className="gap-1.5 text-xs"
                  >
                    <Check className="h-3.5 w-3.5" /> Publish
                  </Button>
                )}

                {review.status !== "rejected" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={busyId === review.id}
                    onClick={() => setStatus(review, "rejected")}
                    className="gap-1.5 text-xs"
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                )}

                {review.status !== "pending" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    isLoading={busyId === review.id}
                    onClick={() => setStatus(review, "pending")}
                    className="gap-1.5 text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Back to queue
                  </Button>
                )}

                <button
                  type="button"
                  onClick={() => setPendingDelete(review)}
                  className="ml-auto rounded-brand p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  title="Delete review"
                  aria-label={`Delete review by ${review.customer_name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this review?"
        description="This removes it permanently and cannot be undone. To hide a review while keeping it, reject it instead."
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" size="sm" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
            Delete permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
}
