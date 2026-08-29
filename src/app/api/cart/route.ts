import { NextRequest, NextResponse } from "next/server";
import { CartService } from "@/services/cart.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items = [], couponCode, shippingMethodId, userId } = body;

    const calculation = await CartService.calculateCart(items, couponCode, shippingMethodId, userId);
    return NextResponse.json({ success: true, data: calculation });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "CALCULATE_CART_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
