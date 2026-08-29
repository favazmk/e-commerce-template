import { NextRequest, NextResponse } from "next/server";
import { CategoryService } from "@/services/category.service";

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
  try {
    const body = await request.json();
    const created = await CategoryService.createCategory(body);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "CREATE_CATEGORY_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
