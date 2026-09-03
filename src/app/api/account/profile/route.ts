import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AccountService } from "@/services/account.service";
import { requireUser } from "@/lib/auth/session";

/**
 * Update the signed-in customer's own profile.
 *
 * The route deliberately exposes no user id parameter at all: there is exactly
 * one profile this endpoint can write, and it is the caller's.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const updated = await AccountService.updateProfile(auth.user.id, body);
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

    console.error("[account/profile] update failed:", error);
    return NextResponse.json(
      { success: false, error: { code: "PROFILE_UPDATE_FAILED", message: "Could not update your details." } },
      { status: 500 }
    );
  }
}
