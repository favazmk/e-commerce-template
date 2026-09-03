"use client";

import { useEffect } from "react";
import { AnalyticsService, type AnalyticsItem } from "@/services/analytics.service";

export interface PurchaseTrackerProps {
  orderNumber: string;
  value: number;
  currency: string;
  tax: number;
  shipping: number;
  coupon?: string | null;
  items: AnalyticsItem[];
}

/** Orders already reported in this browser, so a refresh cannot double-count. */
const STORAGE_KEY = "reported_purchases_v1";

function alreadyReported(orderNumber: string): boolean {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (list.includes(orderNumber)) return true;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...list, orderNumber].slice(-20)));
    return false;
  } catch {
    // Storage unavailable. Reporting once per page load is better than not at
    // all — Google also deduplicates on transaction_id.
    return false;
  }
}

/**
 * Fires the purchase conversion on the order confirmation page.
 *
 * Values come from the server-rendered order record, not from the cart the
 * browser had a moment ago: the order is the only place where the amount
 * actually charged is recorded, and reporting anything else corrupts ROAS.
 *
 * Deduplicated on order number, because customers bookmark, refresh and
 * back-button onto this page, and each of those would otherwise be counted as
 * another sale.
 */
export function PurchaseTracker({
  orderNumber,
  value,
  currency,
  tax,
  shipping,
  coupon,
  items,
}: PurchaseTrackerProps) {
  useEffect(() => {
    if (alreadyReported(orderNumber)) return;

    AnalyticsService.track("purchase", {
      transaction_id: orderNumber,
      value,
      currency,
      tax,
      shipping,
      coupon: coupon || undefined,
      items,
    });

    // Google Ads needs its own conversion hit; a GA4 purchase alone does not
    // populate the Ads conversion column that bidding runs on.
    AnalyticsService.trackAdsConversion(orderNumber, value, currency);
  }, [orderNumber, value, currency, tax, shipping, coupon, items]);

  return null;
}
