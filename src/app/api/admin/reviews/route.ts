import { NextRequest, NextResponse } from "next/server";
import { ReviewService } from "@/services/review.service";
import { ProductService } from "@/services/product.service";
import { requireAdmin } from "@/lib/auth/session";
import { ReviewStatus } from "@/types/database";

/** GET /api/admin/reviews — the moderation queue, with product names attached. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const statusParam = request.nextUrl.searchParams.get("status");
    const status =
      statusParam && ["pending", "approved", "rejected"].includes(statusParam)
        ? (statusParam as ReviewStatus)
        : undefined;

    const reviews = await ReviewService.listForModeration(status);

    // Names are resolved once here so the moderation table shows what was
    // reviewed rather than a product id.
    const products = await ProductService.getAllAdminProducts();
    const nameById = new Map(products.map((p) => [p.id, p.name]));

    return NextResponse.json({
      success: true,
      data: reviews.map((review) => ({
        ...review,
        product_name: nameById.get(review.product_id) || "Deleted product",
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_REVIEWS_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
