import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { ProductImportService } from "@/services/product-import.service";

/** GET /api/admin/products/import/template — download the starter spreadsheet. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const buffer = await ProductImportService.buildTemplate();

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="product-import-template.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "TEMPLATE_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
