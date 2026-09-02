import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { CategoryService } from "@/services/category.service";
import { requireAdmin } from "@/lib/auth/session";
import { ChangeLogService } from "@/services/changelog.service";

/** PUT /api/categories/[id] — update a category. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const before = await CategoryService.getCategoryById(id);
    const updated = await CategoryService.updateCategory(id, body);

    if (updated && before) {
      await ChangeLogService.record({
        entityType: "category",
        entityId: id,
        entityLabel: updated.name,
        action: "update",
        summary: `Edited the category "${updated.name}"`,
        before: before as unknown as Record<string, any>,
        after: updated as unknown as Record<string, any>,
        actor: auth.user,
      });
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Category not found" } },
        { status: 404 }
      );
    }

    revalidatePath("/");
    revalidatePath("/products");
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_CATEGORY_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/categories/[id] — remove a category.
 *
 * Products referencing it are not deleted; the schema sets their category_id
 * to NULL, so they become "Unassigned" rather than disappearing from the shop.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const { id } = await params;

    const before = await CategoryService.getCategoryById(id);
    const deleted = await CategoryService.deleteCategory(id);

    if (deleted && before) {
      await ChangeLogService.record({
        entityType: "category",
        entityId: id,
        entityLabel: before.name,
        action: "delete",
        summary: `Deleted the category "${before.name}"`,
        before: before as unknown as Record<string, any>,
        after: null,
        actor: auth.user,
      });
    }

    revalidatePath("/");
    revalidatePath("/products");
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "DELETE_CATEGORY_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
