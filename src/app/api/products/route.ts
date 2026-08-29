import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ProductService } from "@/services/product.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categorySlug = searchParams.get("categorySlug") || undefined;
    const searchQuery = searchParams.get("searchQuery") || undefined;
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const brand = searchParams.get("brand") || undefined;
    const inStockOnly = searchParams.get("inStockOnly") === "true";
    const featuredOnly = searchParams.get("featuredOnly") === "true";
    const sortBy = (searchParams.get("sortBy") as any) || "newest";
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 12;

    const result = await ProductService.getProducts({
      categorySlug,
      searchQuery,
      minPrice,
      maxPrice,
      brand,
      inStockOnly,
      featuredOnly,
      sortBy,
      page,
      limit,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_PRODUCTS_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = await ProductService.createProduct(body);
    revalidatePath("/admin/products");
    revalidatePath("/products");
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "CREATE_PRODUCT_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
