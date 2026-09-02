import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient as createAdminDb } from '@supabase/supabase-js';
import { RepositoryFactory } from '../../src/repositories/repository.factory';
import { InventoryService } from '../../src/services/inventory.service';

describe('Integration: Concurrency', () => {
  let productRepo = RepositoryFactory.getProductRepository();
  let inventoryRepo = RepositoryFactory.getInventoryRepository();
  let inventoryService = new InventoryService();

  beforeAll(() => {
    RepositoryFactory.clearOverrides();
  });

  const createdSlugs: string[] = [];

  // Integration tests write to a shared database that also backs the demo
  // storefront. Without cleanup every run leaves an active product behind, and
  // those accumulate into the live catalog.
  afterAll(async () => {
    if (!createdSlugs.length) return;
    const db = createAdminDb(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await db.from('products').delete().in('slug', createdSlugs);
  });

  it('should prevent overselling during concurrent checkout requests', async () => {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create a product dynamically
    const productData = {
      name: "Concurrency Test Product",
      slug: `concurrency-test-${Date.now()}`,
      description: "A test product",
      short_description: "A short test",
      sku: `SKU-CONC-${Date.now()}`,
      price: 199.99,
      currency: "USD",
      stock_quantity: 1, // EXACTLY 1
      low_stock_threshold: 2,
      status: "active" as any,
      featured: false
    };
    
    const { data: newProduct, error } = await supabase.from('products').insert([productData]).select().single();
    if (newProduct?.slug) createdSlugs.push(newProduct.slug);
    expect(error).toBeNull();
    expect(newProduct).toBeDefined();

    // 1. Get the product and set its stock to exactly 1
    const product = await productRepo.findBySlug(newProduct.slug);
    expect(product).toBeDefined();

    const productId = product!.id;
    const variantId = product!.variants?.[0]?.id;

    const currentStock = await inventoryRepo.getStock(productId, variantId);
    
    // Let's create two concurrent reserve requests for exactly the `currentStock` amount.
    // Request 1 asks for all the stock. Request 2 asks for all the stock.
    // One must fail.
    
    const qty = currentStock;

    if (qty <= 0) {
      console.warn("Skipping concurrency test because stock is 0");
      return;
    }

    const ref1 = `ord_test_concurrent_1_${Date.now()}`;
    const ref2 = `ord_test_concurrent_2_${Date.now()}`;

    // Fire both simultaneously
    const req1 = InventoryService.decrementStock(productId, variantId, qty, ref1);
    const req2 = InventoryService.decrementStock(productId, variantId, qty, ref2);

    const [res1, res2] = await Promise.all([req1, req2]);

    // Exactly one should succeed, one should fail
    expect(res1.success !== res2.success).toBe(true);

    const finalStock = await inventoryRepo.getStock(productId, variantId);
    expect(finalStock).toBe(0);

    // Cleanup: release the successful reservation
    if (res1.success) {
      await InventoryService.restoreStock(productId, variantId, qty, ref1);
    }
    if (res2.success) {
      await InventoryService.restoreStock(productId, variantId, qty, ref2);
    }
  });
});
