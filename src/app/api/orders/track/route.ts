import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OrderService } from "@/services/order.service";
import { orderStatusLabel } from "@/lib/orders/status";
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

/**
 * Guest order tracking.
 *
 * Rate-limited hard: a public form that answers "does this order exist" is the
 * natural place to enumerate order numbers, and the throttle is what makes that
 * impractical even before the email check rejects the guess.
 *
 * The response is a deliberately narrow projection. A tracking widget needs the
 * status and the line items — it does not need the customer's phone number,
 * full address or payment records, so those never leave the server.
 */

const requestSchema = z.object({
  orderNumber: z.string().trim().min(3).max(64),
  email: z.string().trim().email().max(254),
});

export async function POST(request: NextRequest) {
  const limit = checkRateLimit({
    name: "orders:track",
    identifier: getClientIdentifier(request),
    ...RATE_LIMITS.orderLookup,
  });
  if (!limit.allowed) return rateLimitResponse(limit);

  try {
    const body = await request.json();
    const { orderNumber, email } = requestSchema.parse(body);

    const order = await OrderService.lookupForTracking(orderNumber, email);

    if (!order) {
      // One message for every failure. Distinguishing "unknown order" from
      // "wrong email" would confirm which order numbers are real.
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "We could not find an order with those details. Please check and try again.",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.order_number,
        status: order.status,
        statusLabel: orderStatusLabel(order.status),
        placedAt: order.created_at,
        currency: order.currency,
        total: order.total_amount,
        estimatedDelivery: order.shipping_method?.estimated_days || null,
        shippingCity: order.shipping_address?.city || null,
        history: (order.history || []).map((entry) => ({
          status: entry.status,
          createdAt: entry.created_at,
        })),
        items: (order.items || []).map((item) => ({
          name: item.product_name_snapshot,
          quantity: item.quantity,
          image: item.image_snapshot,
        })),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Enter an order number and email address." },
        },
        { status: 400 }
      );
    }

    console.error("[orders/track] lookup failed:", error);
    return NextResponse.json(
      { success: false, error: { code: "TRACK_FAILED", message: "Could not look that up right now." } },
      { status: 500 }
    );
  }
}
