import { NextRequest, NextResponse } from "next/server";
import { CouponService } from "@/services/coupon.service";
import { requireAdmin } from "@/lib/auth/session";

/** PATCH /api/admin/coupons/[id] — edit a coupon, or toggle it on/off. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await CouponService.updateCoupon(id, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Coupon not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_COUPON_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}

/** DELETE /api/admin/coupons/[id] — permanently remove a coupon. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const deleted = await CouponService.deleteCoupon(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "DELETE_COUPON_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
