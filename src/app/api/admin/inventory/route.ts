import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/services/inventory.service";
import { ProductService } from "@/services/product.service";
import { requireAdmin } from "@/lib/auth/session";

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

    const adjusted = await InventoryService.adjustStock(
      productId,
      variantId,
      Number(newQuantity) || 0,
      reason
    );

    return NextResponse.json({ success: adjusted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "ADJUST_STOCK_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
