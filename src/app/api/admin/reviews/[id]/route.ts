import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ReviewService } from "@/services/review.service";
import { ChangeLogService } from "@/services/changelog.service";
import { requireAdmin } from "@/lib/auth/session";

/** PATCH /api/admin/reviews/[id] — approve or reject. Body: { status }. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const { status } = await request.json();

    const before = await ReviewService.getById(id);
    if (!before) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Review not found" } },
        { status: 404 }
      );
    }

    const updated = await ReviewService.setStatus(id, status);

    await ChangeLogService.record({
      entityType: "review",
      entityId: id,
      entityLabel: `${before.customer_name}: ${before.title || before.comment.slice(0, 40)}`,
      action: "update",
      summary: `${status === "approved" ? "Published" : status === "rejected" ? "Rejected" : "Unpublished"} a review by ${before.customer_name}`,
      before: before as unknown as Record<string, any>,
      after: updated as unknown as Record<string, any>,
      actor: auth.user,
    });

    revalidatePath("/products");
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_REVIEW_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}

/** DELETE /api/admin/reviews/[id] — remove a review permanently. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const { id } = await params;

    const before = await ReviewService.getById(id);
    const deleted = await ReviewService.deleteReview(id);

    if (deleted && before) {
      await ChangeLogService.record({
        entityType: "review",
        entityId: id,
        entityLabel: `${before.customer_name}: ${before.title || before.comment.slice(0, 40)}`,
        action: "delete",
        summary: `Deleted a review by ${before.customer_name}`,
        before: before as unknown as Record<string, any>,
        after: null,
        actor: auth.user,
      });
    }

    revalidatePath("/products");
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "DELETE_REVIEW_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
