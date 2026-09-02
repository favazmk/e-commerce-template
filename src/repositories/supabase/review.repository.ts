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

  async findAll(status?: ReviewStatus): Promise<Review[]> {
    let query = this.admin()
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error || !data) return [];
    return data as Review[];
  }

  async findById(id: string): Promise<Review | null> {
    const { data, error } = await this.admin()
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Review;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.admin().from('reviews').delete().eq('id', id);
    return !error;
  }

  /**
   * Average rating and count per product, counting approved reviews only.
   *
   * Fetched in one query for a whole page of products rather than one query per
   * card, which is the difference between a listing page issuing 1 request and
   * issuing 24.
   */
  async getApprovedSummaries(
    productIds: string[]
  ): Promise<Record<string, { average: number; count: number }>> {
    if (productIds.length === 0) return {};

    const { data, error } = await this.catalog()
      .from('reviews')
      .select('product_id, rating')
      .eq('status', 'approved')
      .in('product_id', productIds);

    if (error || !data) return {};

    const totals: Record<string, { sum: number; count: number }> = {};
    for (const row of data as Array<{ product_id: string; rating: number }>) {
      const bucket = totals[row.product_id] || { sum: 0, count: 0 };
      bucket.sum += Number(row.rating) || 0;
      bucket.count += 1;
      totals[row.product_id] = bucket;
    }

    const summaries: Record<string, { average: number; count: number }> = {};
    for (const [productId, { sum, count }] of Object.entries(totals)) {
      summaries[productId] = {
        average: Math.round((sum / count) * 10) / 10,
        count,
      };
    }
    return summaries;
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
