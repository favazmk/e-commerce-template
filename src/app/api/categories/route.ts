import { NextRequest, NextResponse } from "next/server";
import { CategoryService } from "@/services/category.service";
import { requireAdmin } from "@/lib/auth/session";
import { ChangeLogService } from "@/services/changelog.service";

export async function GET(request: NextRequest) {
  try {
    const categories = await CategoryService.getCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_CATEGORIES_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const created = await CategoryService.createCategory(body);

    await ChangeLogService.record({
      entityType: "category",
      entityId: created.id,
      entityLabel: created.name,
      action: "create",
      summary: `Created the category "${created.name}"`,
      before: null,
      after: created as unknown as Record<string, any>,
      actor: auth.user,
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "CREATE_CATEGORY_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
