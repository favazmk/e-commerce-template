import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { revalidateCatalog } from "@/lib/cache/revalidate";
import { ProductService, ProductValidationError } from "@/services/product.service";
import { ChangeLogService } from "@/services/changelog.service";

export const dynamic = "force-dynamic";

/** One request must not be able to rewrite the whole catalogue by accident. */
const MAX_SELECTION = 250;

const ALLOWED_STATUSES = ["draft", "active", "archived", "out_of_stock"] as const;

/**
 * POST /api/admin/products/bulk
 *
 * The bulk editor every catalogue tool has, because seasonal merchandising is
 * "archive these forty" and "mark these twelve featured" — not forty visits to
 * a detail page.
 *
 * Deletion is deliberately not offered here. A mis-clicked bulk delete is
 * unrecoverable and would cascade through variants, images and the stock
 * ledger; archiving reaches the same shelf and is reversible.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === "string") : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NO_SELECTION", message: "Select at least one product." } },
        { status: 400 }
      );
    }

    if (ids.length > MAX_SELECTION) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SELECTION_TOO_LARGE",
            message: `Change at most ${MAX_SELECTION} products at a time.`,
          },
        },
        { status: 400 }
      );
    }

    // The client sends whatever the bulk bar had open; only the recognised
    // changes are forwarded, so an extra field in a crafted request cannot
    // reach the writable-column list.
    const changes: Parameters<typeof ProductService.bulkUpdate>[1] = {};
    const descriptions: string[] = [];

    if (typeof body?.status === "string") {
      if (!ALLOWED_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: { code: "BAD_STATUS", message: `Unknown status "${body.status}".` } },
          { status: 400 }
        );
      }
      changes.status = body.status;
      descriptions.push(`status to ${body.status}`);
    }

    if (typeof body?.featured === "boolean") {
      changes.featured = body.featured;
      descriptions.push(body.featured ? "featured on" : "featured off");
    }

    if (typeof body?.category_id === "string" || body?.category_id === null) {
      changes.category_id = body.category_id || null;
      descriptions.push("category");
    }

    if (body?.price_change_percent !== undefined && body?.price_change_percent !== "") {
      const percent = Number(body.price_change_percent);
      if (!Number.isFinite(percent)) {
        return NextResponse.json(
          { success: false, error: { code: "BAD_PERCENT", message: "Enter a valid percentage." } },
          { status: 400 }
        );
      }
      changes.price_change_percent = percent;
      descriptions.push(`price ${percent > 0 ? "+" : ""}${percent}%`);
    }

    if (descriptions.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NO_CHANGES", message: "Choose what to change." } },
        { status: 400 }
      );
    }

    const affected = await ProductService.bulkUpdate(ids, changes);

    await ChangeLogService.record({
      entityType: "product",
      entityId: ids[0],
      entityLabel: `${affected} products`,
      action: "update",
      summary: `Bulk change across ${affected} products: ${descriptions.join(", ")}`,
      before: null,
      after: { ids, ...changes },
      actor: auth.user,
    });

    // A bulk change can touch any category and any rail, so the whole catalogue
    // is refreshed rather than a guessed subset.
    revalidateCatalog();

    return NextResponse.json({ success: true, data: { affected } });
  } catch (error: any) {
    const isValidation = error instanceof ProductValidationError;
    return NextResponse.json(
      {
        success: false,
        error: { code: isValidation ? "VALIDATION_ERROR" : "BULK_UPDATE_ERROR", message: error.message },
      },
      { status: 400 }
    );
  }
}
