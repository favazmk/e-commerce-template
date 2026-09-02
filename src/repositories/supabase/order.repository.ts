import { IOrderRepository } from "../interfaces/order.repository.interface";
import { Order, OrderItem, Payment, Refund, OrderStatus, OrderStatusHistory } from "../../types/database";
import { SupabaseRepository } from "./base.repository";

const ORDER_SELECT = "*, items:order_items(*), payments(*), history:order_status_history(*)";

export class SupabaseOrderRepository extends SupabaseRepository implements IOrderRepository {
  /**
   * Look up a single order without RLS.
   *
   * Guest orders have `user_id = null`, so no RLS policy can express "the
   * person who placed it": `auth.uid() = user_id` is never true for them. The
   * order number is the capability instead, which is why it is generated from
   * a CSPRNG. Authorisation for owned orders is enforced one layer up in
   * `OrderService.getOrderForViewer()`, which must be used for anything a
   * customer can reach by URL.
   */
  async findById(id: string): Promise<Order | null> {
    const { data, error } = await this.serviceClient("guest-capability-token")
      .from('orders')
      .select(ORDER_SELECT)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as unknown as Order;
  }

  /** See `findById` — same capability-token reasoning. */
  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const { data, error } = await this.serviceClient("guest-capability-token")
      .from('orders')
      .select(ORDER_SELECT)
      .eq('order_number', orderNumber)
      .single();

    if (error || !data) return null;
    return data as unknown as Order;
  }

  /**
   * The signed-in customer's own order history.
   *
   * RLS-enforced. The "Users can view their own orders" policy (plus the
   * matching policies on order_items, payments and order_status_history) means
   * this cannot return another customer's orders even if `userId` were wrong.
   */
  async findByUserId(userId: string): Promise<Order[]> {
    const client = await this.userClient();
    const { data, error } = await client
      .from('orders')
      .select(ORDER_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as unknown as Order[];
  }

  /** Merchant order list. Callers are gated by `requireAdmin()`. */
  async findAllAdmin(status?: string, search?: string): Promise<Order[]> {
    let query = this.serviceClient("admin-authorised")
      .from('orders')
      .select(ORDER_SELECT)
      .order('created_at', { ascending: false });

    if (status && status !== "all") {
      query = query.eq('status', status);
    }
    if (search && search.trim()) {
      query = query.ilike('order_number', `%${search}%`);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as unknown as Order[];
  }

  /**
   * Guests check out without a session and there is deliberately no INSERT
   * policy on `orders`, so order creation is a system write.
   */
  async createOrder(order: Omit<Order, "id" | "created_at" | "updated_at" | "items" | "payments" | "history">, items: Omit<OrderItem, "id" | "order_id" | "created_at">[]): Promise<Order> {
    const client = this.serviceClient("system-no-session");
    
    // Insert order
    const { data: newOrder, error: orderError } = await client
      .from('orders')
      .insert([order])
      .select()
      .single();

    if (orderError || !newOrder) {
      console.error(orderError);
      throw new Error("Failed to create order");
    }

    // Insert items
    const itemsToInsert = items.map(item => ({
      ...item,
      order_id: newOrder.id
    }));

    const { error: itemsError } = await client
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error(itemsError);
      throw new Error("Failed to create order items");
    }

    // Initial status history
    await client.from('order_status_history').insert([{
      order_id: newOrder.id,
      status: newOrder.status,
      notes: "Order created"
    }]);

    return await this.findById(newOrder.id) as Order;
  }

  /** Lifecycle transitions come from admins or from the payment webhook. */
  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string, changedBy?: string): Promise<void> {
    const client = this.serviceClient("system-no-session");
    
    const { error } = await client
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) throw new Error("Failed to update order status");

    await client.from('order_status_history').insert([{
      order_id: orderId,
      status,
      notes,
      changed_by: changedBy || null
    }]);
  }

  /** Payment rows are written during checkout and by the gateway webhook. */
  async addPayment(payment: Omit<Payment, "id" | "created_at" | "updated_at">): Promise<Payment> {
    const { data, error } = await this.serviceClient("system-no-session")
      .from('payments')
      .insert([payment])
      .select()
      .single();

    if (error || !data) throw new Error("Failed to add payment");
    return data as unknown as Payment;
  }

  async updatePaymentStatus(paymentId: string, status: string, providerOrderId?: string, transactionId?: string): Promise<void> {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (providerOrderId) updateData.provider_order_id = providerOrderId;
    if (transactionId) updateData.transaction_id = transactionId;

    const { error } = await this.serviceClient("system-no-session")
      .from('payments')
      .update(updateData)
      .eq('id', paymentId);

    if (error) throw new Error("Failed to update payment status");
  }

  /** Refunds are an admin action; `refunds` has no anon policy by design. */
  async createRefund(refund: Omit<Refund, "id" | "created_at">): Promise<Refund> {
    const { data, error } = await this.serviceClient("admin-authorised")
      .from('refunds')
      .insert([refund])
      .select()
      .single();

    if (error || !data) throw new Error("Failed to create refund");
    return data as unknown as Refund;
  }

  /** Read during payment settlement, which runs without a session. */
  async getOrderPayments(orderId: string): Promise<Payment[]> {
    const { data, error } = await this.serviceClient("system-no-session")
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as unknown as Payment[];
  }
}
