import { Product, ProductVariant } from "../../types/database";
import { PaginatedResult as CommercePaginatedResult, ProductFilterParams as CommerceProductFilterParams } from "../../types/commerce";

/** A merchant-curated relation between two products, used by recommendations. */
export interface ProductRelation {
  related_product_id: string;
  relation_type: string;
  display_order: number;
}

/** One change applied across a selection of products in the catalogue table. */
export interface BulkProductChanges {
  status?: Product["status"];
  featured?: boolean;
  category_id?: string | null;
  /** Signed percentage, e.g. -20 for a 20% markdown across the selection. */
  price_change_percent?: number;
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findAll(params: CommerceProductFilterParams): Promise<CommercePaginatedResult<Product>>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  getVariantsByProductId(productId: string): Promise<ProductVariant[]>;
  create(data: Partial<Product>): Promise<Product>;
  update(id: string, data: Partial<Product>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;

  /** Copy a product as a draft, with fresh unique slug and SKUs. */
  duplicate(id: string, overrides?: { name?: string; sku?: string }): Promise<Product | null>;
  /** Apply one change to many products; returns how many were affected. */
  bulkUpdate(ids: string[], changes: BulkProductChanges): Promise<number>;
  /** Merchant-curated related / upsell products, for the admin editor. */
  getRelations(productId: string): Promise<ProductRelation[]>;
}
