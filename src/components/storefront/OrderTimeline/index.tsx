import React from "react";
import { Check, CircleSlash } from "lucide-react";
import type { Order, OrderStatusHistory } from "@/types/database";
import {
  ORDER_JOURNEY,
  isTerminalFailure,
  journeyIndex,
  orderStatusLabel,
} from "@/lib/orders/status";

export interface OrderTimelineProps {
  order: Pick<Order, "status" | "created_at" | "shipping_method"> & {
    history?: OrderStatusHistory[];
  };
}

/**
 * Order progress tracker.
 *
 * "Where is my order?" is the single biggest driver of support contacts in
 * e-commerce. Showing the journey — with real timestamps taken from
 * order_status_history rather than a guessed schedule — answers it before the
 * customer has to ask.
 */
export function OrderTimeline({ order }: OrderTimelineProps) {
  if (isTerminalFailure(order.status)) {
    return (
      <div className="flex items-center gap-3 rounded-brand border border-brand-danger-border bg-brand-danger-surface p-4">
        <CircleSlash className="h-5 w-5 flex-shrink-0 text-brand-danger" />
        <div>
          <p className="text-sm font-semibold text-brand-danger">{orderStatusLabel(order.status)}</p>
          <p className="text-xs text-brand-danger">
            {order.status === "refunded"
              ? "The refund has been issued to your original payment method."
              : "Nothing has been charged. Contact support if you believe this is a mistake."}
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = journeyIndex(order.status);

  // Real timestamps only. A step with no history row shows no date rather than
  // an invented one — a wrong delivery date is worse than no date.
  const timestamps = new Map<string, string>();
  for (const entry of order.history || []) {
    if (!timestamps.has(entry.status)) timestamps.set(entry.status, entry.created_at);
  }

  return (
    <ol className="relative space-y-0">
      {ORDER_JOURNEY.map((step, index) => {
        const reached = currentIndex >= index && currentIndex !== -1;
        const isCurrent = currentIndex === index;
        const timestamp = timestamps.get(step);
        const isLast = index === ORDER_JOURNEY.length - 1;

        return (
          <li key={step} className="flex gap-4">
            {/* Rail */}
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  reached
                    ? "border-brand-success bg-brand-success text-white"
                    : "border-brand-border bg-white text-brand-faint-ink"
                }`}
                aria-hidden="true"
              >
                {reached ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              {!isLast && (
                <span
                  className={`w-0.5 flex-1 ${reached && currentIndex > index ? "bg-brand-primary" : "bg-brand-border"}`}
                  style={{ minHeight: "2rem" }}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Label */}
            <div className={`flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
              <p
                className={`text-sm font-semibold ${
                  isCurrent ? "text-brand-primary" : reached ? "text-brand-ink" : "text-brand-faint-ink"
                }`}
              >
                {orderStatusLabel(step)}
                {isCurrent && (
                  <span className="ml-2 rounded-full bg-brand-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                    Current
                  </span>
                )}
              </p>
              {timestamp && (
                <p className="mt-0.5 text-xs text-brand-muted-ink">
                  {new Date(timestamp).toLocaleString(undefined, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              {isCurrent && !timestamp && order.shipping_method?.estimated_days && (
                <p className="mt-0.5 text-xs text-brand-muted-ink">
                  Estimated delivery: {order.shipping_method.estimated_days}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
