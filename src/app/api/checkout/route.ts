import { NextRequest, NextResponse } from "next/server";
import { OrderService } from "@/services/order.service";
import { getSessionUserId } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Identity is resolved from the session cookie only. A client supplied
    // user id (header/body) is untrusted and must never attribute an order.
    const userId = await getSessionUserId();

    const result = await OrderService.createOrder(body, userId);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[Checkout API Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CHECKOUT_FAILED",
          message: error.message || "Failed to process checkout and place order",
        },
      },
      { status: 400 }
    );
  }
}
