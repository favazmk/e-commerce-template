import { Product, ProductVariant } from "../../types/database";
import { PaginatedResult as CommercePaginatedResult, ProductFilterParams as CommerceProductFilterParams } from "../../types/commerce";

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findAll(params: CommerceProductFilterParams): Promise<CommercePaginatedResult<Product>>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  getVariantsByProductId(productId: string): Promise<ProductVariant[]>;
  create(data: Partial<Product>): Promise<Product>;
  update(id: string, data: Partial<Product>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
}
