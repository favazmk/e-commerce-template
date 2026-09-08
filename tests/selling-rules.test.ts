import { describe, expect, it } from "vitest";
import {
  cartRequiresShipping,
  cartWeightGrams,
  checkAvailability,
  effectivePrice,
  isPublished,
  isSaleWindowActive,
  scheduledPublishAt,
  selectableQuantities,
  type SellableProduct,
  type SellableVariant,
} from "../src/lib/commerce/selling-rules";

const HOUR = 60 * 60 * 1000;

function product(overrides: Partial<SellableProduct> = {}): SellableProduct {
  return {
    price: 100,
    compare_at_price: null,
    stock_quantity: 10,
    status: "active",
    ...overrides,
  };
}

function variant(overrides: Partial<SellableVariant> = {}): SellableVariant {
  return { price: 100, stock: 10, is_active: true, ...overrides };
}

describe("isSaleWindowActive", () => {
  const now = new Date("2026-06-01T12:00:00Z");

  it("is inactive with no sale price, whatever the dates say", () => {
    expect(
      isSaleWindowActive(
        product({ sale_starts_at: "2026-05-01T00:00:00Z", sale_ends_at: "2026-07-01T00:00:00Z" }),
        now
      )
    ).toBe(false);
  });

  it("is active for an open-ended sale in both directions", () => {
    expect(isSaleWindowActive(product({ sale_price: 80 }), now)).toBe(true);
    expect(
      isSaleWindowActive(product({ sale_price: 80, sale_starts_at: "2026-05-01T00:00:00Z" }), now)
    ).toBe(true);
    expect(
      isSaleWindowActive(product({ sale_price: 80, sale_ends_at: "2026-07-01T00:00:00Z" }), now)
    ).toBe(true);
  });

  it("has not started before the start date", () => {
    expect(
      isSaleWindowActive(product({ sale_price: 80, sale_starts_at: "2026-06-02T00:00:00Z" }), now)
    ).toBe(false);
  });

  it("ends at the end date without anyone restoring the price", () => {
    expect(
      isSaleWindowActive(product({ sale_price: 80, sale_ends_at: "2026-06-01T11:00:00Z" }), now)
    ).toBe(false);
  });
});

describe("effectivePrice", () => {
  const now = new Date("2026-06-01T12:00:00Z");

  it("charges the regular price outside a sale window", () => {
    const result = effectivePrice(
      product({ sale_price: 80, sale_starts_at: "2026-06-05T00:00:00Z" }),
      null,
      now
    );
    expect(result.price).toBe(100);
    expect(result.onSale).toBe(false);
  });

  it("charges the sale price inside the window and strikes the regular one", () => {
    const result = effectivePrice(product({ sale_price: 75 }), null, now);
    expect(result.price).toBe(75);
    expect(result.compareAtPrice).toBe(100);
    expect(result.onSale).toBe(true);
    expect(result.discountPercent).toBe(25);
  });

  it("uses the variant price when there is a variant", () => {
    expect(effectivePrice(product(), variant({ price: 140 }), now).price).toBe(140);
  });

  it("never applies a product markdown to a differently-priced variant", () => {
    // The product is 100 marked down to 60. The variant sells at 500 and has no
    // markdown of its own; inheriting 60 would be a catastrophic mispricing.
    const result = effectivePrice(product({ sale_price: 60 }), variant({ price: 500 }), now);
    expect(result.price).toBe(500);
    expect(result.onSale).toBe(false);
  });

  it("honours a variant's own sale price during the product's window", () => {
    const result = effectivePrice(
      product({ sale_price: 60 }),
      variant({ price: 500, sale_price: 400 }),
      now
    );
    expect(result.price).toBe(400);
    expect(result.compareAtPrice).toBe(500);
  });

  it("ignores a variant sale price when the window is closed", () => {
    const result = effectivePrice(
      product({ sale_price: 60, sale_ends_at: "2026-05-01T00:00:00Z" }),
      variant({ price: 500, sale_price: 400 }),
      now
    );
    expect(result.price).toBe(500);
  });

  it("shows one comparison price, not two", () => {
    // A merchant-set compare-at of 150 and a live sale would otherwise both
    // want to be the struck-through figure.
    const result = effectivePrice(product({ compare_at_price: 150, sale_price: 75 }), null, now);
    expect(result.compareAtPrice).toBe(100);
  });

  it("drops a compare-at that is not above the price", () => {
    expect(effectivePrice(product({ compare_at_price: 90 }), null, now).compareAtPrice).toBeNull();
  });
});

describe("isPublished / scheduledPublishAt", () => {
  const now = new Date("2026-06-01T12:00:00Z");

  it("treats a null publish date as live, so old rows keep working", () => {
    expect(isPublished(product({ published_at: null }), now)).toBe(true);
  });

  it("hides an active product whose launch time has not arrived", () => {
    const scheduled = product({ published_at: "2026-06-02T09:00:00Z" });
    expect(isPublished(scheduled, now)).toBe(false);
    expect(scheduledPublishAt(scheduled, now)).toEqual(new Date("2026-06-02T09:00:00Z"));
  });

  it("shows it once the time passes, with no further action", () => {
    const launched = product({ published_at: "2026-06-01T09:00:00Z" });
    expect(isPublished(launched, now)).toBe(true);
    expect(scheduledPublishAt(launched, now)).toBeNull();
  });

  it("never publishes a draft, whatever the date", () => {
    expect(isPublished(product({ status: "draft", published_at: "2020-01-01T00:00:00Z" }), now)).toBe(
      false
    );
  });
});

describe("checkAvailability", () => {
  it("allows a purchase within stock", () => {
    const result = checkAvailability(product({ stock_quantity: 5 }), null, 3);
    expect(result.purchasable).toBe(true);
    expect(result.adjustedQuantity).toBe(3);
    expect(result.backordered).toBe(false);
  });

  it("refuses more than the stock when backorders are off", () => {
    const result = checkAvailability(product({ stock_quantity: 2 }), null, 5, "Coat");
    expect(result.purchasable).toBe(false);
    expect(result.reason).toContain("Available: 2");
  });

  it("accepts the order as a backorder when the policy allows it", () => {
    const result = checkAvailability(
      product({ stock_quantity: 0, inventory_policy: "continue" }),
      null,
      3,
      "Coat"
    );
    expect(result.purchasable).toBe(true);
    expect(result.backordered).toBe(true);
    expect(result.reason).toContain("backorder");
  });

  it("ignores stock entirely when inventory is not tracked", () => {
    const result = checkAvailability(
      product({ stock_quantity: 0, track_inventory: false }),
      null,
      99
    );
    expect(result.purchasable).toBe(true);
    expect(result.backordered).toBe(false);
  });

  it("raises a quantity to the minimum and says so", () => {
    const result = checkAvailability(product({ min_purchase_quantity: 2 }), null, 1, "Socks");
    expect(result.adjustedQuantity).toBe(2);
    expect(result.reason).toContain("minimum");
  });

  it("caps a quantity at the per-order maximum and says so", () => {
    const result = checkAvailability(product({ max_purchase_quantity: 3 }), null, 10, "Drop");
    expect(result.adjustedQuantity).toBe(3);
    expect(result.reason).toContain("Limited to 3");
  });

  it("refuses an unpublished product", () => {
    const result = checkAvailability(product({ status: "draft" }), null, 1, "Coat");
    expect(result.purchasable).toBe(false);
  });

  it("refuses a deactivated variant", () => {
    const result = checkAvailability(product(), variant({ is_active: false }), 1, "Coat");
    expect(result.purchasable).toBe(false);
  });

  it("refuses a nonsense quantity rather than coercing it", () => {
    expect(checkAvailability(product(), null, 0).purchasable).toBe(false);
    expect(checkAvailability(product(), null, Number.NaN).purchasable).toBe(false);
  });
});

describe("selectableQuantities", () => {
  it("never offers a quantity the cart would reject", () => {
    expect(selectableQuantities(product({ stock_quantity: 3 }))).toEqual([1, 2, 3]);
  });

  it("starts at the minimum", () => {
    expect(selectableQuantities(product({ min_purchase_quantity: 2, stock_quantity: 4 }))).toEqual([
      2, 3, 4,
    ]);
  });

  it("respects the per-order maximum before the stock level", () => {
    expect(
      selectableQuantities(product({ max_purchase_quantity: 2, stock_quantity: 50 }))
    ).toEqual([1, 2]);
  });

  it("is not limited by stock when backorders are allowed", () => {
    const quantities = selectableQuantities(
      product({ stock_quantity: 0, inventory_policy: "continue" }),
      null,
      4
    );
    expect(quantities).toEqual([1, 2, 3, 4]);
  });
});

describe("cartRequiresShipping", () => {
  it("charges delivery when any line is physical", () => {
    expect(
      cartRequiresShipping([{ requires_shipping: false }, { requires_shipping: true }])
    ).toBe(true);
  });

  it("charges nothing for a cart of downloads and services", () => {
    expect(
      cartRequiresShipping([{ requires_shipping: false }, { requires_shipping: false }])
    ).toBe(false);
  });

  it("treats an unspecified line as physical, which is the safe default", () => {
    expect(cartRequiresShipping([{}])).toBe(true);
  });

  it("does not skip delivery for an empty cart", () => {
    expect(cartRequiresShipping([])).toBe(true);
  });
});

describe("cartWeightGrams", () => {
  it("multiplies by quantity and ignores weightless lines", () => {
    expect(
      cartWeightGrams([
        { weight_grams: 500, quantity: 2 },
        { weight_grams: null, quantity: 3 },
        { weight_grams: 250, quantity: 1 },
      ])
    ).toBe(1250);
  });
});

describe("sale windows in real time", () => {
  it("expires on its own between two calls", () => {
    const endsAt = new Date(Date.now() + HOUR).toISOString();
    const item = product({ sale_price: 50, sale_ends_at: endsAt });

    expect(effectivePrice(item).price).toBe(50);
    expect(effectivePrice(item, null, new Date(Date.now() + 2 * HOUR)).price).toBe(100);
  });
});
