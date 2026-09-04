-- ============================================================================
-- MERCHANT-CONTROLLED PRODUCT BADGES AND COLOUR SWATCHES
-- ----------------------------------------------------------------------------
-- Two gaps this closes.
--
-- 1. The only merchandising flag was the boolean `featured`. A merchant could
--    not mark something a bestseller, a new arrival or a limited drop without
--    an engineer. Badges are the cheapest conversion lever on a grid — they are
--    read before the product name — so putting them behind a deploy is wrong.
--
-- 2. Variant colours had no colour *value*, only a name in the attributes JSON.
--    That makes it impossible to draw a swatch, so a shopper had to open every
--    product to find out what colours exist. On a fashion grid that is the
--    single most common reason for a wasted click.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Badges
--
--    A single optional badge per product. Deliberately one, not a list: a card
--    with three badges communicates less than a card with one, and the whole
--    value of a badge is that it is the exception.
-- ---------------------------------------------------------------------------
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS badge_label TEXT,
    ADD COLUMN IF NOT EXISTS badge_tone  TEXT NOT NULL DEFAULT 'primary';

-- Tones map to the storefront's semantic colours rather than to raw hex, so a
-- client rebrand moves every badge with it.
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_badge_tone_check;
ALTER TABLE products ADD CONSTRAINT products_badge_tone_check
    CHECK (badge_tone IN ('primary', 'success', 'discount', 'urgent', 'neutral'));

-- Keep the label short. A badge that wraps is not a badge.
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_badge_label_length;
ALTER TABLE products ADD CONSTRAINT products_badge_label_length
    CHECK (badge_label IS NULL OR char_length(badge_label) <= 24);

COMMENT ON COLUMN products.badge_label IS
'Optional merchandising badge shown on the product card, e.g. "BESTSELLER". Set in Admin -> Products. Leave null to let the storefront derive one from real sales data.';

CREATE INDEX IF NOT EXISTS idx_products_badge
    ON products(badge_label) WHERE badge_label IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Colour swatches
--
--    `swatch_hex` lets the grid draw the actual colour. `is_default` marks
--    which variant the card should preview, so a product whose first variant is
--    an odd colourway is not represented by it.
-- ---------------------------------------------------------------------------
ALTER TABLE product_variants
    ADD COLUMN IF NOT EXISTS swatch_hex TEXT,
    ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_swatch_hex_check;
ALTER TABLE product_variants ADD CONSTRAINT product_variants_swatch_hex_check
    CHECK (swatch_hex IS NULL OR swatch_hex ~* '^#[0-9a-f]{6}$');

COMMENT ON COLUMN product_variants.swatch_hex IS
'Hex colour drawn as a swatch on the product card, e.g. "#1B2A4A". Optional: without it the storefront falls back to a name lookup, then to the variant image.';

-- Exactly one default per product. A partial unique index expresses that
-- without forbidding the many non-default rows.
DROP INDEX IF EXISTS idx_variants_one_default_per_product;
CREATE UNIQUE INDEX idx_variants_one_default_per_product
    ON product_variants(product_id) WHERE is_default;

-- ---------------------------------------------------------------------------
-- 3. Backfill: promote the first active variant of each product to default, so
--    existing catalogues get sensible card previews without manual work.
-- ---------------------------------------------------------------------------
WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY product_id
               ORDER BY (stock > 0) DESC, created_at ASC, id ASC
           ) AS position
    FROM product_variants
    WHERE is_active
)
UPDATE product_variants v
SET is_default = true
FROM ranked r
WHERE v.id = r.id
  AND r.position = 1
  AND NOT EXISTS (
      SELECT 1 FROM product_variants existing
      WHERE existing.product_id = v.product_id AND existing.is_default
  );
