import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { RepositoryFactory } from '../../src/repositories/repository.factory';

describe('Integration: Persistence', () => {
  let productRepo = RepositoryFactory.getProductRepository();
  let cartRepo = RepositoryFactory.getCartRepository();
  let orderRepo = RepositoryFactory.getOrderRepository();
  let couponRepo = RepositoryFactory.getCouponRepository();
  let inventoryRepo = RepositoryFactory.getInventoryRepository();

  beforeAll(() => {
    // Ensure overrides are cleared to use real Supabase repositories
    RepositoryFactory.clearOverrides();
  });

  let testProductSlug: string;

  // Integration tests write to a shared database that also backs the demo
  // storefront. Without cleanup every run leaves an active product behind, and
  // those accumulate into the live catalog.
  afterAll(async () => {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    if (testProductSlug) {
      await db.from('products').delete().eq('slug', testProductSlug);
    }
  });

  it('should successfully save and retrieve a product from the real database', async () => {
    // Create a product dynamically
    const productData = {
      name: "Integration Test Product",
      slug: `integration-test-${Date.now()}`,
      description: "A test product",
      short_description: "A short test",
      sku: `SKU-${Date.now()}`,
      price: 199.99,
      currency: "USD",
      stock_quantity: 10,
      low_stock_threshold: 2,
      status: "active" as any,
      featured: false
    };
    
    // We can't directly use productRepo.create since it might not be in the interface.
    // Let's use Supabase directly if we have to, or check if productRepo has a create method.
    // If not, we just rely on Supabase client.
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: newProduct, error } = await supabase.from('products').insert([productData]).select().single();
    expect(error).toBeNull();
    expect(newProduct).toBeDefined();

    testProductSlug = newProduct.slug;

    // Now retrieve it using the repository
    const product = await productRepo.findBySlug(newProduct.slug);
    expect(product).toBeDefined();
    expect(product!.name).toBe("Integration Test Product");
  });

  it('should persist a new cart and cart item', async () => {
    const cart = await cartRepo.createCart({ guestToken: `test-guest-token-${Date.now()}` });
    expect(cart.id).toBeDefined();

    const product = await productRepo.findBySlug(testProductSlug);
    if (product) {
      const item = await cartRepo.addItem(cart.id, {
        product_id: product.id,
        quantity: 1
      });
      expect(item.id).toBeDefined();
      expect(item.cart_id).toBe(cart.id);

      const updatedCart = await cartRepo.findById(cart.id);
      expect(updatedCart?.items.length).toBeGreaterThan(0);
    }
  });
});
