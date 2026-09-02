-- ============================================================================
-- RLS HARDENING
-- ----------------------------------------------------------------------------
-- The initial schema left several tables without Row Level Security. Because
-- NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are, by design,
-- readable in browser JavaScript, any table without RLS is directly readable
-- (and in most default Supabase setups writable) by anyone through PostgREST.
--
-- That exposed commercial and personal data: payment records, refunds, the
-- full coupon catalogue, per-customer coupon usage, inventory movements,
-- order status history and raw webhook payloads.
--
-- This migration enables RLS everywhere and grants only what the storefront
-- genuinely needs. Server-side code uses the service role key, which bypasses
-- RLS, so application behaviour is unchanged.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Commercially sensitive tables: no anon/authenticated access at all.
--    Enabling RLS with no permissive policy denies every non-service request.
-- ---------------------------------------------------------------------------
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. Payments: a customer may read the payment rows on their own orders only.
-- ---------------------------------------------------------------------------
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view payments on their own orders" ON payments;
CREATE POLICY "Users can view payments on their own orders" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = payments.order_id
              AND orders.user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- 3. Order status history: same ownership rule as the parent order.
-- ---------------------------------------------------------------------------
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view status history for their own orders" ON order_status_history;
CREATE POLICY "Users can view status history for their own orders" ON order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_status_history.order_id
              AND orders.user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- 4. Reviews: approved reviews are public; a customer may see and submit their
--    own. Moderation (approval) stays server-side via the service role.
-- ---------------------------------------------------------------------------
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved reviews" ON reviews;
CREATE POLICY "Public can view approved reviews" ON reviews
    FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
CREATE POLICY "Users can view their own reviews" ON reviews
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can submit their own reviews" ON reviews;
CREATE POLICY "Users can submit their own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. Users table: the signup trigger inserts the public profile row, but a
--    client-side signup flow also needs to be able to create its own row.
--    (Previously shipped as an untracked add-policy.sql; folded in here so a
--    fresh database is correct without manual steps.)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'users'
          AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile" ON users
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Guest orders are looked up by order number on the confirmation page.
--    That path runs server-side with the service role; no anon policy is
--    added here on purpose, so order numbers stay non-enumerable.
-- ---------------------------------------------------------------------------
