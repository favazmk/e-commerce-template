import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment is loaded globally via tests/setupEnv.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.uM3-oE70Hn1oZ0aJmZkF097wI7V_mGjA4yF7b1qjW2M';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

describe('Integration: Row Level Security (RLS)', () => {
  let customerAClient: SupabaseClient;
  let customerBClient: SupabaseClient;
  
  let customerAId: string;
  let customerBId: string;
  let orderAId: string;

  beforeAll(async () => {
    // 1. Create two users via Admin API
    const emailA = `customer_a_${Date.now()}@example.com`;
    const emailB = `customer_b_${Date.now()}@example.com`;
    
    const { data: userA, error: errA } = await adminSupabase.auth.admin.createUser({
      email: emailA,
      password: 'password123',
      email_confirm: true,
    });
    if (errA) throw errA;
    customerAId = userA.user.id;

    const { data: userB, error: errB } = await adminSupabase.auth.admin.createUser({
      email: emailB,
      password: 'password123',
      email_confirm: true,
    });
    if (errB) throw errB;
    customerBId = userB.user.id;

    // (Manual insert removed: handled automatically by public.handle_new_user() trigger)

    // 3. Login as both to get authenticated clients
    const clientA = createClient(supabaseUrl, anonKey);
    await clientA.auth.signInWithPassword({ email: emailA, password: 'password123' });
    customerAClient = clientA;

    const clientB = createClient(supabaseUrl, anonKey);
    await clientB.auth.signInWithPassword({ email: emailB, password: 'password123' });
    customerBClient = clientB;

    // 4. Create an order for Customer A (Admin bypasses RLS)
    const { data: order } = await adminSupabase.from('orders').insert({
      user_id: customerAId,
      order_number: `RLS-TEST-${Date.now()}`,
      subtotal: 100,
      total_amount: 100,
      shipping_address: {},
      billing_address: {},
      shipping_method: {}
    }).select().single();
    orderAId = order.id;
  });

  it('Customer A can read their own profile', async () => {
    const { data, error } = await customerAClient.from('users').select('*').eq('id', customerAId).single();
    expect(error).toBeNull();
    expect(data.name.startsWith("customer_a_")).toBe(true);
  });

  it('Customer A CANNOT read Customer B profile', async () => {
    const { data, error } = await customerAClient.from('users').select('*').eq('id', customerBId).maybeSingle();
    expect(data).toBeNull();
  });

  it('Customer A can read their own order', async () => {
    const { data, error } = await customerAClient.from('orders').select('*').eq('id', orderAId).single();
    expect(error).toBeNull();
    expect(data.id).toBe(orderAId);
  });

  it('Customer B CANNOT read Customer A order', async () => {
    const { data, error } = await customerBClient.from('orders').select('*').eq('id', orderAId).maybeSingle();
    expect(data).toBeNull();
  });
  
  it('Customer A CANNOT create an order for Customer B', async () => {
    const { data, error } = await customerAClient.from('orders').insert({
      user_id: customerBId,
      order_number: `RLS-HACK-${Date.now()}`,
      subtotal: 100,
      total_amount: 100,
      shipping_address: {},
      billing_address: {},
      shipping_method: {}
    });
    // The insert should fail RLS or return no rows
    expect(error).not.toBeNull();
  });
});
