export interface AnalyticsEvent {
  event:
    | "view_item"
    | "view_item_list"
    | "select_item"
    | "add_to_cart"
    | "remove_from_cart"
    | "view_cart"
    | "begin_checkout"
    | "add_shipping_info"
    | "add_payment_info"
    | "purchase"
    | "search";
  data?: Record<string, any>;
}

export class AnalyticsService {
  /**
   * Client-side event dispatcher supporting GA4, Meta Pixel, and GTM dataLayer
   */
  static track(event: AnalyticsEvent["event"], data?: Record<string, any>): void {
    if (typeof window === "undefined") return;

    // 1. Google Tag Manager / GA4 dataLayer
    const w = window as any;
    if (w.dataLayer) {
      w.dataLayer.push({
        event,
        ecommerce: data,
      });
    }

    // 2. Meta Pixel fbq
    if (w.fbq) {
      if (event === "purchase") {
        w.fbq("track", "Purchase", { value: data?.value, currency: data?.currency || "USD" });
      } else if (event === "add_to_cart") {
        w.fbq("track", "AddToCart", { content_ids: data?.items?.map((i: any) => i.item_id) });
      }
    }

    // 3. Debug logging in non-production
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Analytics] Tracked Event: ${event}`, data);
    }
  }
}
