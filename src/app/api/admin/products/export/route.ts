import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { ProductService } from "@/services/product.service";
import { ProductImportService } from "@/services/product-import.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/products/export
 *
 * Downloads the catalogue in the import format, so the loop closes: export,
 * edit four hundred prices in Excel, re-import. Both Shopify and WooCommerce
 * treat this as the real bulk-editing tool, and they are right — no admin table
 * competes with a spreadsheet for changing one column across a whole catalogue.
 *
 * Accepts the same `q` and `status` filters as the products table, so "export
 * what I am looking at" does what it says.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const q = request.nextUrl.searchParams.get("q") || undefined;
    const status = request.nextUrl.searchParams.get("status") || undefined;

    const products = await ProductService.getAllAdminProducts(q, status);
    const buffer = await ProductImportService.buildExport(products);

    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="products-${stamp}.xlsx"`,
        // Cost prices and supplier margins are in this file. It must never sit
        // in a shared cache.
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "EXPORT_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
