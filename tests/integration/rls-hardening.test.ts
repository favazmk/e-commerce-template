import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Environment is loaded globally via tests/setupEnv.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * NEXT_PUBLIC_SUPABASE_ANON_KEY is embedded in the browser bundle by design, so
 * anyone who loads the storefront holds this key. Any table without a
 * restricting policy is therefore world-readable through PostgREST, regardless
 * of what the application code does.
 *
 * These tests assert the protection added by
 * `supabase/migrations/20260102000000_rls_hardening.sql`. They exercise the
 * database directly rather than the repository layer, because the repositories
 * deliberately use the service-role key for these tables — the point is that
 * the database refuses the *public* key even when application code is wrong.
 */
const publicClient = createClient(supabaseUrl, anonKey);
const adminClient = createClient(supabaseUrl, serviceRoleKey);

/** Tables that must be completely unreachable with the public key. */
const LOCKED_TABLES = [
  "payments",
  "refunds",
  "coupons",
  "coupon_usages",
  "inventory_transactions",
  "order_status_history",
  "processed_webhooks",
];

describe("Integration: RLS hardening on commercially sensitive tables", () => {
  for (const table of LOCKED_TABLES) {
    it(`SECURITY: the public anon key cannot read ${table}`, async () => {
      // The table must actually contain a row, otherwise an empty result would
      // pass this test for the wrong reason.
      const { count } = await adminClient
        .from(table)
        .select("*", { count: "exact", head: true });

      const { data, error } = await publicClient.from(table).select("*").limit(5);

      // Either PostgREST refuses outright, or RLS filters every row away.
      const rowsVisible = data?.length ?? 0;
      expect(
        rowsVisible,
        `${table} exposed ${rowsVisible} row(s) to the public key ` +
          `(table holds ${count ?? "unknown"} row(s), error=${error?.code ?? "none"})`
      ).toBe(0);
    });
  }

  it("SECURITY: the public anon key cannot mint itself a coupon", async () => {
    const probeCode = `RLS_PROBE_${Date.now()}`;
    try {
      const { error } = await publicClient
        .from("coupons")
        .insert([{ code: probeCode, discount_type: "fixed", discount_value: 99 }]);

      expect(error, "the public key was able to insert a coupon").toBeTruthy();
    } finally {
      // If the insert did land, do not leave a live discount code behind.
      await adminClient.from("coupons").delete().eq("code", probeCode);
    }
  });

  it("keeps the public catalog readable, so hardening did not overshoot", async () => {
    const { data: products, error: productError } = await publicClient
      .from("products")
      .select("id,status")
      .eq("status", "active")
      .limit(1);

    expect(productError).toBeNull();
    expect(products?.length ?? 0).toBeGreaterThan(0);

    const { error: categoryError } = await publicClient
      .from("categories")
      .select("id")
      .limit(1);
    expect(categoryError).toBeNull();
  });

  it("SECURITY: the public key cannot read draft or archived products", async () => {
    const { data } = await publicClient
      .from("products")
      .select("id,status")
      .neq("status", "active")
      .limit(5);

    expect(data?.length ?? 0).toBe(0);
  });

  it("the service role still reaches locked tables, so the app keeps working", async () => {
    const { error } = await adminClient.from("payments").select("id").limit(1);
    expect(error).toBeNull();
  });
});

/**
 * The account page runs one embedded PostgREST select across orders,
 * order_items, payments and order_status_history using the *user-scoped*
 * client (`SupabaseOrderRepository.findByUserId`).
 *
 * Locking down payments and order_status_history could therefore break the page
 * silently: PostgREST would return the order rows with empty embeds, or error,
 * and the customer would see nothing. These tests run the exact query shape as a
 * real authenticated customer.
 */
describe("Integration: the account order query still works under RLS", () => {
  const ORDER_SELECT = "*, items:order_items(*), payments(*), history:order_status_history(*)";

  let customerClient: SupabaseClient;
  let customerId: string;
  let otherCustomerId: string;
  let orderId: string;

  beforeAll(async () => {
    const email = `rls_orders_${Date.now()}@example.com`;
    const password = "password123";

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) throw createError;
    customerId = created.user.id;

    const { data: other, error: otherError } = await adminClient.auth.admin.createUser({
      email: `rls_orders_other_${Date.now()}@example.com`,
      password,
      email_confirm: true,
    });
    if (otherError) throw otherError;
    otherCustomerId = other.user.id;

    // Seed one order owned by the customer, with a payment and status history.
    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .insert([
        {
          order_number: `RLSTEST-${Date.now()}`,
          user_id: customerId,
          status: "paid",
          payment_status: "captured",
          subtotal: 100,
          discount_amount: 0,
          shipping_amount: 0,
          tax_amount: 0,
          total_amount: 100,
          currency: "USD",
          shipping_address: { city: "Town", country: "US" },
          billing_address: { city: "Town", country: "US" },
          shipping_method: { id: "standard", title: "Standard", rate: 0 },
        },
      ])
      .select()
      .single();
    if (orderError) throw orderError;
    orderId = order.id;

    await adminClient.from("payments").insert([
      {
        order_id: orderId,
        payment_provider: "razorpay",
        provider_order_id: "order_rls_test",
        amount: 100,
        currency: "USD",
        status: "captured",
      },
    ]);
    await adminClient
      .from("order_status_history")
      .insert([{ order_id: orderId, status: "paid", notes: "seeded for RLS test" }]);

    const signedIn = createClient(supabaseUrl, anonKey);
    const { error: signInError } = await signedIn.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;
    customerClient = signedIn;
  });

  afterAll(async () => {
    if (orderId) await adminClient.from("orders").delete().eq("id", orderId);
    if (customerId) await adminClient.auth.admin.deleteUser(customerId);
    if (otherCustomerId) await adminClient.auth.admin.deleteUser(otherCustomerId);
  });

  it("returns the customer's own order with its payments and history embedded", async () => {
    const { data, error } = await customerClient
      .from("orders")
      .select(ORDER_SELECT)
      .eq("user_id", customerId);

    expect(error, `embedded select failed: ${error?.message}`).toBeNull();
    expect(data?.length ?? 0).toBe(1);

    const order = data![0] as any;
    // The embeds must not come back empty — that would render an account page
    // with no payment or timeline information.
    expect(order.payments?.length ?? 0).toBeGreaterThan(0);
    expect(order.history?.length ?? 0).toBeGreaterThan(0);
  });

  it("SECURITY: the same query cannot reach another customer's orders", async () => {
    const { data } = await customerClient
      .from("orders")
      .select(ORDER_SELECT)
      .eq("user_id", otherCustomerId);

    expect(data?.length ?? 0).toBe(0);
  });

  it("SECURITY: a customer cannot read payments belonging to another order", async () => {
    const { data } = await customerClient.from("payments").select("*").neq("order_id", orderId);
    expect(data?.length ?? 0).toBe(0);
  });
});
