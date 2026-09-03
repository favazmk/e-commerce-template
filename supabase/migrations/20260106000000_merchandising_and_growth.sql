-- ============================================================================
-- MERCHANDISING & GROWTH
-- ----------------------------------------------------------------------------
-- Adds the data layer behind the conversion features every modern storefront
-- is expected to have: product recommendations, "frequently bought together"
-- bundles, real social proof (ratings and units sold), back-in-stock capture
-- and newsletter capture.
--
-- Design rule followed throughout: everything shown to a shopper as a fact must
-- be derived from real rows. A fabricated "23 people are viewing this" is both
-- a dark pattern and, in the UAE and EU, a consumer-protection problem. The
-- aggregates below exist so the storefront can be persuasive using the truth.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PRODUCT STATISTICS
--    Approved-review rating plus lifetime units sold, per product. A view keeps
--    it always-correct; the supporting indexes keep it cheap.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reviews_product_status ON reviews(product_id, status);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE OR REPLACE VIEW product_stats AS
SELECT
    p.id AS product_id,
    COALESCE(r.review_count, 0)::INT AS review_count,
    ROUND(COALESCE(r.average_rating, 0)::NUMERIC, 2) AS average_rating,
    COALESCE(s.units_sold, 0)::INT AS units_sold,
    COALESCE(s.units_sold_30d, 0)::INT AS units_sold_30d
FROM products p
LEFT JOIN (
    SELECT product_id,
           COUNT(*) AS review_count,
           AVG(rating) AS average_rating
    FROM reviews
    WHERE status = 'approved'
    GROUP BY product_id
) r ON r.product_id = p.id
LEFT JOIN (
    SELECT oi.product_id,
           SUM(oi.quantity) AS units_sold,
           SUM(oi.quantity) FILTER (WHERE o.created_at > NOW() - INTERVAL '30 days') AS units_sold_30d
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    -- Only orders that actually completed count as social proof. A cancelled
    -- or failed order is not a sale.
    WHERE o.status NOT IN ('cancelled', 'failed', 'refunded', 'pending')
    GROUP BY oi.product_id
) s ON s.product_id = p.id;

COMMENT ON VIEW product_stats IS
'Per-product social proof: approved-review rating and units actually sold. Read via ProductStatsRepository; never populate these numbers by hand.';

-- ---------------------------------------------------------------------------
-- 2. FREQUENTLY BOUGHT TOGETHER
--    Co-purchase counts derived from real order history. Returns the products
--    most often bought in the same order as the given one.
--
--    SECURITY DEFINER with a pinned search_path: the function reads order_items,
--    which customers must not be able to read directly. It returns only
--    aggregate product ids and counts — never order, customer or price data.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_frequently_bought_together(
    p_product_id UUID,
    p_limit INT DEFAULT 4
)
RETURNS TABLE (product_id UUID, co_purchase_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT other.product_id,
           COUNT(DISTINCT other.order_id) AS co_purchase_count
    FROM order_items self
    JOIN order_items other
      ON other.order_id = self.order_id
     AND other.product_id <> self.product_id
    JOIN orders o ON o.id = self.order_id
    JOIN products p ON p.id = other.product_id
    WHERE self.product_id = p_product_id
      AND o.status NOT IN ('cancelled', 'failed', 'pending')
      AND p.status = 'active'
      AND other.product_id IS NOT NULL
    GROUP BY other.product_id
    ORDER BY co_purchase_count DESC
    LIMIT GREATEST(1, LEAST(p_limit, 12));
$$;

REVOKE ALL ON FUNCTION public.get_frequently_bought_together(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_frequently_bought_together(UUID, INT) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. MERCHANT-CURATED BUNDLES
--    Co-purchase data needs order history to exist. A new store has none, so
--    the merchant can pin a bundle manually and the recommendation service
--    falls back to it. Same feature, no cold-start problem.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    related_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    -- 'bundle'  : shown in the "buy together" widget
    -- 'similar' : shown as an alternative
    -- 'upsell'  : a premium alternative
    relation_type VARCHAR(20) NOT NULL DEFAULT 'bundle',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, related_product_id, relation_type),
    CONSTRAINT product_bundles_no_self_reference CHECK (product_id <> related_product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_bundles_product ON product_bundles(product_id, relation_type);

ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;

-- Readable by anyone, but only for products that are actually published.
CREATE POLICY "Public can view bundles of active products" ON product_bundles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM products p WHERE p.id = product_bundles.product_id AND p.status = 'active')
    );
-- No INSERT/UPDATE/DELETE policy: curation is admin-only, through the service role.

-- ---------------------------------------------------------------------------
-- 4. BACK-IN-STOCK REQUESTS
--    "Notify me when available" turns an out-of-stock page — otherwise a dead
--    end — into a captured lead and a later sale.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS back_in_stock_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, variant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_back_in_stock_pending
    ON back_in_stock_requests(product_id) WHERE notified_at IS NULL;

ALTER TABLE back_in_stock_requests ENABLE ROW LEVEL SECURITY;
-- No anon policy at all. These rows are email addresses: a readable table here
-- would be a harvestable customer list. Writes go through the server route,
-- which validates and rate-limits first.

-- ---------------------------------------------------------------------------
-- 5. NEWSLETTER SUBSCRIBERS
--    The homepage already renders a newsletter section; until now it had
--    nowhere to store an address, so every sign-up was discarded.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    source TEXT,
    -- Consent metadata. Under UAE PDPL and GDPR you must be able to show when
    -- and how consent was given, and honour withdrawal.
    consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,
    -- Unguessable token so an unsubscribe link needs no login.
    unsubscribe_token UUID NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_active
    ON newsletter_subscribers(email) WHERE unsubscribed_at IS NULL;

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
-- Same reasoning as back_in_stock_requests: no anon policy, server writes only.

-- ---------------------------------------------------------------------------
-- 6. RECENTLY VIEWED — deliberately NOT a table.
--    Browsing history is personal data. Keeping it in the visitor's own
--    localStorage gives the same "recently viewed" strip with no retention
--    obligation, no consent banner entanglement and no breach surface.
--    See src/features/recently-viewed/.
-- ---------------------------------------------------------------------------
