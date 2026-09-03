/**
 * Client-side analytics dispatcher.
 *
 * One call site, three destinations: the GTM/GA4 dataLayer, gtag (for GA4 and
 * Google Ads conversions) and the Meta Pixel. Components should never talk to
 * `window.gtag` or `window.fbq` directly — a tag swap would then mean editing
 * every component instead of this file.
 *
 * Consent is enforced by Google Consent Mode rather than by suppressing calls
 * here: with `analytics_storage` denied, Google receives a cookieless ping it
 * can model from, which is what keeps conversion reporting usable for the
 * visitors who declined. See features/consent/ConsentContext.
 */

/** GA4 recommended e-commerce item shape. */
export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity: number;
}

export interface AnalyticsPayload {
  currency?: string;
  value?: number;
  items?: AnalyticsItem[];
  transaction_id?: string;
  coupon?: string;
  shipping?: number;
  tax?: number;
  search_term?: string;
  item_list_name?: string;
  [key: string]: unknown;
}

export type AnalyticsEventName =
  | "view_item"
  | "view_item_list"
  | "select_item"
  | "add_to_cart"
  | "remove_from_cart"
  | "add_to_wishlist"
  | "view_cart"
  | "begin_checkout"
  | "add_shipping_info"
  | "add_payment_info"
  | "purchase"
  | "sign_up"
  | "search";

/** GA4 event name -> Meta Pixel standard event name. */
const META_EVENT_MAP: Partial<Record<AnalyticsEventName, string>> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  add_to_wishlist: "AddToWishlist",
  begin_checkout: "InitiateCheckout",
  add_payment_info: "AddPaymentInfo",
  purchase: "Purchase",
  search: "Search",
  sign_up: "CompleteRegistration",
};

interface AnalyticsWindow extends Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
}

export class AnalyticsService {
  static track(event: AnalyticsEventName, data: AnalyticsPayload = {}): void {
    if (typeof window === "undefined") return;
    const w = window as AnalyticsWindow;

    // 1. GTM dataLayer. `ecommerce: null` first is required by Google's own
    //    guidance — without it the previous event's items leak into this one.
    if (w.dataLayer) {
      w.dataLayer.push({ ecommerce: null });
      w.dataLayer.push({ event, ecommerce: data });
    }

    // 2. gtag (GA4 direct, when GTM is not in use)
    if (typeof w.gtag === "function") {
      w.gtag("event", event, data);
    }

    // 3. Meta Pixel
    if (typeof w.fbq === "function") {
      const metaEvent = META_EVENT_MAP[event];
      if (metaEvent) {
        w.fbq("track", metaEvent, {
          value: data.value,
          currency: data.currency,
          content_type: "product",
          content_ids: data.items?.map((item) => item.item_id),
          contents: data.items?.map((item) => ({
            id: item.item_id,
            quantity: item.quantity,
            item_price: item.price,
          })),
          ...(data.search_term ? { search_string: data.search_term } : {}),
        });
      }
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[Analytics] ${event}`, data);
    }
  }

  /**
   * Report a completed purchase as a Google Ads conversion.
   *
   * Separate from `track('purchase')` because Ads needs a `send_to` naming the
   * specific conversion action; a GA4 purchase event alone will not populate
   * the Ads conversion column, which is the number campaign bidding runs on.
   *
   * Configure `NEXT_PUBLIC_GOOGLE_ADS_ID` (AW-XXXXXXXXX) and
   * `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL` (from the conversion action).
   */
  static trackAdsConversion(orderNumber: string, value: number, currency: string): void {
    if (typeof window === "undefined") return;

    const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();
    const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL?.trim();
    if (!adsId || !label) return;

    const gtag = (window as AnalyticsWindow).gtag;
    if (typeof gtag !== "function") return;

    gtag("event", "conversion", {
      send_to: `${adsId}/${label}`,
      value,
      currency,
      // The order number deduplicates the conversion when a customer refreshes
      // the confirmation page, which would otherwise inflate reported revenue.
      transaction_id: orderNumber,
    });
  }
}

/** Map a catalog product (and optional variant) onto a GA4 item. */
export function toAnalyticsItem(
  product: {
    id: string;
    name: string;
    brand?: string | null;
    price: number;
    category?: { name: string } | null;
  },
  quantity = 1,
  variant?: { id: string; price: number; attributes?: Record<string, string> } | null
): AnalyticsItem {
  return {
    item_id: product.id,
    item_name: product.name,
    item_brand: product.brand || undefined,
    item_category: product.category?.name || undefined,
    item_variant: variant ? Object.values(variant.attributes || {}).join(" / ") || variant.id : undefined,
    price: Number(variant?.price ?? product.price),
    quantity,
  };
}
