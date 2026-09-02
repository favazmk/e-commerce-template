import { NextRequest, NextResponse } from "next/server";
import { CartService } from "@/services/cart.service";
import { getSessionUserId } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items = [], couponCode, shippingMethodId } = body;

    // `userId` gates per-customer coupon limits, so it must come from the
    // session — accepting it from the body lets a caller reset their own limit.
    const userId = await getSessionUserId();

    const calculation = await CartService.calculateCart(items, couponCode, shippingMethodId, userId);
    return NextResponse.json({ success: true, data: calculation });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "CALCULATE_CART_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
