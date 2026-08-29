import { IReviewRepository } from "../interfaces/review.repository.interface";
import { Review, ReviewStatus } from "../../types/database";
import { createAdminClient } from "../../lib/supabase/server";

export class SupabaseReviewRepository implements IReviewRepository {
  private getClient() {
    return createAdminClient();
  }

  async findByProductId(productId: string, status?: ReviewStatus): Promise<Review[]> {
    let query = this.getClient()
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
    const { data, error } = await this.getClient()
      .from('reviews')
      .insert([review])
      .select()
      .single();

    if (error || !data) throw new Error("Failed to create review");
    return data as Review;
  }

  async updateStatus(reviewId: string, status: ReviewStatus): Promise<void> {
    const { error } = await this.getClient()
      .from('reviews')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', reviewId);

    if (error) throw new Error("Failed to update review status");
  }
}
