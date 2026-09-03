import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AccountService } from "@/services/account.service";
import { requireUser } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_ID", message: "Unknown address." } },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    // A dedicated "make this my default" action, so the UI does not have to
    // resubmit the whole address just to flip one flag.
    if (body?.action === "set_default") {
      const ok = await AccountService.setDefaultAddress(auth.user.id, id);
      if (!ok) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Unknown address." } },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    }

    const updated = await AccountService.updateAddress(auth.user.id, id, body);
    if (!updated) {
      // Not found and not-yours are the same response on purpose: a distinct
      // 403 would confirm that an address id exists for some other customer.
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Unknown address." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Please check the highlighted fields.",
            fields: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    console.error("[account/addresses] update failed:", error);
    return NextResponse.json(
      { success: false, error: { code: "ADDRESS_UPDATE_FAILED", message: "Could not update that address." } },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_ID", message: "Unknown address." } },
      { status: 400 }
    );
  }

  const ok = await AccountService.deleteAddress(auth.user.id, id);
  if (!ok) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Unknown address." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
