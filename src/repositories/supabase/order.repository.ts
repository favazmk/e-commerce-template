import { IOrderRepository } from "../interfaces/order.repository.interface";
import { Order, OrderItem, Payment, Refund, OrderStatus, OrderStatusHistory } from "../../types/database";
import { createAdminClient } from "../../lib/supabase/server";

export class SupabaseOrderRepository implements IOrderRepository {
  private getClient() {
    return createAdminClient();
  }

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await this.getClient()
      .from('orders')
      .select('*, items:order_items(*), payments(*), history:order_status_history(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as unknown as Order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const { data, error } = await this.getClient()
      .from('orders')
      .select('*, items:order_items(*), payments(*), history:order_status_history(*)')
      .eq('order_number', orderNumber)
      .single();

    if (error || !data) return null;
    return data as unknown as Order;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const { data, error } = await this.getClient()
      .from('orders')
      .select('*, items:order_items(*), payments(*), history:order_status_history(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as unknown as Order[];
  }

  async findAllAdmin(status?: string, search?: string): Promise<Order[]> {
    let query = this.getClient()
      .from('orders')
      .select('*, items:order_items(*), payments(*), history:order_status_history(*)')
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

  async createOrder(order: Omit<Order, "id" | "created_at" | "updated_at" | "items" | "payments" | "history">, items: Omit<OrderItem, "id" | "order_id" | "created_at">[]): Promise<Order> {
    const client = this.getClient();
    
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

  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string, changedBy?: string): Promise<void> {
    const client = this.getClient();
    
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

  async addPayment(payment: Omit<Payment, "id" | "created_at" | "updated_at">): Promise<Payment> {
    const { data, error } = await this.getClient()
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

    const { error } = await this.getClient()
      .from('payments')
      .update(updateData)
      .eq('id', paymentId);

    if (error) throw new Error("Failed to update payment status");
  }

  async createRefund(refund: Omit<Refund, "id" | "created_at">): Promise<Refund> {
    const { data, error } = await this.getClient()
      .from('refunds')
      .insert([refund])
      .select()
      .single();

    if (error || !data) throw new Error("Failed to create refund");
    return data as unknown as Refund;
  }

  async getOrderPayments(orderId: string): Promise<Payment[]> {
    const { data, error } = await this.getClient()
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as unknown as Payment[];
  }
}
