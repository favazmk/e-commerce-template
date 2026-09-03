import {
  BundleRelationType,
  IMerchandisingRepository,
  ProductStats,
} from "../interfaces/merchandising.repository.interface";
import { Product } from "../../types/database";
import { SupabaseRepository } from "./base.repository";

const PRODUCT_SELECT = "*, category:categories(*), images:product_images(*), variants:product_variants(*)";

export class SupabaseMerchandisingRepository
  extends SupabaseRepository
  implements IMerchandisingRepository
{
  /**
   * Merchandising reads render inside cached catalog pages, the same context
   * the product repository documents. Everything returned here is public
   * catalog data or an aggregate — never a customer, order or payment row.
   */
  private catalog() {
    return this.serviceClient("public-catalog-cached");
  }

  async getProductStats(productIds: string[]): Promise<Map<string, ProductStats>> {
    const stats = new Map<string, ProductStats>();
    if (productIds.length === 0) return stats;

    const { data, error } = await this.catalog()
      .from("product_stats")
      .select("*")
      .in("product_id", productIds);

    if (error) {
      // Social proof is an enhancement. A store must still sell when the stats
      // view is unavailable, so this degrades to "no badges" rather than a 500.
      console.error("[merchandising] product_stats read failed:", error.message);
      return stats;
    }

    for (const row of data || []) {
      stats.set((row as ProductStats).product_id, {
        product_id: (row as any).product_id,
        review_count: Number((row as any).review_count) || 0,
        average_rating: Number((row as any).average_rating) || 0,
        units_sold: Number((row as any).units_sold) || 0,
        units_sold_30d: Number((row as any).units_sold_30d) || 0,
      });
    }

    return stats;
  }

  async getCoPurchasedProductIds(productId: string, limit: number): Promise<string[]> {
    const { data, error } = await this.catalog().rpc("get_frequently_bought_together", {
      p_product_id: productId,
      p_limit: limit,
    });

    if (error) {
      console.error("[merchandising] co-purchase lookup failed:", error.message);
      return [];
    }

    return (data || []).map((row: { product_id: string }) => row.product_id);
  }

  async getCuratedRelatedProductIds(
    productId: string,
    relationType: BundleRelationType,
    limit: number
  ): Promise<string[]> {
    const { data, error } = await this.catalog()
      .from("product_bundles")
      .select("related_product_id")
      .eq("product_id", productId)
      .eq("relation_type", relationType)
      .order("display_order", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("[merchandising] curated bundle read failed:", error.message);
      return [];
    }

    return (data || []).map((row: { related_product_id: string }) => row.related_product_id);
  }

  async getActiveProductsByIds(productIds: string[]): Promise<Product[]> {
    if (productIds.length === 0) return [];

    const { data, error } = await this.catalog()
      .from("products")
      .select(PRODUCT_SELECT)
      .in("id", productIds)
      .eq("status", "active");

    if (error) {
      console.error("[merchandising] product hydration failed:", error.message);
      return [];
    }

    // `in()` returns rows in arbitrary order; the caller's ranking is the whole
    // point of a recommendation, so it is reapplied here.
    const byId = new Map((data || []).map((row: any) => [row.id as string, row as Product]));
    return productIds
      .map((id) => byId.get(id))
      .filter((product): product is Product => Boolean(product));
  }

  async getBestSellerProductIds(limit: number, withinDays = 30): Promise<string[]> {
    const column = withinDays <= 30 ? "units_sold_30d" : "units_sold";

    const { data, error } = await this.catalog()
      .from("product_stats")
      .select(`product_id, ${column}`)
      .gt(column, 0)
      .order(column, { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[merchandising] best-seller read failed:", error.message);
      return [];
    }

    return (data || []).map((row: any) => row.product_id as string);
  }
}
