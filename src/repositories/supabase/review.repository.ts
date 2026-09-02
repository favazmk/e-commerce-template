import { IReviewRepository } from "../interfaces/review.repository.interface";
import { Review, ReviewStatus } from "../../types/database";
import { SupabaseRepository } from "./base.repository";

export class SupabaseReviewRepository extends SupabaseRepository implements IReviewRepository {
  /**
   * Approved reviews are public and render on cached product pages.
   */
  private catalog() {
    return this.serviceClient("public-catalog-cached");
  }

  /**
   * Review submission accepts guest reviews, which have no session.
   */
  private system() {
    return this.serviceClient("system-no-session");
  }

  /**
   * Moderation is an admin action.
   */
  private admin() {
    return this.serviceClient("admin-authorised");
  }

  async findByProductId(productId: string, status?: ReviewStatus): Promise<Review[]> {
    let query = this.catalog()
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as Review[];
  }

  async create(review: Omit<Review, "id" | "created_at" | "updated_at">): Promise<Review> {
    const { data, error } = await this.system()
      .from('reviews')
      .insert([review])
      .select()
      .single();

    if (error || !data) throw new Error("Failed to create review");
    return data as Review;
  }

  async updateStatus(reviewId: string, status: ReviewStatus): Promise<void> {
    const { error } = await this.admin()
      .from('reviews')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', reviewId);

    if (error) throw new Error("Failed to update review status");
  }
}
