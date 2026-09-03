import { RepositoryFactory } from "@/repositories/repository.factory";
import type { ProductStats } from "@/repositories/interfaces/merchandising.repository.interface";
import type { Product } from "@/types/database";

/**
 * Product recommendation engine.
 *
 * Deliberately rules-based rather than machine-learned. A new client store has
 * no interaction history on day one, so a model would have nothing to learn
 * from; a cascade of increasingly general strategies always returns something
 * useful, and gets sharper on its own as real orders accumulate.
 *
 * The cascade, strongest signal first:
 *   1. merchant-curated relations (an explicit editorial decision)
 *   2. real co-purchase history  ("people who bought this also bought…")
 *   3. same category, similar price band
 *   4. same brand
 *   5. best sellers
 *
 * Every strategy is filtered to active, in-stock products: recommending a
 * sold-out item wastes the slot and frustrates the shopper.
 */

export interface RecommendationOptions {
  limit?: number;
  /** Products already on screen or in the cart; never recommend these back. */
  excludeProductIds?: string[];
  /** Drop out-of-stock products. On by default. */
  inStockOnly?: boolean;
}

export interface ProductWithStats {
  product: Product;
  stats: ProductStats | null;
}

const DEFAULT_LIMIT = 4;

function dedupe(ids: string[], exclude: Set<string>): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const id of ids) {
    if (!id || exclude.has(id) || seen.has(id)) continue;
    seen.add(id);
    output.push(id);
  }
  return output;
}

export class RecommendationService {
  /**
   * "Frequently bought together" — the bundle offered on the product page.
   *
   * Curated relations win over inferred ones: a merchant who has said "this
   * candle goes with that holder" knows something the order data does not.
   */
  static async getFrequentlyBoughtTogether(
    productId: string,
    options: RecommendationOptions = {}
  ): Promise<Product[]> {
    const limit = options.limit ?? 3;
    const exclude = new Set([productId, ...(options.excludeProductIds || [])]);
    const repo = RepositoryFactory.getMerchandisingRepository();

    const curated = await repo.getCuratedRelatedProductIds(productId, "bundle", limit);
    let ids = dedupe(curated, exclude);

    if (ids.length < limit) {
      const coPurchased = await repo.getCoPurchasedProductIds(productId, limit * 2);
      ids = dedupe([...ids, ...coPurchased], exclude);
    }

    // Still nothing (a brand-new catalog): fall back to same-category items, so
    // the widget is useful from the first day rather than hidden for months.
    if (ids.length === 0) {
      const similar = await this.getSimilarProducts(productId, { ...options, limit });
      return similar.slice(0, limit);
    }

    const products = await repo.getActiveProductsByIds(ids.slice(0, limit * 2));
    return this.applyStockFilter(products, options).slice(0, limit);
  }

  /**
   * "You may also like" — alternatives to the product being viewed.
   *
   * Ranked by closeness in price within the same category, because a shopper
   * comparing options has already signalled their budget by what they clicked.
   */
  static async getSimilarProducts(
    productId: string,
    options: RecommendationOptions = {}
  ): Promise<Product[]> {
    const limit = options.limit ?? DEFAULT_LIMIT;
    const exclude = new Set([productId, ...(options.excludeProductIds || [])]);
    const merchandising = RepositoryFactory.getMerchandisingRepository();
    const products = RepositoryFactory.getProductRepository();

    const current = await products.findById(productId);
    if (!current) return [];

    const curated = await merchandising.getCuratedRelatedProductIds(productId, "similar", limit);
    const curatedIds = dedupe(curated, exclude);

    const candidates: Product[] = [];

    if (curatedIds.length > 0) {
      candidates.push(...(await merchandising.getActiveProductsByIds(curatedIds)));
    }

    if (candidates.length < limit && current.category?.slug) {
      const sameCategory = await products.findAll({
        categorySlug: current.category.slug,
        limit: limit * 5,
      });
      candidates.push(...sameCategory.items);
    }

    if (candidates.length < limit && current.brand) {
      const sameBrand = await products.findAll({ brand: current.brand, limit: limit * 3 });
      candidates.push(...sameBrand.items);
    }

    const ranked = this.rankByPriceProximity(candidates, current.price, exclude);
    const filtered = this.applyStockFilter(ranked, options);

    if (filtered.length >= limit) return filtered.slice(0, limit);

    // Top up from best sellers so the row is never half-empty, which reads as
    // a broken page rather than a short list.
    const fillerIds = await merchandising.getBestSellerProductIds(limit * 3);
    const fillerExclude = new Set([...exclude, ...filtered.map((product) => product.id)]);
    const filler = await merchandising.getActiveProductsByIds(
      dedupe(fillerIds, fillerExclude).slice(0, limit)
    );

    return [...filtered, ...this.applyStockFilter(filler, options)].slice(0, limit);
  }

  /**
   * Cart page recommendations: complements to what is already in the bag.
   *
   * Aggregates the co-purchase signal across every cart line, so a two-item
   * cart gets recommendations that suit the combination rather than only the
   * last item added.
   */
  static async getCartRecommendations(
    cartProductIds: string[],
    options: RecommendationOptions = {}
  ): Promise<Product[]> {
    const limit = options.limit ?? DEFAULT_LIMIT;
    if (cartProductIds.length === 0) return [];

    const repo = RepositoryFactory.getMerchandisingRepository();
    const exclude = new Set([...cartProductIds, ...(options.excludeProductIds || [])]);

    // Score by how many distinct cart lines suggest the same companion — an
    // item that pairs with everything in the bag is the strongest offer.
    const scores = new Map<string, number>();

    // Cap the fan-out: a 40-line cart must not fire 40 sequential RPCs.
    for (const productId of cartProductIds.slice(0, 8)) {
      const [coPurchased, curated] = await Promise.all([
        repo.getCoPurchasedProductIds(productId, 6),
        repo.getCuratedRelatedProductIds(productId, "bundle", 4),
      ]);

      curated.forEach((id, index) => {
        if (exclude.has(id)) return;
        // Curated relations are worth more than inferred ones, and earlier
        // positions in a curated list are worth more than later ones.
        scores.set(id, (scores.get(id) || 0) + 10 - index);
      });

      coPurchased.forEach((id, index) => {
        if (exclude.has(id)) return;
        scores.set(id, (scores.get(id) || 0) + 5 - index * 0.5);
      });
    }

    let ids = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .slice(0, limit * 2);

    if (ids.length === 0) {
      ids = dedupe(await repo.getBestSellerProductIds(limit * 3), exclude);
    }

    const products = await repo.getActiveProductsByIds(ids);
    return this.applyStockFilter(products, options).slice(0, limit);
  }

  /** Hydrate ids the browser remembered locally into renderable products. */
  static async getProductsByIds(
    productIds: string[],
    options: RecommendationOptions = {}
  ): Promise<Product[]> {
    if (productIds.length === 0) return [];
    const exclude = new Set(options.excludeProductIds || []);
    const repo = RepositoryFactory.getMerchandisingRepository();
    const products = await repo.getActiveProductsByIds(
      dedupe(productIds, exclude).slice(0, options.limit ?? 12)
    );
    return products;
  }

  /** Best sellers, for homepage rails and empty recommendation slots. */
  static async getBestSellers(options: RecommendationOptions = {}): Promise<Product[]> {
    const limit = options.limit ?? 8;
    const repo = RepositoryFactory.getMerchandisingRepository();
    const exclude = new Set(options.excludeProductIds || []);

    const ids = dedupe(await repo.getBestSellerProductIds(limit * 2), exclude);
    if (ids.length === 0) {
      // No sales yet: featured products are the merchant's own answer to
      // "what should a first-time visitor see".
      const featured = await RepositoryFactory.getProductRepository().getFeaturedProducts(limit);
      return this.applyStockFilter(featured, options).slice(0, limit);
    }

    const products = await repo.getActiveProductsByIds(ids);
    return this.applyStockFilter(products, options).slice(0, limit);
  }

  /** Attach social-proof aggregates to a list of products in one round trip. */
  static async withStats(products: Product[]): Promise<ProductWithStats[]> {
    if (products.length === 0) return [];
    const repo = RepositoryFactory.getMerchandisingRepository();
    const stats = await repo.getProductStats(products.map((product) => product.id));
    return products.map((product) => ({
      product,
      stats: stats.get(product.id) ?? null,
    }));
  }

  /** Aggregates for a single product. */
  static async getStats(productId: string): Promise<ProductStats | null> {
    const repo = RepositoryFactory.getMerchandisingRepository();
    const stats = await repo.getProductStats([productId]);
    return stats.get(productId) ?? null;
  }

  // ---------------------------------------------------------------------------

  private static rankByPriceProximity(
    candidates: Product[],
    referencePrice: number,
    exclude: Set<string>
  ): Product[] {
    const seen = new Set<string>();
    const unique: Product[] = [];

    for (const candidate of candidates) {
      if (exclude.has(candidate.id) || seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      unique.push(candidate);
    }

    return unique.sort((a, b) => {
      const distanceA = Math.abs(a.price - referencePrice);
      const distanceB = Math.abs(b.price - referencePrice);
      if (distanceA !== distanceB) return distanceA - distanceB;
      // Tie-break on featured, so merchant intent decides between equals.
      return Number(b.featured) - Number(a.featured);
    });
  }

  private static applyStockFilter(
    products: Product[],
    options: RecommendationOptions
  ): Product[] {
    if (options.inStockOnly === false) return products;
    return products.filter((product) => product.stock_quantity > 0);
  }
}
