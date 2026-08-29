import { NextRequest, NextResponse } from "next/server";
import { OrderService } from "@/services/order.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get("x-user-id") || undefined;

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
