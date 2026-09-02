import { NextRequest, NextResponse } from "next/server";
import { CouponService } from "@/services/coupon.service";
import { requireAdmin } from "@/lib/auth/session";

/** GET /api/admin/coupons — list every coupon. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const coupons = await CouponService.listCoupons();
    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_COUPONS_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

/** POST /api/admin/coupons — create a coupon. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const created = await CouponService.createCoupon(body);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "CREATE_COUPON_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
