import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RepositoryFactory } from "../src/repositories/repository.factory";
import { RecommendationService } from "../src/services/recommendation.service";
import type {
  BundleRelationType,
  IMerchandisingRepository,
  ProductStats,
} from "../src/repositories/interfaces/merchandising.repository.interface";
import type { IProductRepository } from "../src/repositories/interfaces/product.repository.interface";
import type { Product } from "../src/types/database";

function makeProduct(overrides: Partial<Product> & { id: string }): Product {
  return {
    name: `Product ${overrides.id}`,
    slug: `product-${overrides.id}`,
    description: "",
    short_description: "",
    sku: `SKU-${overrides.id}`,
    price: 100,
    currency: "AED",
    stock_quantity: 10,
    low_stock_threshold: 5,
    status: "active",
    featured: false,
    tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Product;
}

class FakeMerchandisingRepository implements IMerchandisingRepository {
  catalog = new Map<string, Product>();
  coPurchases = new Map<string, string[]>();
  curated = new Map<string, string[]>();
  bestSellers: string[] = [];
  stats = new Map<string, ProductStats>();

  /** Call log, so tests can assert the cascade stopped where it should. */
  calls: string[] = [];

  async getProductStats(productIds: string[]) {
    const result = new Map<string, ProductStats>();
    for (const id of productIds) {
      const entry = this.stats.get(id);
      if (entry) result.set(id, entry);
    }
    return result;
  }

  async getCoPurchasedProductIds(productId: string, limit: number) {
    this.calls.push(`coPurchase:${productId}`);
    return (this.coPurchases.get(productId) || []).slice(0, limit);
  }

  async getCuratedRelatedProductIds(
    productId: string,
    relationType: BundleRelationType,
    limit: number
  ) {
    this.calls.push(`curated:${productId}:${relationType}`);
    return (this.curated.get(`${productId}:${relationType}`) || []).slice(0, limit);
  }

  async getActiveProductsByIds(productIds: string[]) {
    return productIds
      .map((id) => this.catalog.get(id))
      .filter((product): product is Product => Boolean(product));
  }

  async getBestSellerProductIds(limit: number) {
    this.calls.push("bestSellers");
    return this.bestSellers.slice(0, limit);
  }
}

class FakeProductRepository implements Partial<IProductRepository> {
  constructor(private readonly catalog: Map<string, Product>) {}

  async findById(id: string) {
    return this.catalog.get(id) || null;
  }

  async findAll(params: { categorySlug?: string; brand?: string; limit?: number }) {
    const items = [...this.catalog.values()].filter((product) => {
      if (params.categorySlug && product.category?.slug !== params.categorySlug) return false;
      if (params.brand && product.brand !== params.brand) return false;
      return true;
    });
    return { items, total: items.length, page: 1, limit: params.limit || 12, totalPages: 1 };
  }

  async getFeaturedProducts(limit = 4) {
    return [...this.catalog.values()].filter((product) => product.featured).slice(0, limit);
  }
}

describe("RecommendationService", () => {
  let merchandising: FakeMerchandisingRepository;

  beforeEach(() => {
    merchandising = new FakeMerchandisingRepository();

    const category = { id: "cat-1", slug: "candles", name: "Candles" } as never;

    // An anchor plus a few companions, one of which is out of stock.
    merchandising.catalog.set("anchor", makeProduct({ id: "anchor", price: 200, category }));
    merchandising.catalog.set("curated-1", makeProduct({ id: "curated-1", price: 60, category }));
    merchandising.catalog.set("copurchase-1", makeProduct({ id: "copurchase-1", price: 80, category }));
    merchandising.catalog.set(
      "soldout",
      makeProduct({ id: "soldout", price: 50, stock_quantity: 0, category })
    );
    merchandising.catalog.set("bestseller-1", makeProduct({ id: "bestseller-1", price: 300, category }));
    merchandising.catalog.set("near-price", makeProduct({ id: "near-price", price: 210, category }));
    merchandising.catalog.set("far-price", makeProduct({ id: "far-price", price: 900, category }));

    RepositoryFactory.setOverride("MerchandisingRepository", merchandising);
    RepositoryFactory.setOverride(
      "ProductRepository",
      new FakeProductRepository(merchandising.catalog)
    );
  });

  afterEach(() => {
    RepositoryFactory.clearOverrides();
  });

  describe("getFrequentlyBoughtTogether", () => {
    it("prefers a merchant's curated pairing over inferred co-purchases", async () => {
      // A merchant who said "this candle goes with that holder" knows
      // something the order data does not.
      merchandising.curated.set("anchor:bundle", ["curated-1"]);
      merchandising.coPurchases.set("anchor", ["copurchase-1"]);

      const result = await RecommendationService.getFrequentlyBoughtTogether("anchor", { limit: 1 });

      expect(result.map((product) => product.id)).toEqual(["curated-1"]);
    });

    it("falls back to co-purchase history when nothing is curated", async () => {
      merchandising.coPurchases.set("anchor", ["copurchase-1"]);

      const result = await RecommendationService.getFrequentlyBoughtTogether("anchor", { limit: 2 });

      expect(result.map((product) => product.id)).toContain("copurchase-1");
    });

    it("never recommends the product being viewed", async () => {
      merchandising.coPurchases.set("anchor", ["anchor", "copurchase-1"]);

      const result = await RecommendationService.getFrequentlyBoughtTogether("anchor");

      expect(result.map((product) => product.id)).not.toContain("anchor");
    });

    it("drops out-of-stock companions", async () => {
      // A sold-out suggestion wastes the slot and frustrates the shopper.
      merchandising.coPurchases.set("anchor", ["soldout", "copurchase-1"]);

      const result = await RecommendationService.getFrequentlyBoughtTogether("anchor", { limit: 2 });

      expect(result.map((product) => product.id)).not.toContain("soldout");
    });

    it("still returns something for a brand-new store with no order history", async () => {
      // Cold start: no curated pairs, no co-purchases. The widget must not sit
      // empty for the first months of trading.
      const result = await RecommendationService.getFrequentlyBoughtTogether("anchor", { limit: 2 });

      expect(result.length).toBeGreaterThan(0);
      expect(result.map((product) => product.id)).not.toContain("anchor");
    });
  });

  describe("getSimilarProducts", () => {
    it("ranks by closeness in price within the category", async () => {
      // A shopper looking at a 200 item has signalled their budget.
      const result = await RecommendationService.getSimilarProducts("anchor", { limit: 2 });
      const ids = result.map((product) => product.id);

      expect(ids[0]).toBe("near-price");
      expect(ids).not.toContain("anchor");
    });

    it("returns nothing for an unknown product rather than throwing", async () => {
      expect(await RecommendationService.getSimilarProducts("does-not-exist")).toEqual([]);
    });
  });

  describe("getCartRecommendations", () => {
    it("scores a companion higher when it pairs with several cart lines", async () => {
      merchandising.coPurchases.set("curated-1", ["bestseller-1"]);
      merchandising.coPurchases.set("copurchase-1", ["bestseller-1", "near-price"]);

      const result = await RecommendationService.getCartRecommendations(
        ["curated-1", "copurchase-1"],
        { limit: 2 }
      );

      expect(result[0].id).toBe("bestseller-1");
    });

    it("never recommends something already in the bag", async () => {
      merchandising.coPurchases.set("curated-1", ["copurchase-1"]);

      const result = await RecommendationService.getCartRecommendations([
        "curated-1",
        "copurchase-1",
      ]);

      expect(result.map((product) => product.id)).not.toContain("copurchase-1");
    });

    it("returns nothing for an empty cart", async () => {
      expect(await RecommendationService.getCartRecommendations([])).toEqual([]);
    });

    it("caps the fan-out so a large cart does not fire one query per line", async () => {
      const bigCart = Array.from({ length: 40 }, (_, index) => `line-${index}`);

      await RecommendationService.getCartRecommendations(bigCart);

      const coPurchaseCalls = merchandising.calls.filter((call) => call.startsWith("coPurchase:"));
      expect(coPurchaseCalls.length).toBeLessThanOrEqual(8);
    });
  });

  describe("getBestSellers", () => {
    it("uses real sales when there are any", async () => {
      merchandising.bestSellers = ["bestseller-1"];

      const result = await RecommendationService.getBestSellers({ limit: 3 });

      expect(result.map((product) => product.id)).toEqual(["bestseller-1"]);
    });

    it("falls back to the merchant's featured picks before any sales exist", async () => {
      merchandising.catalog.set(
        "featured-1",
        makeProduct({ id: "featured-1", featured: true, price: 120 })
      );

      const result = await RecommendationService.getBestSellers({ limit: 3 });

      expect(result.map((product) => product.id)).toContain("featured-1");
    });
  });

  describe("withStats", () => {
    it("attaches stats where they exist and null where they do not", async () => {
      merchandising.stats.set("anchor", {
        product_id: "anchor",
        review_count: 12,
        average_rating: 4.5,
        units_sold: 90,
        units_sold_30d: 12,
      });

      const result = await RecommendationService.withStats([
        merchandising.catalog.get("anchor")!,
        merchandising.catalog.get("curated-1")!,
      ]);

      expect(result[0].stats?.average_rating).toBe(4.5);
      expect(result[1].stats).toBeNull();
    });

    it("handles an empty list without querying", async () => {
      expect(await RecommendationService.withStats([])).toEqual([]);
    });
  });
});
