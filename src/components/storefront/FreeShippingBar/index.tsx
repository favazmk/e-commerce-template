"use client";

import React from "react";
import { PartyPopper, Truck } from "lucide-react";
import { formatPrice } from "@/lib/config/store.config";
import { freeShippingProgress } from "@/lib/commerce/merchandising";

export interface FreeShippingBarProps {
  subtotal: number;
  /** Merchant-configured threshold. Null hides the component entirely. */
  threshold: number | null;
  className?: string;
}

/**
 * Progress towards free delivery.
 *
 * The most effective nudge in e-commerce, and an honest one: the shopper is
 * being told about a real saving they control, not pressured by a fake timer.
 * Stating the exact shortfall in money ("AED 42.50 away") outperforms a bare
 * percentage, because it is directly comparable to the price of one more item.
 */
export function FreeShippingBar({ subtotal, threshold, className = "" }: FreeShippingBarProps) {
  const progress = freeShippingProgress(subtotal, threshold);
  if (!progress) return null;

  if (progress.qualifies) {
    return (
      <div
        className={`flex items-center gap-2.5 rounded-brand border border-emerald-200 bg-emerald-50 px-4 py-3 ${className}`}
        role="status"
      >
        <PartyPopper className="h-4 w-4 flex-shrink-0 text-emerald-600" />
        <p className="text-sm font-semibold text-emerald-800">
          Your order qualifies for free delivery
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-brand border border-slate-200 bg-white px-4 py-3 ${className}`}>
      <p className="flex items-center gap-2 text-sm text-slate-700">
        <Truck className="h-4 w-4 flex-shrink-0 text-slate-400" />
        <span>
          Add{" "}
          <span className="font-bold text-slate-900">{formatPrice(progress.remaining)}</span> more
          for <span className="font-semibold text-emerald-600">free delivery</span>
        </span>
      </p>
      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress towards free delivery"
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}
