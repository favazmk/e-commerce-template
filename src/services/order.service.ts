import { PaymentFactory } from "@/lib/payments/payment.factory";
import { RepositoryFactory } from "@/repositories/repository.factory";
import { CheckoutInput, OrderCreationResult } from "@/types/commerce";
import { Order, OrderItem, OrderStatus, OrderStatusHistory, Payment, PaymentStatus } from "@/types/database";
import { randomInt } from "crypto";
import { getOrderNumberPrefix } from "@/lib/config/store.config";
import { CartService } from "./cart.service";
import { CouponService } from "./coupon.service";
import { EmailService } from "./email.service";

/**
 * Human-readable order number.
 *
 * Uses a CSPRNG rather than Math.random(): order numbers are used as lookup
 * keys on the success page, so a predictable sequence lets anyone enumerate
 * other customers' orders. The extra width also makes collisions negligible.
 */
function generateOrderNumber(): string {
  const prefix = getOrderNumberPrefix();
  const serial = randomInt(0, 1_000_000_000).toString().padStart(9, "0");
  return `${prefix}-${serial}`;
}

const ADMIN_ROLES = ["admin", "super_admin"];

export class OrderService {
  /**
   * Orchestrate Order creation with strict server-side validation and stock reservation
   */
  static async createOrder(input: CheckoutInput, userId?: string): Promise<OrderCreationResult> {
    // 1. Recalculate everything on the server
    const cartCalc = await CartService.calculateCart(
      input.cartItems,
      input.couponCode,
      input.shippingMethodId,
      userId
    );

    if (!cartCalc.isValid || cartCalc.items.length === 0) {
      throw new Error(
        `Checkout validation failed: ${cartCalc.validationErrors.join(", ") || "No items in cart"}`
      );
    }

    const orderNumber = generateOrderNumber();

    // Signed-in customers may not resubmit their email in the checkout form.
    let customerAccountEmail: string | undefined;
    if (userId) {
      const account = await RepositoryFactory.getUserRepository().findById(userId);
      customerAccountEmail = account?.email;
    }

    const contactEmail = input.guestEmail?.trim() || customerAccountEmail;
    if (!contactEmail) {
      throw new Error("A contact email address is required to place an order");
    }

    const inventoryRepo = RepositoryFactory.getInventoryRepository();

    // 2. Atomically reserve / decrement inventory
    for (const item of cartCalc.items) {
      const stockSuccess = await inventoryRepo.reserveStock(
        item.productId,
        item.quantity,
        item.variantId || undefined,
        orderNumber
      );
      if (!stockSuccess) {
        throw new Error(`Inventory reservation failed for ${item.name}`);
      }
    }

    // 3. Record Coupon usage if applied
    if (cartCalc.discount.code) {
      await CouponService.incrementUsage(cartCalc.discount.code, userId, undefined); // order ID will be linked later or omitted
    }

    // 4. Create immutable order item snapshots
    const orderItems = cartCalc.items.map((item) => ({
      product_id: item.productId,
      variant_id: item.variantId || null,
      product_name_snapshot: item.name,
      sku_snapshot: item.sku,
      price_snapshot: item.unitPrice,
      image_snapshot: item.image || null,
      quantity: item.quantity,
      total_price: item.totalPrice,
      attributes_snapshot: item.attributes || {},
    }));

    const newOrderPayload = {
      order_number: orderNumber,
      user_id: userId || null,
      guest_email: input.guestEmail?.trim() || (userId ? null : contactEmail),
      guest_phone: input.guestPhone || null,
      status: "pending" as OrderStatus,
      payment_status: "pending" as PaymentStatus,
      subtotal: cartCalc.subtotal,
      discount_amount: cartCalc.discount.amount,
      shipping_amount: cartCalc.shipping.amount,
      tax_amount: cartCalc.tax.amount,
      total_amount: cartCalc.total,
      currency: cartCalc.currency,
      shipping_address: input.shippingAddress,
      billing_address: input.billingAddress,
      shipping_method: {
        id: cartCalc.shipping.methodId || "standard",
        title: cartCalc.shipping.title,
        rate: cartCalc.shipping.amount,
      },
      coupon_code: cartCalc.discount.code || null,
      coupon_discount: cartCalc.discount.amount,
      customer_notes: input.customerNotes || null,
    };

    // 6. Save order into database
    const orderRepo = RepositoryFactory.getOrderRepository();
    const newOrder = await orderRepo.createOrder(newOrderPayload, orderItems);

    // 7. Initialize Payment Gateway Provider
    const paymentProvider = PaymentFactory.getProvider(input.paymentProvider);
    const customerName = `${input.shippingAddress.first_name} ${input.shippingAddress.last_name}`.trim();
    const customerEmail = contactEmail;

    const paymentInit = await paymentProvider.createPayment({
      order: newOrder,
      amount: newOrder.total_amount,
      currency: newOrder.currency,
      customer: {
        name: customerName,
        email: customerEmail,
        phone: input.shippingAddress.phone,
      },
    });

    // Record initial pending payment
    const paymentRecord = {
      order_id: newOrder.id,
      payment_provider: paymentProvider.name,
      provider_order_id: paymentInit.providerOrderId,
      amount: newOrder.total_amount,
      currency: newOrder.currency,
      status: "pending" as PaymentStatus,
      payload: paymentInit.clientPayload,
    };
    
    await orderRepo.addPayment(paymentRecord);
    newOrder.payments = await orderRepo.getOrderPayments(newOrder.id);

    // Trigger transactional email notification asynchronously
    EmailService.sendOrderConfirmation(newOrder).catch((e) =>
      console.error("[EmailService Error]", e)
    );

    return {
      order: newOrder,
      paymentInitializationData: paymentInit,
    };
  }

  /**
   * Record successful payment verification and update order status to paid.
   *
   * `providerOrderId` is the gateway order id that the verified signature was
   * computed over. It MUST be matched against the payment record stored at
   * checkout time — without that binding a caller can replay a signature that
   * is valid for their own cheap order against somebody else's expensive one.
   */
  static async confirmOrderPayment(
    orderId: string,
    transactionId: string,
    provider: string,
    signature?: string,
    providerOrderId?: string
  ): Promise<Order | null> {
    const repo = RepositoryFactory.getOrderRepository();
    const order = (await repo.findByOrderNumber(orderId)) || (await repo.findById(orderId));
    if (!order) return null;

    const payments = order.payments?.length
      ? order.payments
      : await repo.getOrderPayments(order.id);

    // Bind the verified gateway order id to this order's payment record.
    let payment = payments?.[0];
    if (providerOrderId) {
      const matched = payments?.find((p) => p.provider_order_id === providerOrderId);
      if (!matched) {
        throw new Error(
          "Payment verification rejected: the verified gateway order does not belong to this order"
        );
      }
      payment = matched;
    }

    if (order.payment_status === "captured") {
      // Already settled (webhook and browser callback can both arrive).
      return await repo.findById(order.id);
    }

    await repo.updateOrderStatus(order.id, "paid", `Payment verified via ${provider} (TX: ${transactionId})`);

    if (payment) {
      await repo.updatePaymentStatus(payment.id, "captured", payment.provider_order_id || undefined, transactionId);
    }

    return await repo.findById(order.id);
  }

  /**
   * Admin / System: Update order lifecycle status
   */
  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    notes?: string,
    changedBy?: string
  ): Promise<Order | null> {
    const repo = RepositoryFactory.getOrderRepository();
    const order = await repo.findById(orderId) || await repo.findByOrderNumber(orderId);
    if (!order) return null;

    // Handle cancellation stock recovery
    if (status === "cancelled" && order.status !== "cancelled") {
      const inventoryRepo = RepositoryFactory.getInventoryRepository();
      for (const item of order.items || []) {
        if (item.product_id) {
          await inventoryRepo.releaseStock(order.order_number);
        }
      }
    }

    await repo.updateOrderStatus(order.id, status, notes || `Order status transitioned to ${status}`, changedBy);

    const updated = await repo.findById(order.id);
    if (updated) {
       // Notify customer on status update
       EmailService.sendOrderStatusUpdate(updated, status).catch(console.error);
    }

    return updated;
  }

  /**
   * Unrestricted order lookup. Only for callers that are already authorised
   * (admin screens) or that have no viewer at all (payment webhook).
   * Anything a customer can reach by URL must use `getOrderForViewer()`.
   */
  static async getOrderById(id: string): Promise<Order | null> {
    const repo = RepositoryFactory.getOrderRepository();
    return (await repo.findById(id)) || (await repo.findByOrderNumber(id));
  }

  /**
   * Order lookup for a customer-facing page, with the ownership check that
   * Row Level Security cannot express.
   *
   * A guest order has `user_id = null`, so `auth.uid() = user_id` is never true
   * and no RLS policy can grant the person who placed it access. The order
   * number is the capability instead — which is why it comes from a CSPRNG.
   *
   * An order that *does* belong to an account is a different matter: knowing
   * the number must not be enough, or one customer could read another's
   * address, email and phone. That case is enforced here.
   *
   * @param viewer  The signed-in user, or null for anonymous traffic.
   */
  static async getOrderForViewer(
    orderRef: string,
    viewer: { id: string; role?: string } | null
  ): Promise<Order | null> {
    const order = await this.getOrderById(orderRef);
    if (!order) return null;

    // Guest order: the unguessable order number is the access token.
    if (!order.user_id) return order;

    // Owned order: only the owner, or an admin, may view it.
    if (viewer && (viewer.id === order.user_id || ADMIN_ROLES.includes(viewer.role || ""))) {
      return order;
    }

    return null;
  }

  /**
   * Guest order tracking: order number plus the email it was placed with.
   *
   * Two factors on purpose. The order number alone already gates guest orders
   * (getOrderForViewer), but a public tracking form is a very different
   * exposure from a link the customer received by email — it invites
   * enumeration attempts against every order number at once. Requiring the
   * email as well means a guessed number is still useless.
   *
   * Also the only safe way to let an *account* order be tracked without a
   * login: the address on file must match what the caller typed.
   *
   * Returns null for every failure mode, so the form cannot distinguish
   * "no such order" from "wrong email" — the distinction is exactly what an
   * attacker enumerating order numbers would want.
   */
  static async lookupForTracking(orderNumber: string, email: string): Promise<Order | null> {
    const trimmedNumber = orderNumber.trim();
    const normalisedEmail = email.trim().toLowerCase();
    if (!trimmedNumber || !normalisedEmail) return null;

    const repo = RepositoryFactory.getOrderRepository();
    const order = await repo.findByOrderNumber(trimmedNumber);
    if (!order) return null;

    const candidates: string[] = [];
    if (order.guest_email) candidates.push(order.guest_email.toLowerCase());

    if (order.user_id) {
      const account = await RepositoryFactory.getUserRepository().findByIdAsService(order.user_id);
      if (account?.email) candidates.push(account.email.toLowerCase());
    }

    return candidates.includes(normalisedEmail) ? order : null;
  }

  static async getUserOrders(userId: string): Promise<Order[]> {
    const repo = RepositoryFactory.getOrderRepository();
    return await repo.findByUserId(userId);
  }

  static async getAllAdminOrders(status?: string, search?: string): Promise<Order[]> {
    const repo = RepositoryFactory.getOrderRepository();
    return await repo.findAllAdmin(status, search);
  }
}
