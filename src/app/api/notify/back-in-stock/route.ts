import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { LeadCaptureService } from "@/services/lead-capture.service";
import { getSessionUserId } from "@/lib/auth/session";
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

/**
 * "Notify me when this is back in stock".
 *
 * Rate-limited because the endpoint accepts an arbitrary email address: without
 * a limit it is a free mail-bombing service pointed at anyone's inbox.
 */
export async function POST(request: NextRequest) {
  const limit = checkRateLimit({
    name: "notify:back-in-stock",
    identifier: getClientIdentifier(request),
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit);

  try {
    const body = await request.json();
    // Signed-in shoppers get the request linked to their account; guests do not
    // need one. Either way the id comes from the session, never the body.
    const userId = await getSessionUserId();

    await LeadCaptureService.requestBackInStock(body, userId);

    return NextResponse.json({
      success: true,
      message: "We will email you as soon as it is back.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Enter a valid email address." } },
        { status: 400 }
      );
    }
    if ((error as Error)?.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "That product is unavailable." } },
        { status: 404 }
      );
    }

    console.error("[notify/back-in-stock] failed:", error);
    return NextResponse.json(
      { success: false, error: { code: "NOTIFY_FAILED", message: "Could not register your interest." } },
      { status: 500 }
    );
  }
}
