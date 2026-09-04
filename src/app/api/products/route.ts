import { NextRequest, NextResponse } from "next/server";
import { revalidateProduct } from "@/lib/cache/revalidate";
import { ProductService } from "@/services/product.service";
import { requireAdmin } from "@/lib/auth/session";
import { ChangeLogService } from "@/services/changelog.service";

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
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const created = await ProductService.createProduct(body);

    await ChangeLogService.record({
      entityType: "product",
      entityId: created.id,
      entityLabel: created.name,
      action: "create",
      summary: `Created the product "${created.name}"`,
      before: null,
      after: created as unknown as Record<string, any>,
      actor: auth.user,
    });

    // Refreshes the sitemap, the Google and Meta feeds, the homepage rails
    // and the product's own category page — not just the listing.
    revalidateProduct({ slug: created.slug, categorySlug: created.category?.slug });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "CREATE_PRODUCT_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
