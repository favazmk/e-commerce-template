import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { ProductService } from "@/services/product.service";
import { ChangeLogService } from "@/services/changelog.service";

/**
 * POST /api/admin/products/[id]/duplicate
 *
 * Shopify's "Duplicate product", which is the fastest path to a new colourway
 * or a seasonal re-release. The copy is always a draft with fresh SKUs and zero
 * stock — see SupabaseProductRepository.duplicate for why each of those is not
 * negotiable.
 *
 * No cache revalidation is issued: a draft is invisible to the storefront, so
 * nothing public has changed.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const created = await ProductService.duplicateProduct(id, {
      name: typeof body?.name === "string" ? body.name : undefined,
      sku: typeof body?.sku === "string" ? body.sku : undefined,
    });

    if (!created) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "That product no longer exists." } },
        { status: 404 }
      );
    }

    await ChangeLogService.record({
      entityType: "product",
      entityId: created.id,
      entityLabel: created.name,
      action: "create",
      summary: `Duplicated a product into the draft "${created.name}"`,
      before: null,
      after: created as unknown as Record<string, any>,
      actor: auth.user,
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "DUPLICATE_PRODUCT_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
