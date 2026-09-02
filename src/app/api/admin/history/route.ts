import { NextRequest, NextResponse } from "next/server";
import { ChangeLogService } from "@/services/changelog.service";
import { requireAdmin } from "@/lib/auth/session";

/** GET /api/admin/history — the undo history, newest first. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const limitParam = Number(request.nextUrl.searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 100;

    const entries = await ChangeLogService.list(limit);
    return NextResponse.json({ success: true, data: entries });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_HISTORY_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

/** POST /api/admin/history — undo one change. Body: { entryId }. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const { entryId } = await request.json();

    if (!entryId || typeof entryId !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Which change should be undone?" } },
        { status: 400 }
      );
    }

    const result = await ChangeLogService.revert(entryId, auth.user);
    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "REVERT_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
