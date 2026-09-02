import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import {
  StorageService,
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/services/storage.service";

/** Uploads are binary; never let this route be statically optimised. */
export const dynamic = "force-dynamic";

/** GET /api/admin/media — list every asset in the bucket. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const assets = await StorageService.listFiles();
    return NextResponse.json({ success: true, data: assets });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "LIST_MEDIA_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/media — upload one or more images from the admin's device.
 *
 * Accepts multipart/form-data with one or more `file` parts.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const formData = await request.formData();
    const files = formData.getAll("file").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NO_FILE", message: "No file was provided." } },
        { status: 400 }
      );
    }

    const uploaded = [];
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "UNSUPPORTED_TYPE",
              message: `"${file.name}" is a ${file.type || "unknown"} file. Allowed: JPG, PNG, WebP, AVIF, GIF.`,
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
              message: `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${
                MAX_UPLOAD_BYTES / 1024 / 1024
              } MB.`,
            },
          },
          { status: 413 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      uploaded.push(await StorageService.uploadFile(file.name, buffer, file.type));
    }

    return NextResponse.json({ success: true, data: uploaded });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "UPLOAD_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

/** DELETE /api/admin/media?key=... — permanently remove an asset. */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "An asset key is required." } },
      { status: 400 }
    );
  }

  try {
    const deleted = await StorageService.deleteFile(key);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "DELETE_MEDIA_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
