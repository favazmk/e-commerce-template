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
    const excessiveQty = 9999;

    const result = await CartService.calculateCart([
      { productId: p1.id, variantId: p1.variants?.[0]?.id, quantity: excessiveQty },
    ]);

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThan(0);
    expect(result.validationErrors[0]).toContain("Insufficient stock");
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
