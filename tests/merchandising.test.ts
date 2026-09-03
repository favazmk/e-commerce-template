import { describe, expect, it } from "vitest";
import {
  estimateDeliveryWindow,
  formatDeliveryWindow,
  freeShippingProgress,
  parseTransitDays,
  priceBreakdown,
  salesProof,
  stockSignal,
} from "../src/lib/commerce/merchandising";

describe("priceBreakdown", () => {
  it("reports no discount when there is no list price", () => {
    const result = priceBreakdown(100);
    expect(result.hasDiscount).toBe(false);
    expect(result.discountPercent).toBe(0);
    expect(result.savings).toBe(0);
  });

  it("reports no discount when the list price is not higher", () => {
    // Bad data, not a markup: a compare-at below the selling price would
    // otherwise render as a negative saving.
    expect(priceBreakdown(100, 80).hasDiscount).toBe(false);
    expect(priceBreakdown(100, 100).hasDiscount).toBe(false);
  });

  it("computes the saving and percentage", () => {
    const result = priceBreakdown(75, 100);
    expect(result.hasDiscount).toBe(true);
    expect(result.discountPercent).toBe(25);
    expect(result.savings).toBe(25);
  });

  it("rounds the percentage down so it is never overstated", () => {
    // 49.6% must not advertise itself as "50% off" — that is a price claim.
    expect(priceBreakdown(50.4, 100).discountPercent).toBe(49);
  });
});

describe("stockSignal", () => {
  it("says nothing when stock is comfortable", () => {
    expect(stockSignal({ stock_quantity: 50, low_stock_threshold: 5 })).toBeNull();
  });

  it("says nothing when out of stock — that is the buy box's job", () => {
    expect(stockSignal({ stock_quantity: 0, low_stock_threshold: 5 })).toBeNull();
  });

  it("uses the merchant's own threshold rather than a fixed number", () => {
    // A store selling one-off pieces and one selling socks need different
    // definitions of "nearly gone".
    expect(stockSignal({ stock_quantity: 15, low_stock_threshold: 20 })?.tone).toBe("warning");
    expect(stockSignal({ stock_quantity: 15, low_stock_threshold: 5 })).toBeNull();
  });

  it("escalates to urgent for the last few", () => {
    expect(stockSignal({ stock_quantity: 1, low_stock_threshold: 5 })).toEqual({
      tone: "danger",
      message: "Last one left",
    });
    expect(stockSignal({ stock_quantity: 3, low_stock_threshold: 5 })?.tone).toBe("danger");
  });
});

describe("salesProof", () => {
  const base = { product_id: "p1", review_count: 0, average_rating: 0 };

  it("says nothing without stats", () => {
    expect(salesProof(null)).toBeNull();
  });

  it("stays quiet when the numbers would undersell the product", () => {
    // "3 sold" reads worse than no badge at all.
    expect(salesProof({ ...base, units_sold: 3, units_sold_30d: 3 })).toBeNull();
  });

  it("prefers recent momentum over lifetime totals", () => {
    const proof = salesProof({ ...base, units_sold: 900, units_sold_30d: 40 });
    expect(proof).toContain("30 days");
  });

  it("falls back to lifetime sales when recent volume is low", () => {
    const proof = salesProof({ ...base, units_sold: 300, units_sold_30d: 2 });
    expect(proof).toBe("300+ sold");
  });
});

describe("freeShippingProgress", () => {
  it("is absent when the merchant offers no threshold", () => {
    expect(freeShippingProgress(100, null)).toBeNull();
    expect(freeShippingProgress(100, 0)).toBeNull();
  });

  it("reports the exact shortfall", () => {
    const progress = freeShippingProgress(157.5, 200)!;
    expect(progress.qualifies).toBe(false);
    expect(progress.remaining).toBeCloseTo(42.5);
    expect(progress.percent).toBe(79);
  });

  it("qualifies at exactly the threshold", () => {
    const progress = freeShippingProgress(200, 200)!;
    expect(progress.qualifies).toBe(true);
    expect(progress.remaining).toBe(0);
    expect(progress.percent).toBe(100);
  });

  it("never reports more than 100 percent", () => {
    expect(freeShippingProgress(1000, 200)!.percent).toBe(100);
  });
});

describe("parseTransitDays", () => {
  it("reads a range", () => {
    expect(parseTransitDays("3-5 Business Days")).toEqual([3, 5]);
  });

  it("reads a single duration", () => {
    expect(parseTransitDays("2 days")).toEqual([2, 2]);
  });

  it("recognises next-day wording", () => {
    expect(parseTransitDays("Next day delivery")).toEqual([1, 1]);
    expect(parseTransitDays("Same-day")).toEqual([1, 1]);
  });

  it("falls back sensibly on unparseable or missing input", () => {
    expect(parseTransitDays(undefined)).toEqual([3, 5]);
    expect(parseTransitDays("soon-ish")).toEqual([3, 5]);
  });
});

describe("estimateDeliveryWindow", () => {
  it("skips non-working days", () => {
    // Friday 2026-01-02, before cutoff. One handling day lands on Monday the
    // 5th; two transit days land on Wednesday the 7th.
    const friday = new Date("2026-01-02T09:00:00");
    const window = estimateDeliveryWindow(2, 2, { from: friday, nonWorkingDays: [0, 6] });

    expect(window.earliest.getDay()).not.toBe(0);
    expect(window.earliest.getDay()).not.toBe(6);
    expect(window.isSingleDay).toBe(true);
  });

  it("pushes past the cutoff to the next day", () => {
    const morning = new Date("2026-01-05T09:00:00");
    const evening = new Date("2026-01-05T18:00:00");

    const early = estimateDeliveryWindow(2, 3, { from: morning, cutoffHour: 14 });
    const late = estimateDeliveryWindow(2, 3, { from: evening, cutoffHour: 14 });

    expect(late.earliest.getTime()).toBeGreaterThan(early.earliest.getTime());
  });

  it("honours a non-Saturday/Sunday working week", () => {
    // A Sunday-to-Thursday week: Friday and Saturday are the weekend.
    const window = estimateDeliveryWindow(1, 1, {
      from: new Date("2026-01-08T09:00:00"),
      nonWorkingDays: [5, 6],
    });
    expect([5, 6]).not.toContain(window.earliest.getDay());
  });

  it("terminates even if every day is configured as non-working", () => {
    // Guards against an infinite loop from a bad settings value.
    const window = estimateDeliveryWindow(2, 3, {
      from: new Date("2026-01-05T09:00:00"),
      nonWorkingDays: [0, 1, 2, 3, 4, 5, 6],
    });
    expect(window.earliest).toBeInstanceOf(Date);
  });

  it("never produces a latest date before the earliest", () => {
    // A misconfigured "5-2 days" must not render as a backwards range.
    const window = estimateDeliveryWindow(5, 2, { from: new Date("2026-01-05T09:00:00") });
    expect(window.latest.getTime()).toBeGreaterThanOrEqual(window.earliest.getTime());
  });
});

describe("formatDeliveryWindow", () => {
  it("collapses a single-day window to one date", () => {
    const window = estimateDeliveryWindow(2, 2, { from: new Date("2026-01-05T09:00:00") });
    expect(formatDeliveryWindow(window, "en-GB")).not.toContain("–");
  });

  it("renders a range as two dates", () => {
    const window = estimateDeliveryWindow(2, 5, { from: new Date("2026-01-05T09:00:00") });
    expect(formatDeliveryWindow(window, "en-GB")).toContain("–");
  });
});
