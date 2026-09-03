import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AccountService } from "@/services/account.service";
import { requireUser } from "@/lib/auth/session";

/**
 * Customer address book.
 *
 * The owning user id comes from `requireUser()` — the session cookie — and is
 * never read from the request body. A body-supplied `user_id` would let any
 * signed-in customer write into another customer's address book.
 */

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const addresses = await AccountService.getAddresses(auth.user.id);
  return NextResponse.json({ success: true, data: addresses });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const address = await AccountService.createAddress(auth.user.id, body);
    return NextResponse.json({ success: true, data: address }, { status: 201 });
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

    // Internal messages can carry schema detail; log them, return a generic one.
    console.error("[account/addresses] create failed:", error);
    return NextResponse.json(
      { success: false, error: { code: "ADDRESS_CREATE_FAILED", message: "Could not save that address." } },
      { status: 500 }
    );
  }
}
