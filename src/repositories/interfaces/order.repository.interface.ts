import { Order, OrderItem, OrderStatusHistory, Payment, Refund, OrderStatus } from "../../types/database";

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  findAllAdmin(status?: string, search?: string): Promise<Order[]>;
  createOrder(order: Omit<Order, "id" | "created_at" | "updated_at" | "items" | "payments" | "history">, items: Omit<OrderItem, "id" | "order_id" | "created_at">[]): Promise<Order>;
  updateOrderStatus(orderId: string, status: OrderStatus, notes?: string, changedBy?: string): Promise<void>;
  addPayment(payment: Omit<Payment, "id" | "created_at" | "updated_at">): Promise<Payment>;
  updatePaymentStatus(paymentId: string, status: string, providerOrderId?: string, transactionId?: string): Promise<void>;
  createRefund(refund: Omit<Refund, "id" | "created_at">): Promise<Refund>;
  getOrderPayments(orderId: string): Promise<Payment[]>;
}
