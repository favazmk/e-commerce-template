import { Review, ReviewStatus } from "../../types/database";

export interface IReviewRepository {
  findByProductId(productId: string, status?: ReviewStatus): Promise<Review[]>;
  /** Every review across the catalog, for the moderation queue. */
  findAll(status?: ReviewStatus): Promise<Review[]>;
  findById(id: string): Promise<Review | null>;
  create(review: Omit<Review, "id" | "created_at" | "updated_at">): Promise<Review>;
  updateStatus(reviewId: string, status: ReviewStatus): Promise<void>;
  delete(id: string): Promise<boolean>;
  /** Average rating and count of approved reviews, keyed by product id. */
  getApprovedSummaries(productIds: string[]): Promise<Record<string, { average: number; count: number }>>;
}
