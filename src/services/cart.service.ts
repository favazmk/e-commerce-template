import { RepositoryFactory } from "@/repositories/repository.factory";
import { getDefaultCurrency } from "@/lib/config/store.config";
import { CartCalculationResult } from "@/types/commerce";
import { CouponService } from "./coupon.service";
import { ShippingService } from "./shipping.service";
import { TaxService } from "./tax.service";
import {
  cartRequiresShipping,
  checkAvailability,
  effectivePrice,
  isPublished,
} from "@/lib/commerce/selling-rules";

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
    /** One entry per priced line, for deciding whether delivery applies at all. */
    const shippableLines: Array<{ requires_shipping?: boolean | null }> = [];

    const productRepo = RepositoryFactory.getProductRepository();

    for (const item of items) {
      // Quantity is client supplied: coerce to a sane positive integer before
      // it reaches pricing or stock arithmetic.
      let quantity = Math.floor(Number(item.quantity));
      if (!Number.isFinite(quantity) || quantity <= 0) continue;
      if (quantity > MAX_QUANTITY_PER_LINE) {
        validationErrors.push(
          `Maximum ${MAX_QUANTITY_PER_LINE} units per item. Please reduce the quantity.`
        );
        continue;
      }

      const product = await productRepo.findById(item.productId);
      // A product scheduled for a future launch is `active` but not yet
      // purchasable, so status alone is no longer the visibility test.
      if (!product || !isPublished(product)) {
        validationErrors.push(`An item in your cart is no longer available`);
        continue;
      }

      productIds.push(product.id);

      const variant = item.variantId
        ? product.variants?.find((v) => v.id === item.variantId) ?? null
        : null;

      if (item.variantId && !variant) {
        validationErrors.push(`Selected variant for "${product.name}" is no longer available`);
        continue;
      }

      // Sale windows, backorder policy and purchase limits are all decided in
      // one place, so the cart can never disagree with the product page about
      // what something costs or whether it can be bought.
      const pricing = effectivePrice(product, variant);
      const availability = checkAvailability(product, variant, quantity, product.name);

      if (!availability.purchasable) {
        validationErrors.push(availability.reason || `"${product.name}" is unavailable.`);
        continue;
      }

      // A quantity below a minimum or above a per-order limit is corrected
      // rather than refused — but the shopper is always told, because a basket
      // that silently changes itself is worse than one that argues.
      if (availability.adjustedQuantity !== quantity && availability.reason) {
        validationErrors.push(availability.reason);
      }
      quantity = availability.adjustedQuantity;

      const unitPrice = pricing.price;
      const listPrice = pricing.compareAtPrice;
      const availableStock = variant ? variant.stock : product.stock_quantity;
      const sku = variant ? variant.sku : product.sku;
      const attributes = variant?.attributes;
      const image = variant?.image_url || product.images?.[0]?.url;

      // Backordered lines are in stock as far as checkout is concerned; the
      // reason string above is what tells the shopper they will wait for it.
      const inStock = availability.backordered || availableStock >= quantity;

      shippableLines.push({ requires_shipping: product.requires_shipping });

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

    // Calculate Shipping. A cart holding only virtual products — downloads,
    // services, gift cards — has nothing to deliver, so charging a delivery fee
    // for it is simply wrong, and asking the shopper to pick a courier for a PDF
    // is how a checkout loses its credibility.
    const needsShipping = cartRequiresShipping(shippableLines);
    const shippingCalc = needsShipping
      ? await ShippingService.calculateShipping(subtotalAfterDiscount, shippingMethodId)
      : {
          selectedMethod: { id: "no-shipping", name: "No delivery required", rate: 0 },
          shippingAmount: 0,
          isFree: true,
          availableMethods: [],
        };

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
