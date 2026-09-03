-- ============================================================================
-- CRITICAL: CLOSE THE SELF-SERVICE PRIVILEGE ESCALATION PATH ON public.users
-- ----------------------------------------------------------------------------
-- The initial schema shipped:
--
--     CREATE POLICY "Users can update their own profile" ON users
--         FOR UPDATE USING (auth.uid() = id);
--
-- Row Level Security decides WHICH ROWS a statement may touch. It cannot
-- restrict WHICH COLUMNS. With no WITH CHECK clause Postgres reuses the USING
-- expression, which only asserts that the row still belongs to the caller —
-- it says nothing about `role`.
--
-- NEXT_PUBLIC_SUPABASE_ANON_KEY is, by design, readable in browser JavaScript.
-- So any signed-in customer could call PostgREST directly:
--
--     PATCH /rest/v1/users?id=eq.<their own id>
--     Authorization: Bearer <their own session JWT>
--     { "role": "super_admin" }
--
-- The policy allows it, and from that moment getSessionUser() reports them as
-- an administrator: requireAdmin() passes, the middleware role check passes,
-- and the entire admin panel — orders, customers, payouts, settings — opens up.
-- That is a full privilege escalation reachable from the browser console by any
-- registered customer.
--
-- The fix is column-level privileges, which are checked independently of and in
-- addition to RLS. `authenticated` keeps UPDATE on exactly the profile fields a
-- customer legitimately edits; `role`, `id`, `email` and the timestamps become
-- unwritable through the anon/authenticated keys. The service role bypasses
-- both mechanisms, so admin-authorised server code (updateRole) is unaffected.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Who is allowed to write privileged columns.
--
--    PostgREST runs a request as `service_role` or `authenticated` via SET ROLE,
--    so `current_user` identifies the caller — but only in a SECURITY INVOKER
--    context. A direct connection (this migration, scripts/apply-migration.mjs,
--    psql) arrives as `postgres` with no JWT and is privileged by definition.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_privileged_db_caller()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY INVOKER SET search_path = public
AS $$
DECLARE
    v_claims TEXT;
BEGIN
    IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
        RETURN TRUE;
    END IF;

    v_claims := current_setting('request.jwt.claims', true);
    IF v_claims IS NOT NULL AND (v_claims::jsonb ->> 'role') = 'service_role' THEN
        RETURN TRUE;
    END IF;

    -- Legacy PostgREST GUC, still set by some versions.
    IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
EXCEPTION WHEN OTHERS THEN
    -- Fail closed: an unreadable setting must not grant privilege.
    RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.is_privileged_db_caller() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_privileged_db_caller() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 1. Replace the blanket table-level UPDATE grant with a column allowlist.
--    Order matters: revoke the whole-table privilege first, otherwise the
--    broad grant keeps satisfying the check on every column.
-- ---------------------------------------------------------------------------
REVOKE UPDATE ON public.users FROM authenticated;
REVOKE UPDATE ON public.users FROM anon;

GRANT UPDATE (name, phone, avatar_url) ON public.users TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Second, independent guard: a trigger that pins privileged columns.
--
--    Defence in depth. If a future migration re-grants UPDATE on the whole
--    table (an easy mistake — `GRANT ALL ON public.users TO authenticated` is
--    one careless line), the column allowlist above silently stops protecting
--    anything. This trigger keeps holding, because it compares NEW against OLD
--    regardless of how the statement got here.
--
--    A WITH CHECK clause cannot do this job: expressing "role is unchanged"
--    requires reading public.users from inside a policy on public.users, which
--    Postgres rejects as infinite recursion.
--
--    SECURITY INVOKER (the default) is required, not merely preferred. Inside
--    a SECURITY DEFINER function `current_user` is the function OWNER, not the
--    caller — so a service-role exemption written that way never matches, and
--    the trigger silently blocks legitimate admin writes as well as attacks.
--    The function needs no elevated access: it only reads NEW and OLD.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_user_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER SET search_path = public
AS $$
BEGIN
    -- Server-side code using the service role key legitimately changes roles
    -- (admin promotion, seeding, the E2E fixtures). Everything else is a
    -- customer session. A direct database connection (migration runner, psql)
    -- has no PostgREST JWT at all and is privileged by definition.
    IF public.is_privileged_db_caller() THEN
        RETURN NEW;
    END IF;

    -- Silently pin rather than raise: a customer editing their name should not
    -- get an error because the client library echoed back every column.
    NEW.role := OLD.role;
    NEW.id := OLD.id;
    NEW.email := OLD.email;
    NEW.created_at := OLD.created_at;
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_user_privileged_columns ON public.users;
CREATE TRIGGER trg_guard_user_privileged_columns
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.guard_user_privileged_columns();

-- ---------------------------------------------------------------------------
-- 3. Nobody may delete a profile row through the public keys. Account deletion
--    is a server-side flow (it has to cascade into auth.users) and must not be
--    reachable as a bare PostgREST DELETE.
-- ---------------------------------------------------------------------------
REVOKE DELETE ON public.users FROM authenticated;
REVOKE DELETE ON public.users FROM anon;

-- ---------------------------------------------------------------------------
-- 4. Addresses: the existing "FOR ALL USING (auth.uid() = user_id)" policy has
--    the same missing-WITH-CHECK shape. USING filters the rows an UPDATE or
--    DELETE may reach, but on INSERT there is no existing row to filter, so
--    without WITH CHECK a customer can insert an address row owned by somebody
--    else — enough to poison another shopper's saved-address list.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;

DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
CREATE POLICY "Users can view their own addresses" ON public.addresses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own addresses" ON public.addresses;
CREATE POLICY "Users can create their own addresses" ON public.addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
CREATE POLICY "Users can update their own addresses" ON public.addresses
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;
CREATE POLICY "Users can delete their own addresses" ON public.addresses
    FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. Wishlists carry the same pattern.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlists;

DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlists;
CREATE POLICY "Users can view their own wishlist" ON public.wishlists
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add to their own wishlist" ON public.wishlists;
CREATE POLICY "Users can add to their own wishlist" ON public.wishlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove from their own wishlist" ON public.wishlists;
CREATE POLICY "Users can remove from their own wishlist" ON public.wishlists
    FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. Carts and cart items: same fix, same reasoning.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own carts" ON public.carts;

DROP POLICY IF EXISTS "Users can view their own carts" ON public.carts;
CREATE POLICY "Users can view their own carts" ON public.carts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own carts" ON public.carts;
CREATE POLICY "Users can create their own carts" ON public.carts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own carts" ON public.carts;
CREATE POLICY "Users can update their own carts" ON public.carts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own carts" ON public.carts;
CREATE POLICY "Users can delete their own carts" ON public.carts
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their cart items" ON public.cart_items;

DROP POLICY IF EXISTS "Users can view their cart items" ON public.cart_items;
CREATE POLICY "Users can view their cart items" ON public.cart_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can add their cart items" ON public.cart_items;
CREATE POLICY "Users can add their cart items" ON public.cart_items
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their cart items" ON public.cart_items;
CREATE POLICY "Users can update their cart items" ON public.cart_items
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid())
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can delete their cart items" ON public.cart_items;
CREATE POLICY "Users can delete their cart items" ON public.cart_items
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid())
    );

-- ---------------------------------------------------------------------------
-- 7. Reviews: a customer may edit or withdraw their own review, but must never
--    be able to set its moderation status. Same column-privilege technique —
--    otherwise "submit a review" becomes "publish a review", and the admin
--    moderation queue is decorative.
-- ---------------------------------------------------------------------------
REVOKE UPDATE ON public.reviews FROM authenticated;
REVOKE UPDATE ON public.reviews FROM anon;

GRANT UPDATE (rating, title, comment) ON public.reviews TO authenticated;

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- An edit must send the review back through moderation. Without this, the
-- approval queue is decorative: submit "Lovely soap", wait for approval, then
-- rewrite the body to anything at all while the approved badge stays on.
CREATE OR REPLACE FUNCTION public.requeue_edited_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER SET search_path = public
AS $$
BEGIN
    -- Admin moderation runs through the service role and must be able to edit
    -- a review without sending it straight back to the queue it just left.
    IF public.is_privileged_db_caller() THEN
        RETURN NEW;
    END IF;

    IF NEW.comment IS DISTINCT FROM OLD.comment
       OR NEW.title IS DISTINCT FROM OLD.title
       OR NEW.rating IS DISTINCT FROM OLD.rating THEN
        NEW.status := 'pending';
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_requeue_edited_review ON public.reviews;
CREATE TRIGGER trg_requeue_edited_review
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.requeue_edited_review();

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" ON public.reviews
    FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 8. store_settings was readable in full by anyone holding the anon key
--    ("Public can view public store settings" USING (true)). Settings are a
--    free-form JSONB key/value store, so anything an admin ever saves there —
--    an integration token, an internal margin, a supplier note — was public.
--    Restrict reads to the keys the storefront actually renders.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view public store settings" ON public.store_settings;

DROP POLICY IF EXISTS "Public can view storefront settings" ON public.store_settings;
CREATE POLICY "Public can view storefront settings" ON public.store_settings
    FOR SELECT USING (
        key IN ('general', 'branding', 'shipping', 'tax', 'features', 'seo', 'growth')
    );

-- ---------------------------------------------------------------------------
-- 9. product_images was readable with USING (true), which leaks the imagery of
--    unreleased draft products. Tie visibility to the parent product instead.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;

DROP POLICY IF EXISTS "Public can view images of active products" ON public.product_images;
CREATE POLICY "Public can view images of active products" ON public.product_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_images.product_id
              AND p.status = 'active'
        )
    );
