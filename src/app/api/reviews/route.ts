import { NextRequest, NextResponse } from "next/server";
import { ReviewService } from "@/services/review.service";
import { getSessionUserId } from "@/lib/auth/session";

/** GET /api/reviews?productId=… — approved reviews for one product. */
export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");

  if (!productId) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "A product is required." } },
      { status: 400 }
    );
  }

  try {
    const [reviews, summary] = await Promise.all([
      ReviewService.getPublicReviews(productId),
      ReviewService.getSummary(productId),
    ]);
    return NextResponse.json({ success: true, data: { reviews, summary } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_REVIEWS_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews — submit a review.
 *
 * Open to guests as well as signed-in customers. Identity, when there is one,
 * comes from the session cookie; a user id in the body would be attacker
 * controlled and is ignored.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = await getSessionUserId();

    const review = await ReviewService.submitReview({
      productId: body.productId,
      customerName: body.customerName,
      rating: body.rating,
      title: body.title,
      comment: body.comment,
      userId,
    });

    return NextResponse.json({
      success: true,
      data: { id: review.id, status: review.status },
      message: "Thank you — your review will appear once it has been checked.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SUBMIT_REVIEW_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
