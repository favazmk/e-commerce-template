import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { LeadCaptureService } from "@/services/lead-capture.service";
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

/** Newsletter sign-up from the homepage section or the footer. */
export async function POST(request: NextRequest) {
  const limit = checkRateLimit({
    name: "newsletter:subscribe",
    identifier: getClientIdentifier(request),
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit);

  try {
    const body = await request.json();
    await LeadCaptureService.subscribeToNewsletter(body);

    return NextResponse.json({ success: true, message: "You are on the list." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Enter a valid email address." } },
        { status: 400 }
      );
    }

    console.error("[newsletter] subscribe failed:", error);
    return NextResponse.json(
      { success: false, error: { code: "SUBSCRIBE_FAILED", message: "Could not sign you up right now." } },
      { status: 500 }
    );
  }
}
