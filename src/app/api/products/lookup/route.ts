import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { RecommendationService } from "@/services/recommendation.service";
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

/**
 * Resolve a list of product ids into renderable products.
 *
 * Backs the "recently viewed" strip, whose ids live in the visitor's own
 * localStorage rather than on the server. Returns active products only, so a
 * remembered id for a since-archived product simply drops out of the strip.
 */

const requestSchema = z.object({
  // Capped: this endpoint must not become a way to dump the whole catalog in
  // one request, and the strip never shows more than a dozen anyway.
  ids: z.array(z.string().uuid()).min(1).max(12),
});

export async function POST(request: NextRequest) {
  const limit = checkRateLimit({
    name: "products:lookup",
    identifier: getClientIdentifier(request),
    ...RATE_LIMITS.publicRead,
  });
  if (!limit.allowed) return rateLimitResponse(limit);

  try {
    const body = await request.json();
    const { ids } = requestSchema.parse(body);

    const products = await RecommendationService.getProductsByIds(ids, { limit: ids.length });

    return NextResponse.json(
      { success: true, data: products },
      { headers: { "Cache-Control": "private, max-age=60" } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_REQUEST", message: "Invalid product list." } },
        { status: 400 }
      );
    }

    console.error("[products/lookup] failed:", error);
    return NextResponse.json(
      { success: false, error: { code: "LOOKUP_FAILED", message: "Could not load products." } },
      { status: 500 }
    );
  }
}
