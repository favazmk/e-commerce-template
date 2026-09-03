/**
 * Presentation helpers for the persuasion layer of the storefront.
 *
 * The rule every function here follows: a claim shown to a shopper must be
 * derivable from a real row in the database. Scarcity that is not real
 * ("Only 2 left!" on infinite stock), invented view counts and countdowns that
 * reset on refresh are dark patterns — and under UAE Consumer Protection Law
 * and the EU UCPD they are also unlawful. Real numbers convert nearly as well
 * and carry no liability.
 */

import type { Product } from "@/types/database";
import type { ProductStats } from "@/repositories/interfaces/merchandising.repository.interface";

export interface PriceBreakdown {
  price: number;
  compareAtPrice: number | null;
  hasDiscount: boolean;
  discountPercent: number;
  savings: number;
}

export function priceBreakdown(
  price: number,
  compareAtPrice?: number | null
): PriceBreakdown {
  const listPrice = compareAtPrice != null ? Number(compareAtPrice) : null;
  const hasDiscount = listPrice != null && listPrice > price;

  return {
    price,
    compareAtPrice: listPrice,
    hasDiscount,
    // Rounded down, so a 49.6% saving never advertises itself as "50% off".
    discountPercent: hasDiscount ? Math.floor(((listPrice! - price) / listPrice!) * 100) : 0,
    savings: hasDiscount ? listPrice! - price : 0,
  };
}

/** A scarcity badge, or null when there is nothing truthful to say. */
export interface StockSignal {
  tone: "danger" | "warning" | "success";
  message: string;
}

export function stockSignal(product: Pick<Product, "stock_quantity" | "low_stock_threshold">): StockSignal | null {
  const stock = product.stock_quantity;
  if (stock <= 0) return null;

  // The merchant's own low-stock threshold decides what counts as scarce, so
  // a store selling one-off pieces and a store selling socks both read right.
  const threshold = product.low_stock_threshold || 5;

  if (stock <= Math.min(3, threshold)) {
    return {
      tone: "danger",
      message: stock === 1 ? "Last one left" : `Only ${stock} left`,
    };
  }
  if (stock <= threshold) {
    return { tone: "warning", message: `Only ${stock} left in stock` };
  }
  return null;
}

/**
 * Social proof drawn from real sales.
 *
 * Thresholds exist so the badge never undersells the product: "3 sold" reads
 * worse than no badge at all.
 */
export function salesProof(stats: ProductStats | null): string | null {
  if (!stats) return null;

  if (stats.units_sold_30d >= 10) {
    return `${formatCount(stats.units_sold_30d)} bought in the last 30 days`;
  }
  if (stats.units_sold >= 25) {
    return `${formatCount(stats.units_sold)} sold`;
  }
  return null;
}

function formatCount(value: number): string {
  if (value >= 10000) return `${Math.floor(value / 1000)}k+`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  // Round down to a round number so the figure reads as a claim, not a counter.
  if (value >= 100) return `${Math.floor(value / 50) * 50}+`;
  return String(value);
}

/**
 * How much more a shopper must add to qualify for free shipping.
 *
 * The most reliably effective nudge in e-commerce, because it is a genuine
 * saving the shopper controls — not manufactured pressure.
 */
export interface FreeShippingProgress {
  qualifies: boolean;
  threshold: number;
  remaining: number;
  /** 0–100, for a progress bar. */
  percent: number;
}

export function freeShippingProgress(
  subtotal: number,
  threshold: number | null | undefined
): FreeShippingProgress | null {
  if (!threshold || threshold <= 0) return null;

  const qualifies = subtotal >= threshold;
  return {
    qualifies,
    threshold,
    remaining: qualifies ? 0 : Math.max(0, threshold - subtotal),
    percent: Math.min(100, Math.round((subtotal / threshold) * 100)),
  };
}

/**
 * Delivery window as a pair of dates rather than "3-5 business days".
 *
 * "Arrives Tue 9 – Thu 11 Sep" removes the mental arithmetic and measurably
 * lifts conversion over a duration string. Weekends are skipped because
 * couriers do not deliver on them in most markets; the non-working days are
 * configurable so a store in a Sunday–Thursday working week reads correctly.
 */
export interface DeliveryWindow {
  earliest: Date;
  latest: Date;
  /** True when the whole window is one day, so the UI can say "Arrives Tue". */
  isSingleDay: boolean;
}

export interface DeliveryWindowOptions {
  /** Days before the parcel leaves the warehouse. */
  handlingDays?: number;
  /** Day numbers (0 = Sunday) couriers do not deliver on. */
  nonWorkingDays?: number[];
  /** Orders placed after this hour ship the next working day. */
  cutoffHour?: number;
  from?: Date;
}

export function estimateDeliveryWindow(
  minTransitDays: number,
  maxTransitDays: number,
  options: DeliveryWindowOptions = {}
): DeliveryWindow {
  const {
    handlingDays = 1,
    nonWorkingDays = [0, 6],
    cutoffHour = 14,
    from = new Date(),
  } = options;

  const start = new Date(from);
  // Past the cutoff, today no longer counts as a picking day.
  if (start.getHours() >= cutoffHour) start.setDate(start.getDate() + 1);

  const addWorkingDays = (base: Date, days: number): Date => {
    const result = new Date(base);
    let remaining = days;
    // Guard against a configuration where every day is non-working.
    let guard = 0;
    while (remaining > 0 && guard < 365) {
      result.setDate(result.getDate() + 1);
      guard += 1;
      if (!nonWorkingDays.includes(result.getDay())) remaining -= 1;
    }
    return result;
  };

  const dispatch = addWorkingDays(start, handlingDays);
  const earliest = addWorkingDays(dispatch, Math.max(0, minTransitDays));
  const latest = addWorkingDays(dispatch, Math.max(minTransitDays, maxTransitDays));

  return {
    earliest,
    latest,
    isSingleDay: earliest.toDateString() === latest.toDateString(),
  };
}

/** Parse "3-5 Business Days", "2 days", "Next day" into a transit day range. */
export function parseTransitDays(estimate: string | undefined | null): [number, number] {
  if (!estimate) return [3, 5];

  const text = estimate.toLowerCase();
  if (/next[- ]day|1 day|same[- ]day/.test(text)) return [1, 1];

  const numbers = text.match(/\d+/g);
  if (!numbers || numbers.length === 0) return [3, 5];

  const min = Number(numbers[0]);
  const max = numbers.length > 1 ? Number(numbers[1]) : min;
  return [Math.max(0, min), Math.max(min, max)];
}

export function formatDeliveryWindow(window: DeliveryWindow, locale?: string): string {
  const format = (date: Date) =>
    date.toLocaleDateString(locale || undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  if (window.isSingleDay) return format(window.earliest);
  return `${format(window.earliest)} – ${format(window.latest)}`;
}
