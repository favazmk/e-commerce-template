"use client";

import React, { useMemo, useState } from "react";
import { Package, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { formatPrice } from "@/lib/config/store.config";
import {
  estimateDeliveryWindow,
  formatDeliveryWindow,
  parseTransitDays,
} from "@/lib/commerce/merchandising";

export interface DeliveryOption {
  id: string;
  name: string;
  rate: number;
  estimated_days?: string;
  free_threshold?: number;
}

export interface DeliveryEstimateProps {
  /** Shipping methods as configured by the merchant, resolved on the server. */
  options: DeliveryOption[];
  /** Unit price, used to say whether this item alone clears free shipping. */
  itemPrice: number;
  /** Non-working days for the courier, 0 = Sunday. */
  nonWorkingDays?: number[];
  /** Return window in days, 0 hides the returns line entirely. */
  returnWindowDays?: number;
}

/**
 * Delivery and returns panel for the product page.
 *
 * Two decisions here matter more than the styling:
 *
 * 1. It shows dates ("Arrives Tue 9 – Thu 11 Sep"), not durations. A shopper
 *    should not have to count business days in their head to know whether the
 *    parcel lands before the weekend.
 *
 * 2. It states the returns policy at the point of hesitation. Return terms are
 *    the most common reason a considered purchase stalls, and answering it
 *    inline converts better than a link to a policy page.
 *
 * Every number rendered comes from merchant configuration. Nothing is invented.
 */
export function DeliveryEstimate({
  options,
  itemPrice,
  nonWorkingDays,
  returnWindowDays = 0,
}: DeliveryEstimateProps) {
  const [selectedId, setSelectedId] = useState(options[0]?.id);
  const selected = options.find((option) => option.id === selectedId) || options[0];

  const window = useMemo(() => {
    if (!selected) return null;
    const [min, max] = parseTransitDays(selected.estimated_days);
    return estimateDeliveryWindow(min, max, { nonWorkingDays });
  }, [selected, nonWorkingDays]);

  if (!selected || !window) return null;

  const qualifiesFree =
    Boolean(selected.free_threshold) && itemPrice >= (selected.free_threshold as number);
  const shortfall = selected.free_threshold ? selected.free_threshold - itemPrice : 0;

  return (
    <div className="space-y-3 rounded-brand-xl border border-brand-border bg-brand-subtle/60 p-4">
      <div className="flex items-start gap-3">
        <Truck className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-ink">
            Arrives {formatDeliveryWindow(window)}
          </p>
          <p className="mt-0.5 text-xs text-brand-muted-ink">
            {selected.name}
            {" · "}
            {qualifiesFree || selected.rate === 0 ? (
              <span className="font-semibold text-brand-primary">Free delivery</span>
            ) : (
              <>
                {formatPrice(selected.rate)}
                {selected.free_threshold && shortfall > 0 && (
                  <span className="text-brand-muted-ink">
                    {" "}
                    — free over {formatPrice(selected.free_threshold)}
                  </span>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Method switcher, only when there is a real choice to make. */}
      {options.length > 1 && (
        <div className="flex flex-wrap gap-2 pl-8">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedId(option.id)}
              className={`rounded-brand-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                option.id === selected.id
                  ? "border-brand-ink bg-brand-ink text-white"
                  : "border-brand-border bg-white text-brand-muted-ink hover:border-brand-ink"
              }`}
            >
              {option.name}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2 border-t border-brand-border pt-3 pl-8 text-xs text-brand-muted-ink">
        {returnWindowDays > 0 && (
          <p className="flex items-center gap-2">
            <RotateCcw className="h-3.5 w-3.5 flex-shrink-0 text-brand-faint-ink" />
            {returnWindowDays}-day returns — start one from your account
          </p>
        )}
        <p className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-brand-faint-ink" />
          Secure checkout — card details never touch our servers
        </p>
        <p className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5 flex-shrink-0 text-brand-faint-ink" />
          Tracked from dispatch to your door
        </p>
      </div>
    </div>
  );
}
