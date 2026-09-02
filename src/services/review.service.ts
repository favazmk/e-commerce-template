import { RepositoryFactory } from "@/repositories/repository.factory";
import { Review, ReviewStatus } from "@/types/database";
import { SettingsService } from "@/services/settings.service";

export interface ReviewSummary {
  average: number;
  count: number;
  /** How many reviews gave each star rating, for the distribution bars. */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export const EMPTY_REVIEW_SUMMARY: ReviewSummary = {
  average: 0,
  count: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

export interface SubmitReviewInput {
  productId: string;
  customerName: string;
  rating: number;
  title?: string;
  comment: string;
  userId?: string;
}

export class ReviewService {
  /**
   * Reviews a customer may read: approved only.
   *
   * Pending and rejected reviews are never exposed publicly — a rejected
   * review is usually spam or abuse, and a pending one has not been read yet.
   */
  static async getPublicReviews(productId: string): Promise<Review[]> {
    const repo = RepositoryFactory.getReviewRepository();
    return await repo.findByProductId(productId, "approved");
  }

  /**
   * Rating summary for one product, built from its approved reviews.
   */
  static async getSummary(productId: string): Promise<ReviewSummary> {
    const reviews = await this.getPublicReviews(productId);
    if (reviews.length === 0) return EMPTY_REVIEW_SUMMARY;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const review of reviews) {
      const rating = Math.min(5, Math.max(1, Math.round(review.rating)));
      distribution[rating] += 1;
      sum += rating;
    }

    return {
      average: Math.round((sum / reviews.length) * 10) / 10,
      count: reviews.length,
      distribution: distribution as ReviewSummary["distribution"],
    };
  }

  /**
   * Average and count for many products at once, for listing pages.
   */
  static async getSummariesFor(
    productIds: string[]
  ): Promise<Record<string, { average: number; count: number }>> {
    const repo = RepositoryFactory.getReviewRepository();
    return await repo.getApprovedSummaries(productIds);
  }

  /**
   * Submit a review.
   *
   * New reviews are always `pending`: nothing a stranger types reaches the
   * storefront until a human has read it. The feature switch is checked here
   * rather than only in the UI, so a disabled review section cannot be
   * bypassed by posting to the endpoint directly.
   */
  static async submitReview(input: SubmitReviewInput): Promise<Review> {
    const { reviews: reviewsEnabled } = await SettingsService.getStoreFeatures();
    if (!reviewsEnabled) {
      throw new Error("Reviews are not being accepted at the moment.");
    }

    const name = String(input.customerName || "").trim();
    if (name.length < 2 || name.length > 60) {
      throw new Error("Please give a name between 2 and 60 characters.");
    }

    const rating = Math.round(Number(input.rating));
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new Error("Please choose a rating from 1 to 5 stars.");
    }

    const comment = String(input.comment || "").trim();
    if (comment.length < 10) {
      throw new Error("Please write at least a sentence about the product.");
    }
    if (comment.length > 2000) {
      throw new Error("Please keep your review under 2000 characters.");
    }

    const title = String(input.title || "").trim().slice(0, 120) || null;

    // The product must exist and be one customers can actually see.
    const productRepo = RepositoryFactory.getProductRepository();
    const product = await productRepo.findById(input.productId);
    if (!product || product.status !== "active") {
      throw new Error("That product is not available for review.");
    }

    const repo = RepositoryFactory.getReviewRepository();
    return await repo.create({
      product_id: input.productId,
      user_id: input.userId || null,
      customer_name: name,
      rating,
      title,
      comment,
      status: "pending",
    });
  }

  // ------------------------------------------------------------- moderation

  /** Admin: every review, optionally filtered by status. */
  static async listForModeration(status?: ReviewStatus): Promise<Review[]> {
    const repo = RepositoryFactory.getReviewRepository();
    return await repo.findAll(status);
  }

  static async getById(id: string): Promise<Review | null> {
    const repo = RepositoryFactory.getReviewRepository();
    return await repo.findById(id);
  }

  /** Admin: approve or reject a review. */
  static async setStatus(id: string, status: ReviewStatus): Promise<Review | null> {
    if (!["pending", "approved", "rejected"].includes(status)) {
      throw new Error("A review can only be pending, approved or rejected.");
    }

    const repo = RepositoryFactory.getReviewRepository();
    await repo.updateStatus(id, status);
    return await repo.findById(id);
  }

  /** Admin: delete a review outright. */
  static async deleteReview(id: string): Promise<boolean> {
    const repo = RepositoryFactory.getReviewRepository();
    return await repo.delete(id);
  }
}
