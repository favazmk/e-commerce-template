import { Review, ReviewStatus } from "../../types/database";

export interface IReviewRepository {
  findByProductId(productId: string, status?: ReviewStatus): Promise<Review[]>;
  create(review: Omit<Review, "id" | "created_at" | "updated_at">): Promise<Review>;
  updateStatus(reviewId: string, status: ReviewStatus): Promise<void>;
}
