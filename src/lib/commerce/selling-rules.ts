/**
 * The selling rules of the catalogue: what a product costs right now, whether
 * it can be bought right now, and how many of it.
 *
 * These three questions used to be answered inline, in several places, from
 * raw columns — `product.price`, `stock >= quantity`. That was fine while the
 * only answer was "the price is the price". With scheduled sales, backorders,
 * purchase limits and scheduled publishing, the same three questions now have
 * conditional answers, and every caller that computes them independently is a
 * chance for the cart to disagree with the product page.
 *
 * So they live here once, are pure, and are used by the storefront for display
 * and by CartService for the authoritative server-side recalculation. The
 * storefront may be wrong; the cart may not.
 */

import type { Product, ProductVariant } from "@/types/database";

/** The subset of a product these rules read. Keeps callers free to pass rows. */
export type SellableProduct = Pick<
  Product,
  "price" | "compare_at_price" | "stock_quantity" | "status"
> &
  Partial<
    Pick<
      Product,
      | "sale_price"
      | "sale_starts_at"
      | "sale_ends_at"
      | "published_at"
      | "track_inventory"
      | "inventory_policy"
      | "min_purchase_quantity"
      | "max_purchase_quantity"
      | "requires_shipping"
    >
  >;

export type SellableVariant = Pick<ProductVariant, "price" | "stock"> &
  Partial<Pick<ProductVariant, "compare_at_price" | "sale_price" | "is_active">>;

// ---------------------------------------------------------------------------
// Sale windows
// ---------------------------------------------------------------------------

/**
 * Is the product's scheduled markdown live at `now`?
 *
 * An open-ended window is legitimate in both directions: no start means "on
 * sale until the end date", no end means "on sale from the start date, until I
 * say otherwise". Both are things merchants actually do.
 */
export function isSaleWindowActive(product: SellableProduct, now: Date = new Date()): boolean {
  if (product.sale_price == null) return false;

  const startsAt = product.sale_starts_at ? new Date(product.sale_starts_at) : null;
  const endsAt = product.sale_ends_at ? new Date(product.sale_ends_at) : null;

  if (startsAt && now < startsAt) return false;
  if (endsAt && now >= endsAt) return false;

  return true;
}

export interface EffectivePrice {
  /** What the shopper is charged, per unit. */
  price: number;
  /** The struck-through figure, or null when there is nothing to strike. */
  compareAtPrice: number | null;
  /** True when the price comes from a live scheduled sale. */
  onSale: boolean;
  discountPercent: number;
}

/**
 * The price actually charged for a product, or for one of its variants.
 *
 * Precedence, highest first:
 *   1. A live scheduled sale price (variant's own, else the product's).
 *   2. The variant's price.
 *   3. The product's price.
 *
 * The regular price becomes the compare-at figure during a sale, which is why
 * `price` is never overwritten when a markdown starts: when the window closes,
 * the correct price is already sitting there.
 */
export function effectivePrice(
  product: SellableProduct,
  variant?: SellableVariant | null,
  now: Date = new Date()
): EffectivePrice {
  const regular = Number(variant?.price ?? product.price);
  const saleActive = isSaleWindowActive(product, now);

  // A variant may carry its own markdown; without one it inherits the
  // product's, but only when it also inherits the product's regular price —
  // applying a 50 AED product markdown to a 500 AED variant would be a
  // catastrophic mispricing rather than a discount.
  const variantSale = variant?.sale_price != null ? Number(variant.sale_price) : null;
  const inheritedSale =
    variant == null && product.sale_price != null ? Number(product.sale_price) : null;
  const saleAmount = variantSale ?? inheritedSale;

  const usingSale = saleActive && saleAmount != null && saleAmount < regular;
  const price = usingSale ? saleAmount! : regular;

  // During a sale the regular price is the honest comparison. Outside one, the
  // merchant-set compare-at applies — never both, or the shopper sees two
  // different "was" prices for the same item.
  const listed = usingSale
    ? regular
    : variant?.compare_at_price != null
      ? Number(variant.compare_at_price)
      : product.compare_at_price != null
        ? Number(product.compare_at_price)
        : null;

  const compareAtPrice = listed != null && listed > price ? listed : null;

  return {
    price,
    compareAtPrice,
    onSale: usingSale,
    // Rounded down so a 49.6% saving never advertises itself as "50% off".
    discountPercent: compareAtPrice
      ? Math.floor(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0,
  };
}

// ---------------------------------------------------------------------------
// Publication
// ---------------------------------------------------------------------------

/**
 * Is this product visible to shoppers right now?
 *
 * Active but not yet published is a real and useful state: the product is
 * finished, approved and waiting for its launch time. Treating it as visible
 * would leak a drop early; treating it as a draft would make it invisible to
 * the merchant's own "scheduled" filter.
 */
export function isPublished(product: SellableProduct, now: Date = new Date()): boolean {
  if (product.status !== "active") return false;
  if (!product.published_at) return true;
  return new Date(product.published_at) <= now;
}

/** The launch time of a product that is approved but not yet live, else null. */
export function scheduledPublishAt(product: SellableProduct, now: Date = new Date()): Date | null {
  if (product.status !== "active" || !product.published_at) return null;
  const publishAt = new Date(product.published_at);
  return publishAt > now ? publishAt : null;
}

// ---------------------------------------------------------------------------
// Availability and purchase limits
// ---------------------------------------------------------------------------

export interface AvailabilityCheck {
  /** Can the requested quantity be added to a cart? */
  purchasable: boolean;
  /** Set when the quantity had to be corrected rather than refused. */
  adjustedQuantity: number;
  /** Shopper-facing explanation, or null when nothing is wrong. */
  reason: string | null;
  /** True when the sale is only possible because backorders are allowed. */
  backordered: boolean;
}

/**
 * Whether `quantity` of this product can be bought, honouring stock tracking,
 * inventory policy and the merchant's purchase limits.
 *
 * Note what this deliberately does not do: it never silently reduces a
 * quantity below the minimum, and it never invents stock. A shopper who asked
 * for 10 of something limited to 5 gets 5 and is told; a shopper who asked for
 * 10 of something with 3 in stock and backorders off gets a refusal, not a
 * quietly amended basket.
 */
export function checkAvailability(
  product: SellableProduct,
  variant: SellableVariant | null | undefined,
  quantity: number,
  productName = "This item"
): AvailabilityCheck {
  const ok = (adjustedQuantity: number, backordered = false): AvailabilityCheck => ({
    purchasable: true,
    adjustedQuantity,
    reason: null,
    backordered,
  });
  const no = (reason: string): AvailabilityCheck => ({
    purchasable: false,
    adjustedQuantity: 0,
    reason,
    backordered: false,
  });

  if (!isPublished(product)) {
    return no(`"${productName}" is no longer available.`);
  }

  if (variant && variant.is_active === false) {
    return no(`The selected option for "${productName}" is no longer available.`);
  }

  const min = Math.max(1, Number(product.min_purchase_quantity ?? 1));
  const max = product.max_purchase_quantity != null ? Number(product.max_purchase_quantity) : null;

  let requested = Math.floor(Number(quantity));
  if (!Number.isFinite(requested) || requested <= 0) {
    return no(`Enter a valid quantity for "${productName}".`);
  }

  if (requested < min) {
    return {
      purchasable: true,
      adjustedQuantity: min,
      reason: `"${productName}" is sold in minimum quantities of ${min}.`,
      backordered: false,
    };
  }

  if (max != null && requested > max) {
    return {
      purchasable: true,
      adjustedQuantity: max,
      reason: `Limited to ${max} per order for "${productName}".`,
      backordered: false,
    };
  }

  // Untracked stock means the merchant is asserting they can always fulfil —
  // a print-on-demand line, a service, a digital download. Stock arithmetic
  // does not apply to it at all.
  if (product.track_inventory === false) return ok(requested);

  const available = Number(variant ? variant.stock : product.stock_quantity);
  if (available >= requested) return ok(requested);

  if (product.inventory_policy === "continue") {
    // Backorder: accepted, and the shopper is told so rather than discovering
    // it from a late dispatch email.
    return {
      purchasable: true,
      adjustedQuantity: requested,
      reason:
        available > 0
          ? `Only ${available} of "${productName}" are in stock; the rest will follow on backorder.`
          : `"${productName}" is on backorder and will ship when restocked.`,
      backordered: true,
    };
  }

  if (available <= 0) return no(`"${productName}" is out of stock.`);

  return no(
    `Insufficient stock for "${productName}". Available: ${available}, in cart: ${requested}`
  );
}

/**
 * The quantities a shopper may pick on a product page.
 *
 * Capped so the selector cannot offer a number the cart will then reject.
 */
export function selectableQuantities(
  product: SellableProduct,
  variant?: SellableVariant | null,
  ceiling = 10
): number[] {
  const min = Math.max(1, Number(product.min_purchase_quantity ?? 1));
  const stockCap =
    product.track_inventory === false || product.inventory_policy === "continue"
      ? Infinity
      : Number(variant ? variant.stock : product.stock_quantity);

  const max = Math.min(
    product.max_purchase_quantity != null ? Number(product.max_purchase_quantity) : Infinity,
    stockCap,
    min + ceiling - 1
  );

  const quantities: number[] = [];
  for (let q = min; q <= max; q += 1) quantities.push(q);
  return quantities;
}

/**
 * A cart of only non-shippable lines (downloads, services, gift cards) must not
 * be charged delivery. Woo calls these virtual products; the distinction is
 * invisible until a customer is billed 25 AED to deliver a PDF.
 */
export function cartRequiresShipping(
  lines: Array<{ requires_shipping?: boolean | null }>
): boolean {
  if (lines.length === 0) return true;
  return lines.some((line) => line.requires_shipping !== false);
}

/** Total shipping weight in grams, for carrier rates and packing slips. */
export function cartWeightGrams(
  lines: Array<{ weight_grams?: number | null; quantity: number }>
): number {
  return lines.reduce(
    (total, line) => total + (Number(line.weight_grams) || 0) * Math.max(0, line.quantity),
    0
  );
}
