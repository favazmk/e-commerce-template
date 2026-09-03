import type { OrderStatus } from "@/types/database";

/**
 * Presentation helpers for order status.
 *
 * Kept out of the components so the storefront, the account area and the admin
 * panel describe the same status identically — a customer reading "Packed" in
 * an email and "Processing" on the site assumes something went wrong.
 */

export type StatusTone = "default" | "success" | "warning" | "danger" | "accent" | "outline";

export function orderStatusTone(status: OrderStatus): StatusTone {
  switch (status) {
    case "delivered":
      return "success";
    case "cancelled":
    case "failed":
    case "refunded":
      return "danger";
    case "shipped":
    case "out_for_delivery":
      return "accent";
    case "pending":
    case "payment_pending":
      return "warning";
    default:
      return "default";
  }
}

/** Customer-facing label. Internal state names leak process detail nobody asked for. */
export function orderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: "Awaiting payment",
    payment_pending: "Payment processing",
    paid: "Payment received",
    confirmed: "Order confirmed",
    processing: "Being prepared",
    packed: "Packed",
    shipped: "Shipped",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
    failed: "Payment failed",
  };
  return labels[status] || status;
}

/**
 * The happy-path journey, in order. Used to draw a progress timeline.
 * Terminal failure states are deliberately absent: they are not a step on the
 * way to delivery, they end the journey.
 */
export const ORDER_JOURNEY: OrderStatus[] = [
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

/** How far along the journey an order is, or -1 when it left the happy path. */
export function journeyIndex(status: OrderStatus): number {
  if (status === "paid") return ORDER_JOURNEY.indexOf("confirmed");
  return ORDER_JOURNEY.indexOf(status);
}

export function isTerminalFailure(status: OrderStatus): boolean {
  return status === "cancelled" || status === "failed" || status === "refunded";
}
