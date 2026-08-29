import { PaymentFactory } from "@/lib/payments/payment.factory";
import { RepositoryFactory } from "@/repositories/repository.factory";
import { CheckoutInput, OrderCreationResult } from "@/types/commerce";
import { Order, OrderItem, OrderStatus, OrderStatusHistory, Payment, PaymentStatus } from "@/types/database";
import { CartService } from "./cart.service";
import { CouponService } from "./coupon.service";
import { EmailService } from "./email.service";

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

    const orderNumber = `AURA-${Math.floor(100000 + Math.random() * 900000)}`;

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
      guest_email: input.guestEmail || null,
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
    const customerEmail = input.guestEmail || "client@example.com";

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
   * Record successful payment verification and update order status to paid / confirmed
   */
  static async confirmOrderPayment(
    orderId: string,
    transactionId: string,
    provider: string,
    signature?: string
  ): Promise<Order | null> {
    const repo = RepositoryFactory.getOrderRepository();
    const order = await repo.findByOrderNumber(orderId) || await repo.findById(orderId);
    if (!order) return null;

    await repo.updateOrderStatus(order.id, "paid", `Payment verified via ${provider} (TX: ${transactionId})`);

    const payment = order.payments?.[0];
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

  static async getOrderById(id: string): Promise<Order | null> {
    const repo = RepositoryFactory.getOrderRepository();
    return (await repo.findById(id)) || (await repo.findByOrderNumber(id));
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
