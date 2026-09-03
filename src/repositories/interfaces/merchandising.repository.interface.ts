import { Product } from "../../types/database";

/** Social-proof aggregates for one product, derived from real rows. */
export interface ProductStats {
  product_id: string;
  review_count: number;
  average_rating: number;
  units_sold: number;
  units_sold_30d: number;
}

export type BundleRelationType = "bundle" | "similar" | "upsell";

export interface IMerchandisingRepository {
  /** Ratings and units sold for a set of products, keyed by product id. */
  getProductStats(productIds: string[]): Promise<Map<string, ProductStats>>;

  /**
   * Products most often bought in the same order as `productId`, ordered by
   * co-purchase frequency. Empty for a store with no order history yet.
   */
  getCoPurchasedProductIds(productId: string, limit: number): Promise<string[]>;

  /** Merchant-curated relations, used as the cold-start fallback. */
  getCuratedRelatedProductIds(
    productId: string,
    relationType: BundleRelationType,
    limit: number
  ): Promise<string[]>;

  /** Hydrate ids into full active products, preserving the order given. */
  getActiveProductsByIds(productIds: string[]): Promise<Product[]>;

  /**
   * Best sellers over a recent window, for the homepage and empty-state
   * recommendation slots.
   */
  getBestSellerProductIds(limit: number, withinDays?: number): Promise<string[]>;
}
