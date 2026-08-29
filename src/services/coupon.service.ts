import { RepositoryFactory } from "@/repositories/repository.factory";
import { Coupon } from "@/types/database";

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  error?: string;
}

export class CouponService {
  /**
   * Validate a coupon code against a cart and subtotal
   */
  static async validateCoupon(
    code: string,
    subtotal: number,
    userId?: string,
    cartItemProductIds: string[] = []
  ): Promise<CouponValidationResult> {
    if (!code || !code.trim()) {
      return { isValid: false, discountAmount: 0, error: "Please enter a coupon code" };
    }

    const normalizedCode = code.trim().toUpperCase();
    const repo = RepositoryFactory.getCouponRepository();
    const coupon = await repo.findByCode(normalizedCode);

    if (!coupon || !coupon.is_active) {
      return { isValid: false, discountAmount: 0, error: "Invalid or inactive coupon code" };
    }

    const now = new Date();

    // Check Start Date
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return { isValid: false, discountAmount: 0, error: "This coupon is not active yet" };
    }

    // Check End Date
    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return { isValid: false, discountAmount: 0, error: "This coupon has expired" };
    }

    // Check Usage Limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { isValid: false, discountAmount: 0, error: "This coupon has reached its usage limit" };
    }
    
    // Check Per Customer Limit
    const validForUser = await repo.validateCouponForUser(coupon.id, userId);
    if (!validForUser) {
      return { isValid: false, discountAmount: 0, error: "You have reached the usage limit for this coupon" };
    }

    // Check Minimum Order Value
    if (coupon.min_order_value && subtotal < coupon.min_order_value) {
      return {
        isValid: false,
        discountAmount: 0,
        error: `Minimum order value of $${coupon.min_order_value} required for this coupon`,
      };
    }

    // Check Product Restrictions if configured
    if (coupon.product_ids && coupon.product_ids.length > 0) {
      const hasApplicableProduct = cartItemProductIds.some((pId) =>
        coupon.product_ids?.includes(pId)
      );
      if (!hasApplicableProduct) {
        return {
          isValid: false,
          discountAmount: 0,
          error: "This coupon does not apply to the items in your cart",
        };
      }
    }

    // Calculate Discount Amount
    let discountAmount = 0;
    if (coupon.discount_type === "percentage") {
      discountAmount = (subtotal * coupon.discount_value) / 100;
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else if (coupon.discount_type === "fixed") {
      discountAmount = Math.min(subtotal, coupon.discount_value);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      isValid: true,
      coupon,
      discountAmount,
    };
  }

  /**
   * Record coupon usage upon confirmed order
   */
  static async incrementUsage(code: string, userId?: string, orderId?: string): Promise<void> {
    const repo = RepositoryFactory.getCouponRepository();
    const coupon = await repo.findByCode(code);
    if (coupon) {
      await repo.recordUsage(coupon.id, userId, orderId);
    }
  }
}
