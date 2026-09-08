-- ============================================================================
-- SHOPIFY / WOOCOMMERCE GRADE PRODUCT MODEL
-- ----------------------------------------------------------------------------
-- The catalogue could describe what a product *is* but not how it is *sold*.
-- Every gap below is something a merchant on Shopify or WooCommerce takes for
-- granted and cannot express here without an engineer:
--
--   * A sale that starts on Friday and ends on Sunday.        (Woo sale dates)
--   * "Keep selling after stock hits zero."                   (Shopify policy)
--   * "This is a download / a service - do not ship it."      (Woo virtual)
--   * "Minimum order 2, maximum 5 per customer."              (Woo min/max)
--   * "Publish this at 9am on launch day."                    (Shopify schedule)
--   * Size AND Colour as named option sets, not one attribute.(Shopify options)
--
-- Design rule kept throughout: no decorative columns. Every field added here is
-- read by pricing, stock, cart or storefront code in the same change set.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. SELLING RULES ON products
-- ---------------------------------------------------------------------------

ALTER TABLE products
    -- Shopify's "Product type": a merchandising label independent of the
    -- category tree, so a "Sale" or "Gift" collection can be built from it
    -- without distorting navigation.
    ADD COLUMN IF NOT EXISTS product_type TEXT,

    -- GTIN / UPC / EAN. Variants already carry one; a single-variant product
    -- had nowhere to put it, which breaks Google Shopping feeds.
    ADD COLUMN IF NOT EXISTS barcode TEXT,

    -- Inventory tracking. A made-to-order or service line has no stock count;
    -- forcing one on it makes the storefront lie about availability.
    ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN NOT NULL DEFAULT true,

    -- What happens at zero stock. 'deny' blocks the sale (today's only
    -- behaviour); 'continue' is Shopify's "continue selling when out of stock",
    -- i.e. backorders, which Woo calls "Allow, but notify customer".
    ADD COLUMN IF NOT EXISTS inventory_policy TEXT NOT NULL DEFAULT 'deny',

    -- Woo's "Virtual product". False means checkout must not charge delivery
    -- for a cart made only of these.
    ADD COLUMN IF NOT EXISTS requires_shipping BOOLEAN NOT NULL DEFAULT true,

    -- Physical properties. Shown as specs on the product page and used for
    -- packing slips; the unit is fixed (grams / cm) so no per-row unit column
    -- can drift out of sync with the number beside it.
    ADD COLUMN IF NOT EXISTS weight_grams INT,
    ADD COLUMN IF NOT EXISTS length_cm NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS width_cm  NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS height_cm NUMERIC(10, 2),

    -- Purchase limits. Minimum supports "sold in pairs"; maximum protects a
    -- limited drop from being cleared out by one buyer.
    ADD COLUMN IF NOT EXISTS min_purchase_quantity INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS max_purchase_quantity INT,

    -- Scheduled markdown. `price` stays the regular price forever; the sale is
    -- a separate, dated fact. This is WooCommerce's model, and it is the reason
    -- a sale can end without anyone remembering to restore the old price.
    ADD COLUMN IF NOT EXISTS sale_price NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS sale_starts_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sale_ends_at TIMESTAMPTZ,

    -- Scheduled publish. status='active' with a future published_at is
    -- Shopify's "Schedule availability": saved, approved, not yet visible.
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_inventory_policy_check;
ALTER TABLE products ADD CONSTRAINT products_inventory_policy_check
    CHECK (inventory_policy IN ('deny', 'continue'));

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_weight_check;
ALTER TABLE products ADD CONSTRAINT products_weight_check
    CHECK (weight_grams IS NULL OR weight_grams >= 0);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_dimensions_check;
ALTER TABLE products ADD CONSTRAINT products_dimensions_check
    CHECK (
        (length_cm IS NULL OR length_cm >= 0) AND
        (width_cm  IS NULL OR width_cm  >= 0) AND
        (height_cm IS NULL OR height_cm >= 0)
    );

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_purchase_quantity_check;
ALTER TABLE products ADD CONSTRAINT products_purchase_quantity_check
    CHECK (
        min_purchase_quantity >= 1 AND
        (max_purchase_quantity IS NULL OR max_purchase_quantity >= min_purchase_quantity)
    );

-- A "sale price" at or above the regular price is not a sale, it is a data
-- entry mistake that would show the shopper a struck-through saving of zero.
-- Rejecting it at the boundary is cheaper than explaining it later.
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sale_price_check;
ALTER TABLE products ADD CONSTRAINT products_sale_price_check
    CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price < price));

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sale_window_check;
ALTER TABLE products ADD CONSTRAINT products_sale_window_check
    CHECK (
        sale_starts_at IS NULL OR sale_ends_at IS NULL OR sale_ends_at > sale_starts_at
    );

COMMENT ON COLUMN products.inventory_policy IS
'deny = refuse the sale at zero stock. continue = accept it (backorder). Read by CartService; never bypass it in a client.';
COMMENT ON COLUMN products.sale_price IS
'Scheduled markdown. Effective price is sale_price only while now() is inside the sale window; outside it, price applies again automatically.';
COMMENT ON COLUMN products.published_at IS
'Scheduled availability. A product with status=active and a future published_at is saved but not yet visible on the storefront.';

-- Storefront visibility is "active AND published", so the index has to cover
-- both or every listing degrades to a sequential scan.
CREATE INDEX IF NOT EXISTS idx_products_published
    ON products(published_at) WHERE status = 'active';

-- Live sales, for the "On sale" rail and for scheduled-sale housekeeping.
CREATE INDEX IF NOT EXISTS idx_products_on_sale
    ON products(sale_ends_at) WHERE sale_price IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. BACKFILL
--    Existing active products are already live; giving them a published_at of
--    their creation date keeps them visible the moment this migration lands.
--    Without this, every product in the catalogue would disappear.
-- ---------------------------------------------------------------------------
UPDATE products
SET published_at = created_at
WHERE published_at IS NULL AND status = 'active';

-- ---------------------------------------------------------------------------
-- 3. VARIANT-LEVEL SALE PRICE AND ORDERING
--    Variants carry their own price, so a product-level markdown could not
--    reach them. The sale *window* stays on the product - one sale, one set of
--    dates - while the marked-down amount is per variant.
-- ---------------------------------------------------------------------------
ALTER TABLE product_variants
    ADD COLUMN IF NOT EXISTS sale_price NUMERIC(12, 2),
    -- Explicit display order. Generated variants otherwise sort by creation
    -- time, which puts "XL, S, M" on a size picker.
    ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 0;

ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_sale_price_check;
ALTER TABLE product_variants ADD CONSTRAINT product_variants_sale_price_check
    CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price < price));

CREATE INDEX IF NOT EXISTS idx_variants_position ON product_variants(product_id, position);

-- ---------------------------------------------------------------------------
-- 4. OPTION SETS
--
--    Until now a variant's attributes JSON was the only record that "Size" and
--    "Colour" existed, so the admin form could offer one attribute at a time
--    and the storefront had to infer pickers from whatever the rows happened to
--    contain. An explicit option set is what lets a merchant define
--    Size x Colour and have every combination generated for them.
--
--    Three options maximum, matching Shopify. The cap is not arbitrary: a
--    fourth axis multiplies the variant grid past what anyone can maintain by
--    hand, and every storefront picker layout assumes at most three.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    -- Ordered values as the merchant typed them: S, M, L - not alphabetical.
    values TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, name)
);

CREATE INDEX IF NOT EXISTS idx_product_options_product
    ON product_options(product_id, position);

CREATE OR REPLACE FUNCTION enforce_product_option_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    option_count INT;
BEGIN
    SELECT COUNT(*) INTO option_count
    FROM product_options
    WHERE product_id = NEW.product_id;

    IF option_count > 3 THEN
        RAISE EXCEPTION 'A product may have at most 3 options (got %)', option_count;
    END IF;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_product_option_limit ON product_options;
CREATE CONSTRAINT TRIGGER trg_product_option_limit
    AFTER INSERT ON product_options
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION enforce_product_option_limit();

ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;

-- Readable by anyone, but only for products that are actually published: an
-- unreleased product's option names leak its roadmap.
DROP POLICY IF EXISTS "Public can view options of active products" ON product_options;
CREATE POLICY "Public can view options of active products" ON product_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = product_options.product_id
              AND p.status = 'active'
              AND (p.published_at IS NULL OR p.published_at <= NOW())
        )
    );
-- No write policy: options are authored in admin, through the service role.

COMMENT ON TABLE product_options IS
'Named option sets (Size, Colour...) whose cartesian product generates product_variants. Max 3 per product, matching Shopify.';

-- ---------------------------------------------------------------------------
-- 5. HOW AN OPTION VALUE SORTS
--
--    Alphabetical order is wrong for almost every option a shop actually
--    sells. It renders sizes as "L, M, S, XL" and shoe sizes as "UK 10, UK 11,
--    UK 7", both of which look like a bug to a shopper and are a bug to a
--    merchant. Three rules, in order:
--
--      1. A known garment size sorts by the size run, not the alphabet.
--      2. Anything containing a number sorts by that number, so UK 7 precedes
--         UK 10 and 500ml precedes 1000ml.
--      3. Everything else falls back to alphabetical, which is right for
--         colours and materials where no natural order exists.
--
--    IMMUTABLE so it can be used in an index later if option grids grow.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION option_value_sort_key(value TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
DECLARE
    size_run  CONSTANT TEXT[] := ARRAY[
        'xxxs','xxs','xs','s','small','m','medium','l','large','xl',
        'xxl','2xl','xxxl','3xl','4xl','5xl'
    ];
    size_index INT;
    numeric_part TEXT;
BEGIN
    IF value IS NULL THEN
        RETURN 1000000;
    END IF;

    size_index := array_position(size_run, lower(btrim(value)));
    IF size_index IS NOT NULL THEN
        RETURN size_index;
    END IF;

    -- Non-capturing group on purpose: Postgres's substring() returns the
    -- FIRST parenthesised subexpression when there is one, so a capturing
    -- group here would return NULL for "UK 10" instead of "10".
    numeric_part := substring(value FROM '[0-9]+(?:\.[0-9]+)?');
    IF numeric_part IS NOT NULL THEN
        -- Offset past the size run so a numbered value never interleaves with
        -- a lettered one.
        RETURN 1000 + numeric_part::NUMERIC;
    END IF;

    RETURN 1000000;
END;
$function$;

COMMENT ON FUNCTION option_value_sort_key(TEXT) IS
'Sort key for an option value: garment sizes by the size run, numbered values by their number, everything else alphabetically by the caller''s tiebreak.';

-- ---------------------------------------------------------------------------
-- 6. BACKFILL OPTIONS FROM EXISTING VARIANT ATTRIBUTES
--    Products that already have variants get their implied option sets, so the
--    new matrix editor opens populated instead of blank - otherwise the first
--    save in the new form would look like it had wiped the merchant's work.
--
--    Re-runnable: the values and positions are recomputed on conflict, so
--    fixing the ordering rules above and re-applying this migration corrects a
--    database that was migrated earlier.
-- ---------------------------------------------------------------------------
WITH option_values AS (
    SELECT v.product_id,
           attr.key   AS name,
           attr.value AS value,
           MIN(v.created_at) AS first_seen
    FROM product_variants v
    CROSS JOIN LATERAL jsonb_each_text(v.attributes) AS attr(key, value)
    WHERE v.attributes <> '{}'::jsonb
    GROUP BY v.product_id, attr.key, attr.value
),
option_sets AS (
    SELECT product_id,
           name,
           ARRAY_AGG(value ORDER BY option_value_sort_key(value), value) AS values,
           MIN(first_seen) AS key_first_seen
    FROM option_values
    GROUP BY product_id, name
)
INSERT INTO product_options (product_id, name, values, position)
SELECT product_id,
       name,
       values,
       (ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY key_first_seen, name) - 1)::INT
FROM option_sets
ON CONFLICT (product_id, name) DO UPDATE
    SET values   = EXCLUDED.values,
        position = EXCLUDED.position;

-- ---------------------------------------------------------------------------
-- 7. BACKFILL VARIANT POSITIONS
--    Every existing variant has position 0, so the picker would still fall back
--    to whatever order Postgres happened to return. Rank them by their first
--    option axis using the same rules, so the size picker reads S, M, L, XL.
-- ---------------------------------------------------------------------------
WITH first_axis AS (
    SELECT o.product_id, o.name
    FROM product_options o
    WHERE o.position = 0
),
ranked AS (
    SELECT v.id,
           ROW_NUMBER() OVER (
               PARTITION BY v.product_id
               ORDER BY
                   option_value_sort_key(v.attributes ->> f.name),
                   v.attributes ->> f.name,
                   v.created_at,
                   v.id
           ) - 1 AS pos
    FROM product_variants v
    LEFT JOIN first_axis f ON f.product_id = v.product_id
)
UPDATE product_variants v
SET position = r.pos
FROM ranked r
WHERE v.id = r.id AND v.position IS DISTINCT FROM r.pos;

-- ---------------------------------------------------------------------------
-- 8. CURATED PRODUCT RELATIONS - make the existing table usable from admin.
--    product_bundles has existed since the merchandising migration but nothing
--    could curate it, because there was no admin surface. Admin writes go
--    through the service role, which bypasses RLS; the missing piece was the
--    reverse-lookup index used when listing or deleting a linked product.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_product_bundles_related
    ON product_bundles(related_product_id);
