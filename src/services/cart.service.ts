import { RepositoryFactory } from "@/repositories/repository.factory";
import { CartCalculationResult } from "@/types/commerce";
import { CouponService } from "./coupon.service";
import { ShippingService } from "./shipping.service";
import { TaxService } from "./tax.service";

export interface CartItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export class CartService {
  /**
   * Recalculate cart totals, stock availability, discounts, taxes, and shipping on the server
   * NEVER trust client submitted amounts.
   */
  static async calculateCart(
    items: CartItemInput[],
    couponCode?: string,
    shippingMethodId?: string,
    userId?: string
  ): Promise<CartCalculationResult> {
    const calculatedItems: CartCalculationResult["items"] = [];
    const validationErrors: string[] = [];
    let subtotal = 0;
    const productIds: string[] = [];

    const productRepo = RepositoryFactory.getProductRepository();

    for (const item of items) {
      if (item.quantity <= 0) continue;

      const product = await productRepo.findById(item.productId);
      if (!product || product.status !== "active") {
        validationErrors.push(`An item in your cart is no longer available`);
        continue;
      }

      productIds.push(product.id);

      let unitPrice = Number(product.price);
      let availableStock = product.stock_quantity;
      let sku = product.sku;
      let attributes: Record<string, string> | undefined;
      let image = product.images?.[0]?.url;

      if (item.variantId) {
        const variant = product.variants?.find((v) => v.id === item.variantId);
        if (variant && variant.is_active) {
          unitPrice = Number(variant.price);
          availableStock = variant.stock;
          sku = variant.sku;
          attributes = variant.attributes;
          if (variant.image_url) image = variant.image_url;
        } else {
          validationErrors.push(`Selected variant for "${product.name}" is no longer active`);
        }
      }

      const inStock = availableStock >= item.quantity;
      if (!inStock) {
        validationErrors.push(
          `Insufficient stock for "${product.name}". Available: ${availableStock}, in cart: ${item.quantity}`
        );
      }

      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      calculatedItems.push({
        productId: product.id,
        variantId: item.variantId || null,
        name: product.name,
        sku,
        image,
        unitPrice,
        quantity: item.quantity,
        totalPrice: itemTotal,
        attributes,
        inStock,
        availableStock,
      });
    }

    // Calculate Coupon Discount
    let discountAmount = 0;
    let appliedCouponCode: string | undefined;

    if (couponCode && couponCode.trim()) {
      const couponRes = await CouponService.validateCoupon(couponCode, subtotal, userId, productIds);
      if (couponRes.isValid) {
        discountAmount = couponRes.discountAmount;
        appliedCouponCode = couponRes.coupon?.code;
      } else if (couponRes.error) {
        validationErrors.push(couponRes.error);
      }
    }

    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

    // Calculate Shipping
    const shippingCalc = await ShippingService.calculateShipping(subtotalAfterDiscount, shippingMethodId);

    // Calculate Taxes
    const taxCalc = await TaxService.calculateTax(subtotalAfterDiscount, shippingCalc.shippingAmount);

    // Final Total Calculation
    // If tax is exclusive, add it; if inclusive, already part of subtotalAfterDiscount
    const finalTotal =
      subtotalAfterDiscount +
      shippingCalc.shippingAmount +
      (taxCalc.isInclusive ? 0 : taxCalc.taxAmount);

    return {
      items: calculatedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: {
        code: appliedCouponCode,
        amount: discountAmount,
      },
      shipping: {
        methodId: shippingCalc.selectedMethod.id,
        title: shippingCalc.selectedMethod.name,
        amount: shippingCalc.shippingAmount,
      },
      tax: {
        rate: taxCalc.taxRate,
        amount: taxCalc.taxAmount,
        isInclusive: taxCalc.isInclusive,
      },
      total: Math.round(finalTotal * 100) / 100,
      currency: "USD",
      isValid: validationErrors.length === 0,
      validationErrors,
    };
  }

  /**
   * Merge guest cart into customer account cart on login
   * This now delegates to the CartRepository
   */
  static async mergeGuestCart(guestToken: string, userId: string): Promise<void> {
    const repo = RepositoryFactory.getCartRepository();
    await repo.mergeGuestCartToUser(guestToken, userId);
  }
}
