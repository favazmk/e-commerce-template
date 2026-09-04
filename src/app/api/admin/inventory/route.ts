import { NextRequest, NextResponse } from "next/server";
import { revalidateCatalog } from "@/lib/cache/revalidate";
import { InventoryService } from "@/services/inventory.service";
import { ProductService } from "@/services/product.service";
import { requireAdmin } from "@/lib/auth/session";
import { ChangeLogService } from "@/services/changelog.service";
import { RepositoryFactory } from "@/repositories/repository.factory";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const productId = request.nextUrl.searchParams.get("productId") || undefined;
    const history = await InventoryService.getTransactionHistory(productId);
    const products = await ProductService.getAllAdminProducts();
    return NextResponse.json({ success: true, data: { history, products } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_INVENTORY_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { productId, variantId, newQuantity, reason } = body;

    // Read the count before the write so the adjustment can be undone.
    const inventoryRepo = RepositoryFactory.getInventoryRepository();
    const previousQuantity = await inventoryRepo.getStock(productId, variantId || undefined);

    const target = Number(newQuantity) || 0;
    const adjusted = await InventoryService.adjustStock(productId, variantId, target, reason);

    if (adjusted) {
      const product = await ProductService.getProductById(productId);
      const variant = variantId
        ? product?.variants?.find((v) => v.id === variantId)
        : undefined;
      const sizeLabel = variant
        ? Object.entries(variant.attributes || {})
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ") || variant.sku
        : null;
      const label = sizeLabel ? `${product?.name ?? "Product"} (${sizeLabel})` : product?.name ?? "Product";

      await ChangeLogService.record({
        entityType: "inventory",
        entityId: variantId || productId,
        entityLabel: label,
        action: "update",
        summary: `Set ${label} stock to ${target} (was ${previousQuantity})`,
        before: { productId, variantId: variantId || null, quantity: previousQuantity },
        after: { productId, variantId: variantId || null, quantity: target },
        actor: auth.user,
      });
    }

    if (adjusted) {
      // Stock level drives availability in the Google and Meta feeds and the
      // "only N left" badge, so a restock has to reach the cached pages.
      revalidateCatalog();
    }

    return NextResponse.json({ success: adjusted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "ADJUST_STOCK_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
