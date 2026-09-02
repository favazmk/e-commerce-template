import { RepositoryFactory } from "@/repositories/repository.factory";
import { Coupon } from "@/types/database";
import { formatPrice } from "@/lib/config/store.config";

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
        error: `Minimum order value of ${formatPrice(coupon.min_order_value)} required for this coupon`,
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
   * Admin: list every coupon, active or not.
   */
  static async listCoupons(): Promise<Coupon[]> {
    const repo = RepositoryFactory.getCouponRepository();
    return await repo.findAll();
  }

  /**
   * Admin: read one coupon by id.
   */
  static async getCouponById(id: string): Promise<Coupon | null> {
    const repo = RepositoryFactory.getCouponRepository();
    return await repo.findById(id);
  }

  /**
   * Admin: create a coupon.
   */
  static async createCoupon(data: Partial<Coupon>): Promise<Coupon> {
    const code = String(data.code || "").trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
      throw new Error("Coupon code must be 3-32 characters: letters, numbers, hyphen or underscore.");
    }

    const discountType = data.discount_type === "fixed" ? "fixed" : "percentage";
    const value = Number(data.discount_value);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("Discount value must be greater than zero.");
    }
    if (discountType === "percentage" && value > 100) {
      throw new Error("A percentage discount cannot exceed 100%.");
    }

    const repo = RepositoryFactory.getCouponRepository();
    return await repo.create({
      code,
      discount_type: discountType,
      discount_value: value,
      min_order_value: Number(data.min_order_value) || 0,
      max_discount_amount:
        data.max_discount_amount != null && data.max_discount_amount !== ("" as any)
          ? Number(data.max_discount_amount)
          : null,
      usage_limit:
        data.usage_limit != null && data.usage_limit !== ("" as any) ? Number(data.usage_limit) : null,
      per_customer_limit: Number(data.per_customer_limit) || 1,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    });
  }

  /**
   * Admin: update a coupon, including activating or deactivating it.
   */
  static async updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon | null> {
    if (data.discount_value !== undefined) {
      const value = Number(data.discount_value);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("Discount value must be greater than zero.");
      }
      if ((data.discount_type ?? "percentage") === "percentage" && value > 100) {
        throw new Error("A percentage discount cannot exceed 100%.");
      }
    }

    const repo = RepositoryFactory.getCouponRepository();
    return await repo.update(id, data);
  }

  /**
   * Admin: permanently delete a coupon.
   *
   * Deactivating is usually the better move — it keeps the code unusable while
   * preserving the usage history attached to past orders.
   */
  static async deleteCoupon(id: string): Promise<boolean> {
    const repo = RepositoryFactory.getCouponRepository();
    return await repo.delete(id);
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
