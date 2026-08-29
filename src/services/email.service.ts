import { Order, OrderStatus } from "@/types/database";
import { EmailFactory } from "@/lib/email/email.factory";

export class EmailService {
  /**
   * Send Order Confirmation Email
   */
  static async sendOrderConfirmation(order: Order): Promise<boolean> {
    const customerEmail = order.guest_email || "customer@example.com";
    const customerName = `${order.shipping_address.first_name} ${order.shipping_address.last_name}`;

    const provider = EmailFactory.getProvider();
    
    return provider.sendEmail({
      to: customerEmail,
      subject: `Order Confirmation - #${order.order_number}`,
      html: `
        <h1>Thank you for your order, ${customerName}!</h1>
        <p>Your order #${order.order_number} has been received.</p>
        <p>Total: $${order.total_amount}</p>
      `,
    });
  }

  /**
   * Send Order Status Update
   */
  static async sendOrderStatusUpdate(order: Order, newStatus: OrderStatus): Promise<boolean> {
    const customerEmail = order.guest_email || "customer@example.com";
    const provider = EmailFactory.getProvider();
    
    return provider.sendEmail({
      to: customerEmail,
      subject: `Order Status Update - #${order.order_number}`,
      html: `
        <h1>Order Status Updated</h1>
        <p>Your order #${order.order_number} is now: <strong>${newStatus}</strong></p>
      `,
    });
  }
}
