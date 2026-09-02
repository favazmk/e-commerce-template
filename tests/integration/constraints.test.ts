import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment is loaded globally via tests/setupEnv.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

describe('Integration: Database Constraints', () => {
  let testSku: string;
  let testOrderNumber: string;
  let testProductSlug: string;

  // Integration tests write to a shared database that also backs the demo
  // storefront. Without cleanup every run leaves a product behind, and those
  // accumulate into the live catalog.
  afterAll(async () => {
    if (testProductSlug) {
      await adminSupabase.from('products').delete().like('slug', `${testProductSlug}%`);
    }
    if (testSku) {
      await adminSupabase.from('products').delete().eq('sku', testSku);
    }
    if (testOrderNumber) {
      await adminSupabase.from('orders').delete().eq('order_number', testOrderNumber);
    }
  });

  beforeAll(async () => {
    testSku = `SKU-CONST-${Date.now()}`;
    testOrderNumber = `ORD-CONST-${Date.now()}`;
    testProductSlug = `const-test-${Date.now()}`;

    // Create base records
    await adminSupabase.from('products').insert({
      name: "Constraint Test Product",
      slug: testProductSlug,
      sku: testSku,
      price: 100,
      currency: "USD",
      stock_quantity: 10,
    });
    
    await adminSupabase.from('orders').insert({
      order_number: testOrderNumber,
      subtotal: 100,
      total_amount: 100,
      shipping_address: {},
      billing_address: {},
      shipping_method: {}
    });
  });

  it('Should prevent duplicate product SKUs', async () => {
    const { error } = await adminSupabase.from('products').insert({
      name: "Duplicate SKU Product",
      slug: `dup-sku-${Date.now()}`,
      sku: testSku,
      price: 100,
      currency: "USD",
      stock_quantity: 10,
    });
    
    expect(error).not.toBeNull();
    expect(error!.code).toBe('23505'); // PostgreSQL unique violation code
  });

  it('Should prevent duplicate order numbers', async () => {
    const { error } = await adminSupabase.from('orders').insert({
      order_number: testOrderNumber,
      subtotal: 100,
      total_amount: 100,
      shipping_address: {},
      billing_address: {},
      shipping_method: {}
    });
    
    expect(error).not.toBeNull();
    expect(error!.code).toBe('23505'); // PostgreSQL unique violation code
  });

  it('Should prevent duplicate webhook event IDs', async () => {
    const eventId = `evt_${Date.now()}`;
    
    // First insert succeeds
    await adminSupabase.from('processed_webhooks').insert({
      provider: 'razorpay',
      event_id: eventId,
      event_type: 'payment.captured'
    });
    
    // Second insert with same provider and event_id fails
    const { error } = await adminSupabase.from('processed_webhooks').insert({
      provider: 'razorpay',
      event_id: eventId,
      event_type: 'payment.failed'
    });
    
    expect(error).not.toBeNull();
    expect(error!.code).toBe('23505'); // PostgreSQL unique violation code
  });
});
