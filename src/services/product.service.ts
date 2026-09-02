import { RepositoryFactory } from "@/repositories/repository.factory";
import { PaginatedResult, ProductFilterParams } from "@/types/commerce";
import { Product } from "@/types/database";

export class ProductService {
  /**
   * Get all active products with pagination, search, category, brand, stock, and sorting filters
   */
  static async getProducts(params: ProductFilterParams = {}): Promise<PaginatedResult<Product>> {
    const repo = RepositoryFactory.getProductRepository();
    return await repo.findAll(params);
  }

  /**
   * Get a single product by its URL slug
   */
  static async getProductBySlug(slug: string): Promise<Product | null> {
    const repo = RepositoryFactory.getProductRepository();
    return await repo.findBySlug(slug);
  }

  /**
   * Get a single product by its ID
   */
  static async getProductById(id: string): Promise<Product | null> {
    const repo = RepositoryFactory.getProductRepository();
    return await repo.findById(id);
  }

  /**
   * Get related products for product details page
   */
  static async getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
    const repo = RepositoryFactory.getProductRepository();
    const current = await repo.findById(productId);
    if (!current) return [];

    const result = await repo.findAll({ categorySlug: current.category?.slug, limit: limit + 1 });
    // Filter out the current product
    return result.items.filter(p => p.id !== productId).slice(0, limit);
  }

  /**
   * Admin: Get all products (including drafts and archived)
   */
  static async getAllAdminProducts(search?: string, status?: string): Promise<Product[]> {
    const repo = RepositoryFactory.getProductRepository();
    // Admin needs every publish state, including drafts and archived items.
    const result = await repo.findAll({ searchQuery: search, limit: 1000, status: "all" });
    let items = result.items;
    if (status && status !== "all") {
      items = items.filter(p => p.status === status);
    }
    return items;
  }

  /**
   * Admin: Create a new product with variants and images
   */
  static async createProduct(data: Partial<Product>): Promise<Product> {
    const repo = RepositoryFactory.getProductRepository();
    
    const slug = data.slug || (data.name || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    
    // We cast to omit id because we don't have it yet, repo handles it or we mock it.
    // For now we'll just mock the ID since repo interface doesn't have create yet.
    // We will add create, update, delete to interface.
    return (await repo.create(data)) as Product;
  }

  /**
   * Admin: Update an existing product
   */
  static async updateProduct(id: string, data: Partial<Product>): Promise<Product | null> {
    const repo = RepositoryFactory.getProductRepository();
    return await repo.update(id, data);
  }

  /**
   * Admin: Delete or archive a product
   */
  static async deleteProduct(id: string): Promise<boolean> {
    const repo = RepositoryFactory.getProductRepository();
    return await repo.delete(id);
  }
}
