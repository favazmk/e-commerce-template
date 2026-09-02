import { NextRequest, NextResponse } from "next/server";
import { CouponService } from "@/services/coupon.service";
import { requireAdmin } from "@/lib/auth/session";
import { ChangeLogService } from "@/services/changelog.service";

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

    const before = await CouponService.getCouponById(id);
    const updated = await CouponService.updateCoupon(id, body);

    if (updated && before) {
      // A pause/resume reads very differently from a rewrite in the history,
      // so name it for what the admin actually did.
      const toggledOnly =
        Object.keys(body).length === 1 && Object.prototype.hasOwnProperty.call(body, "is_active");
      const summary = toggledOnly
        ? `${updated.is_active ? "Activated" : "Deactivated"} the coupon ${updated.code}`
        : `Edited the coupon ${updated.code}`;

      await ChangeLogService.record({
        entityType: "coupon",
        entityId: id,
        entityLabel: updated.code,
        action: "update",
        summary,
        before: before as unknown as Record<string, any>,
        after: updated as unknown as Record<string, any>,
        actor: auth.user,
      });
    }

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

    const before = await CouponService.getCouponById(id);
    const deleted = await CouponService.deleteCoupon(id);

    if (deleted && before) {
      await ChangeLogService.record({
        entityType: "coupon",
        entityId: id,
        entityLabel: before.code,
        action: "delete",
        summary: `Deleted the coupon ${before.code}`,
        before: before as unknown as Record<string, any>,
        after: null,
        actor: auth.user,
      });
    }

    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "DELETE_COUPON_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
