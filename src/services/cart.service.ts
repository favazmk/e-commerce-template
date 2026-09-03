import { RepositoryFactory } from "@/repositories/repository.factory";
import { getDefaultCurrency } from "@/lib/config/store.config";
import { CartCalculationResult } from "@/types/commerce";
import { CouponService } from "./coupon.service";
import { ShippingService } from "./shipping.service";
import { TaxService } from "./tax.service";

export interface CartItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

/** Upper bound for a single cart line, guards against absurd quantities. */
const MAX_QUANTITY_PER_LINE = 999;

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
    let listSubtotal = 0;
    const productIds: string[] = [];

    const productRepo = RepositoryFactory.getProductRepository();

    for (const item of items) {
      // Quantity is client supplied: coerce to a sane positive integer before
      // it reaches pricing or stock arithmetic.
      const quantity = Math.floor(Number(item.quantity));
      if (!Number.isFinite(quantity) || quantity <= 0) continue;
      if (quantity > MAX_QUANTITY_PER_LINE) {
        validationErrors.push(
          `Maximum ${MAX_QUANTITY_PER_LINE} units per item. Please reduce the quantity.`
        );
        continue;
      }

      const product = await productRepo.findById(item.productId);
      if (!product || product.status !== "active") {
        validationErrors.push(`An item in your cart is no longer available`);
        continue;
      }

      productIds.push(product.id);

      let unitPrice = Number(product.price);
      let listPrice = product.compare_at_price != null ? Number(product.compare_at_price) : null;
      let availableStock = product.stock_quantity;
      let sku = product.sku;
      let attributes: Record<string, string> | undefined;
      let image = product.images?.[0]?.url;

      if (item.variantId) {
        const variant = product.variants?.find((v) => v.id === item.variantId);
        if (variant && variant.is_active) {
          unitPrice = Number(variant.price);
          listPrice = variant.compare_at_price != null ? Number(variant.compare_at_price) : null;
          availableStock = variant.stock;
          sku = variant.sku;
          attributes = variant.attributes;
          if (variant.image_url) image = variant.image_url;
        } else {
          validationErrors.push(`Selected variant for "${product.name}" is no longer active`);
        }
      }

      const inStock = availableStock >= quantity;
      if (!inStock) {
        validationErrors.push(
          `Insufficient stock for "${product.name}". Available: ${availableStock}, in cart: ${quantity}`
        );
      }

      const itemTotal = unitPrice * quantity;
      subtotal += itemTotal;
      // A list price below the selling price is a data error, not a markup;
      // clamping keeps a "you saved" figure from ever going negative.
      listSubtotal += Math.max(listPrice ?? unitPrice, unitPrice) * quantity;

      calculatedItems.push({
        productId: product.id,
        variantId: item.variantId || null,
        name: product.name,
        sku,
        image,
        unitPrice,
        listPrice,
        quantity,
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
      listSubtotal: Math.round(listSubtotal * 100) / 100,
      discount: {
        code: appliedCouponCode,
        amount: discountAmount,
      },
      shipping: {
        methodId: shippingCalc.selectedMethod.id,
        title: shippingCalc.selectedMethod.name,
        amount: shippingCalc.shippingAmount,
      },
      availableShippingMethods: shippingCalc.availableMethods,
      tax: {
        rate: taxCalc.taxRate,
        amount: taxCalc.taxAmount,
        isInclusive: taxCalc.isInclusive,
      },
      total: Math.round(finalTotal * 100) / 100,
      currency: getDefaultCurrency(),
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
