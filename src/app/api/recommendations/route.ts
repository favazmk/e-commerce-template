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
 * Recommendations for a client-side cart.
 *
 * The guest cart lives in localStorage, so the server cannot know its contents
 * without being told. Only product ids are accepted — never quantities, prices
 * or totals, which would be meaningless here and are recalculated server-side
 * everywhere they do matter.
 */

const requestSchema = z.object({
  productIds: z.array(z.string().uuid()).max(50).default([]),
  limit: z.number().int().min(1).max(8).default(4),
});

export async function POST(request: NextRequest) {
  const limit = checkRateLimit({
    name: "recommendations:cart",
    identifier: getClientIdentifier(request),
    ...RATE_LIMITS.publicRead,
  });
  if (!limit.allowed) return rateLimitResponse(limit);

  try {
    const body = await request.json();
    const { productIds, limit: max } = requestSchema.parse(body);

    const products =
      productIds.length > 0
        ? await RecommendationService.getCartRecommendations(productIds, { limit: max })
        : await RecommendationService.getBestSellers({ limit: max });

    return NextResponse.json(
      { success: true, data: products },
      { headers: { "Cache-Control": "private, max-age=60" } }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_REQUEST", message: "Invalid request." } },
        { status: 400 }
      );
    }

    console.error("[recommendations] failed:", error);
    // A recommendation strip is optional garnish: fail quietly with an empty
    // list rather than showing the shopper an error inside their cart.
    return NextResponse.json({ success: true, data: [] });
  }
}
