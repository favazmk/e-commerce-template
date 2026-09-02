import { NextRequest, NextResponse } from "next/server";
import { CouponService } from "@/services/coupon.service";
import { getSessionUserId } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal, productIds } = body;

    const userId = await getSessionUserId();

    const result = await CouponService.validateCoupon(
      code,
      Number(subtotal) || 0,
      userId,
      productIds
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "COUPON_VALIDATION_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
