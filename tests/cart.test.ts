import { describe, it, expect, beforeEach } from "vitest";
import { CartService } from "../src/services/cart.service";
import { RepositoryFactory } from "../src/repositories/repository.factory";
import { 
  MockProductRepository, 
  MockCartRepository, 
  MockCouponRepository, 
  MockSettingsRepository,
  resetMockData,
  mockData 
} from "./__mocks__/repositories";
import { Cart } from "../src/types/database";

describe("Commerce Core: Cart Service", () => {
  beforeEach(() => {
    RepositoryFactory.setOverride("ProductRepository", new MockProductRepository());
    RepositoryFactory.setOverride("CartRepository", new MockCartRepository());
    RepositoryFactory.setOverride("CouponRepository", new MockCouponRepository());
    RepositoryFactory.setOverride("SettingsRepository", new MockSettingsRepository());
    resetMockData();
  });

  it("should calculate cart subtotal correctly from live database prices", async () => {
    const p1 = mockData.products[0]; // Cashmere Overcoat ($495)
    
    // ensure stock
    p1.stock_quantity = 100;
    
    const result = await CartService.calculateCart([
      { productId: p1.id, variantId: p1.variants?.[0]?.id, quantity: 2 },
    ]);

    expect(result.isValid).toBe(true);
    expect(result.subtotal).toBe(990.0); // 495 * 2
    expect(result.items[0].unitPrice).toBe(495.0);
    expect(result.items[0].totalPrice).toBe(990.0);
  });

  it("should enforce stock limits and flag insufficient inventory", async () => {
    const p1 = mockData.products[0];
    // Above available stock (10) but within the per-line ceiling, so the
    // stock check is what must reject it.
    const excessiveQty = 50;

    const result = await CartService.calculateCart([
      { productId: p1.id, variantId: p1.variants?.[0]?.id, quantity: excessiveQty },
    ]);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThan(0);
    expect(result.validationErrors[0]).toContain("Insufficient stock");
  });

  it("should reject absurd client-supplied quantities before pricing them", async () => {
    const p1 = mockData.products[0];

    const result = await CartService.calculateCart([
      { productId: p1.id, variantId: p1.variants?.[0]?.id, quantity: 9999 },
    ]);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors[0]).toContain("Maximum");
    // The line must not reach the totals at all.
    expect(result.items).toHaveLength(0);
    expect(result.subtotal).toBe(0);
  });

  it("should ignore non-numeric and negative quantities", async () => {
    const p1 = mockData.products[0];

    const result = await CartService.calculateCart([
      { productId: p1.id, variantId: p1.variants?.[0]?.id, quantity: "abc" as any },
      { productId: p1.id, variantId: p1.variants?.[0]?.id, quantity: -5 },
    ]);

    expect(result.items).toHaveLength(0);
    expect(result.subtotal).toBe(0);
  });

  it("should merge guest items into customer cart without duplicate entries", async () => {
    const guestCart = { id: "guest_cart", guest_token: "guest_token_123", updated_at: new Date().toISOString(), created_at: new Date().toISOString() } as any;
    const userCart = { id: "user_cart", user_id: "user_123", updated_at: new Date().toISOString(), created_at: new Date().toISOString() } as any;
    
    mockData.carts.push(guestCart, userCart);
    
    mockData.cartItems.push({ id: "g1", cart_id: "guest_cart", product_id: "p1", variant_id: "v1", quantity: 2 } as any);
    mockData.cartItems.push({ id: "g2", cart_id: "guest_cart", product_id: "p2", quantity: 1 } as any);
    
    mockData.cartItems.push({ id: "u1", cart_id: "user_cart", product_id: "p1", variant_id: "v1", quantity: 1 } as any);
    mockData.cartItems.push({ id: "u2", cart_id: "user_cart", product_id: "p3", quantity: 4 } as any);

    await CartService.mergeGuestCart("guest_token_123", "user_123");

    const mergedItems = mockData.cartItems.filter(ci => ci.cart_id === "user_cart");
    expect(mergedItems.length).toBe(3); // p1-v1, p2, p3
    
    const p1Item = mergedItems.find((i) => i.product_id === "p1");
    expect(p1Item?.quantity).toBe(3); // 2 from guest + 1 from user
  });
});

/**
 * List-price tracking.
 *
 * The cart shows a "you save X" figure. It has to come from the same
 * server-side calculation as the amount charged — a saving computed in the
 * browser from stale product data is a price claim the merchant cannot back up.
 */
describe("Commerce Core: Cart list pricing", () => {
  beforeEach(() => {
    RepositoryFactory.setOverride("ProductRepository", new MockProductRepository());
    RepositoryFactory.setOverride("CartRepository", new MockCartRepository());
    RepositoryFactory.setOverride("CouponRepository", new MockCouponRepository());
    RepositoryFactory.setOverride("SettingsRepository", new MockSettingsRepository());
    resetMockData();
  });

  it("reports the marked-price subtotal alongside the selling subtotal", async () => {
    const product = mockData.products[0];
    product.stock_quantity = 100;
    product.compare_at_price = product.price + 100;
    if (product.variants?.[0]) {
      product.variants[0].compare_at_price = product.variants[0].price + 100;
    }

    const result = await CartService.calculateCart([
      { productId: product.id, variantId: product.variants?.[0]?.id, quantity: 2 },
    ]);

    expect(result.listSubtotal).toBe(result.subtotal + 200);
    expect(result.items[0].listPrice).toBe(result.items[0].unitPrice + 100);
  });

  it("falls back to the selling price when no marked price is set", async () => {
    const product = mockData.products[0];
    product.stock_quantity = 100;
    product.compare_at_price = null;
    if (product.variants?.[0]) product.variants[0].compare_at_price = null;

    const result = await CartService.calculateCart([
      { productId: product.id, variantId: product.variants?.[0]?.id, quantity: 1 },
    ]);

    // No fabricated "was" price, so no saving is implied.
    expect(result.listSubtotal).toBe(result.subtotal);
  });

  it("never reports a negative saving when the marked price is below the selling price", async () => {
    // Bad catalog data, not a markup. Clamping keeps the UI from showing
    // "You save -50", which reads as a bug to the customer.
    const product = mockData.products[0];
    product.stock_quantity = 100;
    product.compare_at_price = product.price - 50;
    if (product.variants?.[0]) {
      product.variants[0].compare_at_price = product.variants[0].price - 50;
    }

    const result = await CartService.calculateCart([
      { productId: product.id, variantId: product.variants?.[0]?.id, quantity: 1 },
    ]);

    expect(result.listSubtotal).toBeGreaterThanOrEqual(result.subtotal);
  });
});
