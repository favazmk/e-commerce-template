import { RepositoryFactory } from "@/repositories/repository.factory";
import { SettingsService } from "@/services/settings.service";
import { ShippingService } from "@/services/shipping.service";
import { formatPrice } from "@/lib/config/store.config";
import type { DeliveryOption } from "@/components/storefront/DeliveryEstimate";

/**
 * Storefront-wide commerce facts, assembled once per page.
 *
 * Everything here comes from merchant settings rather than hard-coded copy, so
 * the same template serves a store with 30-day free returns and one with none
 * without either of them shipping a claim that is not true of them.
 */

export interface StorefrontOffer {
  code: string;
  description: string;
}

export interface StorefrontCommerceInfo {
  shippingOptions: DeliveryOption[];
  returnWindowDays: number;
  taxNote: string;
  nonWorkingDays?: number[];
  offers: StorefrontOffer[];
  /** Cart subtotal that unlocks free delivery, when any method offers it. */
  freeShippingThreshold: number | null;
}

export class StorefrontService {
  /**
   * Coupon codes the merchant has chosen to advertise.
   *
   * Deliberately an explicit allowlist rather than "every active coupon". A
   * store's coupon table normally holds targeted codes — a win-back offer, a
   * single influencer's code, a goodwill gesture to one customer. Publishing
   * the whole table on every product page would hand all of them to everyone
   * and turn a targeted discount into a permanent price cut.
   *
   * Promote codes in Admin → Settings under `growth.promoted_coupons`.
   */
  static async getPublicOffers(): Promise<StorefrontOffer[]> {
    try {
      const growth = await SettingsService.getSettingCategory("growth");
      const promoted: string[] = Array.isArray(growth.promoted_coupons)
        ? growth.promoted_coupons
        : [];

      if (promoted.length === 0) return [];

      const repo = RepositoryFactory.getCouponRepository();
      const now = Date.now();
      const offers: StorefrontOffer[] = [];

      for (const code of promoted.slice(0, 5)) {
        const coupon = await repo.findByCode(String(code).trim().toUpperCase());

        // Re-check validity rather than trusting the settings list: an expired
        // or exhausted code advertised on the product page is a broken promise
        // discovered at checkout, which costs more than showing nothing.
        if (!coupon || !coupon.is_active) continue;
        if (coupon.start_date && new Date(coupon.start_date).getTime() > now) continue;
        if (coupon.end_date && new Date(coupon.end_date).getTime() < now) continue;
        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) continue;

        offers.push({ code: coupon.code, description: describeCoupon(coupon) });
      }

      return offers;
    } catch (error) {
      console.error("[storefront] Could not resolve public offers:", error);
      return [];
    }
  }

  /** Everything the product page and cart need in order to make real claims. */
  static async getCommerceInfo(): Promise<StorefrontCommerceInfo> {
    const [methods, taxSettings, generalSettings, offers] = await Promise.all([
      ShippingService.getShippingMethods(),
      SettingsService.getSettingCategory("tax"),
      SettingsService.getSettingCategory("general"),
      this.getPublicOffers(),
    ]);

    const shippingOptions: DeliveryOption[] = methods.map((method) => ({
      id: method.id,
      name: method.name,
      rate: Number(method.rate),
      estimated_days: method.estimated_days,
      free_threshold: method.free_threshold,
    }));

    const thresholds = shippingOptions
      .map((option) => option.free_threshold)
      .filter((value): value is number => typeof value === "number" && value > 0);

    return {
      shippingOptions,
      // A store with no returns policy configured says nothing, rather than
      // implying a window it has not committed to.
      returnWindowDays: Number(generalSettings.return_window_days) || 0,
      taxNote: taxSettings.enabled
        ? taxSettings.is_inclusive
          ? `Inclusive of ${taxSettings.tax_name || "tax"}`
          : `Excluding ${taxSettings.tax_name || "tax"}, calculated at checkout`
        : "",
      nonWorkingDays: Array.isArray(generalSettings.courier_non_working_days)
        ? generalSettings.courier_non_working_days.map(Number)
        : undefined,
      offers,
      freeShippingThreshold: thresholds.length > 0 ? Math.min(...thresholds) : null,
    };
  }
}

/** Human-readable summary of what a coupon actually does. */
function describeCoupon(coupon: {
  discount_type: string;
  discount_value: number;
  min_order_value?: number | null;
  max_discount_amount?: number | null;
}): string {
  const amount =
    coupon.discount_type === "percentage"
      ? `${Number(coupon.discount_value)}% off`
      : `${formatPrice(Number(coupon.discount_value))} off`;

  const conditions: string[] = [];
  if (coupon.min_order_value && coupon.min_order_value > 0) {
    conditions.push(`on orders over ${formatPrice(Number(coupon.min_order_value))}`);
  }
  if (coupon.discount_type === "percentage" && coupon.max_discount_amount) {
    conditions.push(`up to ${formatPrice(Number(coupon.max_discount_amount))}`);
  }

  return conditions.length > 0 ? `${amount} ${conditions.join(", ")}` : amount;
}
