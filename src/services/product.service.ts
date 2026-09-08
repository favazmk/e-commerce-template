import { RepositoryFactory } from "@/repositories/repository.factory";
import type {
  BulkProductChanges,
  ProductRelation,
} from "@/repositories/interfaces/product.repository.interface";
import { PaginatedResult, ProductFilterParams } from "@/types/commerce";
import { Product } from "@/types/database";
import { isPublished, scheduledPublishAt } from "@/lib/commerce/selling-rules";

/**
 * Raised when an admin payload describes a product that cannot exist.
 *
 * Distinct from a database error on purpose: the constraints in the schema are
 * the last line of defence, and a merchant should never meet one. "Sale price
 * must be below the regular price" is actionable; a Postgres check-constraint
 * name is not.
 */
export class ProductValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductValidationError";
  }
}

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
   * The storefront-visible product for a slug.
   *
   * Separate from `getProductBySlug`, which admin previews rely on: a product
   * scheduled for Friday must 404 for a shopper today and still open in the
   * editor. Collapsing the two is how an unreleased drop leaks.
   */
  static async getPublishedProductBySlug(slug: string): Promise<Product | null> {
    const product = await this.getProductBySlug(slug);
    if (!product || !isPublished(product)) return null;
    return product;
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
   *
   * `status` accepts the publish states plus two derived views the merchant
   * actually asks for — what is scheduled, and what is on sale — neither of
   * which is a column.
   */
  static async getAllAdminProducts(search?: string, status?: string): Promise<Product[]> {
    const repo = RepositoryFactory.getProductRepository();
    // Admin needs every publish state, including drafts and archived items.
    const result = await repo.findAll({ searchQuery: search, limit: 1000, status: "all" });
    let items = result.items;

    if (status === "scheduled") {
      items = items.filter((p) => scheduledPublishAt(p) !== null);
    } else if (status === "on_sale") {
      items = items.filter((p) => p.sale_price != null);
    } else if (status && status !== "all") {
      items = items.filter(p => p.status === status);
    }

    return items;
  }

  /**
   * Reject payloads the storefront could not render honestly.
   *
   * Everything checked here is also a database constraint. This layer exists to
   * turn each one into a sentence a merchant can act on, and to catch the
   * combinations the database cannot see — a variant priced against a sale
   * window that belongs to its parent, for instance.
   */
  static validate(data: Partial<Product>): void {
    const price = Number(data.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new ProductValidationError("Enter a price of zero or more.");
    }

    if (data.sale_price != null && data.sale_price !== ("" as any)) {
      const sale = Number(data.sale_price);
      if (!Number.isFinite(sale) || sale < 0) {
        throw new ProductValidationError("The sale price must be a number of zero or more.");
      }
      if (sale >= price) {
        throw new ProductValidationError(
          `The sale price (${sale}) must be below the regular price (${price}). ` +
            "A markdown that saves nothing shows the shopper a struck-through price with no saving."
        );
      }
    }

    if (data.sale_starts_at && data.sale_ends_at) {
      if (new Date(data.sale_ends_at) <= new Date(data.sale_starts_at)) {
        throw new ProductValidationError("The sale must end after it starts.");
      }
    }

    if ((data.sale_starts_at || data.sale_ends_at) && data.sale_price == null) {
      throw new ProductValidationError(
        "Set a sale price, or clear the sale dates — a scheduled sale with no price does nothing."
      );
    }

    const min = Number(data.min_purchase_quantity ?? 1);
    if (!Number.isFinite(min) || min < 1) {
      throw new ProductValidationError("The minimum purchase quantity must be at least 1.");
    }
    if (data.max_purchase_quantity != null) {
      const max = Number(data.max_purchase_quantity);
      if (!Number.isFinite(max) || max < min) {
        throw new ProductValidationError(
          "The maximum purchase quantity must be at least the minimum."
        );
      }
    }

    const options = data.options || [];
    if (options.length > 3) {
      throw new ProductValidationError(
        "A product can have at most 3 options (for example Size, Colour and Material)."
      );
    }
    const optionNames = options.map((o) => o.name?.trim().toLowerCase()).filter(Boolean);
    if (new Set(optionNames).size !== optionNames.length) {
      throw new ProductValidationError("Each option needs a different name.");
    }

    const variants = data.variants || [];
    const skus = variants.map((v) => v.sku?.trim()).filter(Boolean);
    if (new Set(skus).size !== skus.length) {
      throw new ProductValidationError(
        "Two variants share a SKU. Every variant needs its own, or stock movements cannot be attributed."
      );
    }
    for (const variant of variants) {
      if (variant.sale_price != null && Number(variant.sale_price) >= Number(variant.price)) {
        throw new ProductValidationError(
          `Variant "${variant.sku}" has a sale price at or above its regular price.`
        );
      }
    }
  }

  /**
   * Admin: Create a new product with variants, options and images
   */
  static async createProduct(data: Partial<Product>): Promise<Product> {
    this.validate(data);
    const repo = RepositoryFactory.getProductRepository();
    return (await repo.create(this.withDerivedFields(data))) as Product;
  }

  /**
   * Admin: Update an existing product
   */
  static async updateProduct(id: string, data: Partial<Product>): Promise<Product | null> {
    this.validate(data);
    const repo = RepositoryFactory.getProductRepository();
    return await repo.update(id, this.withDerivedFields(data));
  }

  /**
   * Fields the merchant should not have to think about.
   *
   * The important one is `published_at`: a product flipped from draft to active
   * with no launch date would sit behind the scheduling gate forever, saved and
   * approved and invisible. Publishing without a date means "now".
   */
  private static withDerivedFields(data: Partial<Product>): Partial<Product> {
    const next: Partial<Product> = { ...data };

    if (next.status === "active" && !next.published_at) {
      next.published_at = new Date().toISOString();
    }
    // A product pulled back to draft keeps whatever schedule it had: it is
    // normal to unpublish, fix a photo, and republish to the same launch time.
    // So nothing is cleared here — an absent field stays absent, and the
    // repository leaves the stored value alone.

    // A slug is derived, not typed, when the merchant leaves it blank.
    if (!next.slug && next.name) {
      next.slug = next.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }

    return next;
  }

  /**
   * Admin: Delete or archive a product
   */
  static async deleteProduct(id: string): Promise<boolean> {
    const repo = RepositoryFactory.getProductRepository();
    return await repo.delete(id);
  }

  /** Admin: copy a product as a draft, Shopify style. */
  static async duplicateProduct(
    id: string,
    overrides?: { name?: string; sku?: string }
  ): Promise<Product | null> {
    const repo = RepositoryFactory.getProductRepository();
    return await repo.duplicate(id, overrides);
  }

  /** Admin: apply one change across a selection of products. */
  static async bulkUpdate(ids: string[], changes: BulkProductChanges): Promise<number> {
    const clean = Array.from(new Set(ids.filter((id) => typeof id === "string" && id)));
    if (clean.length === 0) return 0;

    const percent = Number(changes.price_change_percent);
    if (Number.isFinite(percent) && (percent <= -100 || percent > 1000)) {
      throw new ProductValidationError(
        "A bulk price change must be between -99% and +1000%."
      );
    }

    const repo = RepositoryFactory.getProductRepository();
    return await repo.bulkUpdate(clean, changes);
  }

  /** Admin: the curated related / upsell products of one product. */
  static async getRelations(productId: string): Promise<ProductRelation[]> {
    const repo = RepositoryFactory.getProductRepository();
    return await repo.getRelations(productId);
  }
}
