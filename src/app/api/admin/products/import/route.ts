import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { revalidateCatalog } from "@/lib/cache/revalidate";
import { requireAdmin } from "@/lib/auth/session";
import { ProductImportService } from "@/services/product-import.service";
import { ChangeLogService } from "@/services/changelog.service";

export const dynamic = "force-dynamic";

/** Spreadsheets are small but not tiny; 12 MB covers a very large catalogue. */
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = [".xlsx", ".xlsm", ".csv"];

/**
 * POST /api/admin/products/import — step 1, preview.
 *
 * Takes the uploaded file and returns what importing it would do. Writes
 * nothing.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: { code: "NO_FILE", message: "Choose a spreadsheet to upload." } },
        { status: 400 }
      );
    }

    const name = file.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNSUPPORTED_TYPE",
            message: `"${file.name}" is not a spreadsheet. Upload an .xlsx or .csv file.`,
          },
        },
        { status: 415 }
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FILE_TOO_LARGE",
            message: `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${
              MAX_UPLOAD_BYTES / 1024 / 1024
            } MB.`,
          },
        },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const preview = await ProductImportService.parseAndValidate(buffer, file.name);

    return NextResponse.json({ success: true, data: preview });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PARSE_ERROR",
          message: `Could not read that file: ${error.message}`,
        },
      },
      { status: 400 }
    );
  }
}

/**
 * PUT /api/admin/products/import — step 2, commit.
 *
 * Takes the rows the admin confirmed and writes them. The client sends back
 * the validated payloads from the preview; they are re-checked here rather
 * than trusted, because anything arriving over the wire is untrusted even
 * when this endpoint produced it a moment earlier.
 */
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const rows = Array.isArray(body?.rows) ? body.rows : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOTHING_TO_IMPORT", message: "There are no valid rows to import." } },
        { status: 400 }
      );
    }

    if (rows.length > ProductImportService.MAX_ROWS) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TOO_MANY_ROWS",
            message: `Import at most ${ProductImportService.MAX_ROWS} rows at a time.`,
          },
        },
        { status: 400 }
      );
    }

    const sanitised = rows
      .filter(
        (row: any) =>
          row &&
          (row.action === "create" || row.action === "update") &&
          row.payload &&
          typeof row.payload.sku === "string" &&
          typeof row.payload.name === "string"
      )
      .map((row: any) => ({
        rowNumber: Number(row.rowNumber) || 0,
        action: row.action as "create" | "update",
        payload: row.payload,
        existingProductId:
          typeof row.existingProductId === "string" ? row.existingProductId : undefined,
      }));

    if (sanitised.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOTHING_TO_IMPORT", message: "None of those rows could be imported." } },
        { status: 400 }
      );
    }

    const result = await ProductImportService.commit(sanitised);

    // One history entry for the batch rather than one per product: undoing a
    // 300-row import row by row would be worse than useless.
    await ChangeLogService.record({
      entityType: "product",
      entityId: "bulk-import",
      entityLabel: "Spreadsheet import",
      action: "create",
      summary: `Imported a spreadsheet: ${result.created} created, ${result.updated} updated`,
      before: null,
      after: {
        created: result.created,
        updated: result.updated,
        failed: result.failed.length,
        skus: sanitised.map((r: { payload: { sku?: string } }) => r.payload.sku),
      },
      actor: auth.user,
    });

    // A bulk import touches many categories at once, so invalidate the whole
    // catalog rather than trying to enumerate what changed.
    revalidateCatalog();
    revalidatePath("/admin/products");

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "IMPORT_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
