"use client";

import React from "react";
import Link from "next/link";
import { PartyPopper, Truck } from "lucide-react";
import { formatPrice } from "@/lib/config/store.config";
import { freeShippingProgress } from "@/lib/commerce/merchandising";

export interface FreeShippingBarProps {
  subtotal: number;
  /** Merchant-configured threshold. Null hides the component entirely. */
  threshold: number | null;
  /**
   * When set, the shortfall message links here. Worth passing on checkout,
   * where the shopper cannot otherwise act on the nudge without losing their
   * place — telling someone they are AED 45 away and giving them no way to get
   * there is worse than saying nothing.
   */
  onKeepShopping?: string;
  className?: string;
}

/**
 * Progress towards free delivery.
 *
 * The most effective nudge in e-commerce, and an honest one: the shopper is
 * being told about a real saving they control, not pressured by a fake timer.
 * Stating the exact shortfall in money ("AED 42.50 away") outperforms a bare
 * percentage, because it is directly comparable to the price of one more item.
 *
 * The threshold is always passed in from the server-calculated cart, so this
 * bar and the amount actually charged can never disagree.
 */
export function FreeShippingBar({
  subtotal,
  threshold,
  onKeepShopping,
  className = "",
}: FreeShippingBarProps) {
  const progress = freeShippingProgress(subtotal, threshold);
  if (!progress) return null;

  if (progress.qualifies) {
    return (
      <div
        className={`flex items-center gap-2.5 rounded-brand border border-brand-success/30 bg-brand-success/10 px-4 py-3 ${className}`}
        role="status"
      >
        <PartyPopper className="h-4 w-4 flex-shrink-0 text-brand-success" />
        <p className="text-sm font-bold text-brand-success">
          Your order qualifies for FREE delivery
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-brand border border-brand-border bg-white px-4 py-3 ${className}`}>
      <p className="flex items-start gap-2 text-sm text-brand-ink">
        <Truck className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-discount" />
        <span>
          Add <span className="font-bold">{formatPrice(progress.remaining)}</span> more to get{" "}
          <span className="font-bold text-brand-success">FREE delivery</span>
          {onKeepShopping && (
            <>
              {" — "}
              <Link
                href={onKeepShopping}
                className="font-bold text-brand-primary underline underline-offset-2 hover:no-underline"
              >
                add something
              </Link>
            </>
          )}
        </span>
      </p>

      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-brand-subtle"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress towards free delivery"
      >
        <div
          className="h-full rounded-full bg-brand-success transition-all duration-500"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}
