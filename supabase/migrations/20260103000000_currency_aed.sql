-- ============================================================================
-- Switch the store's stored currency to AED (UAE dirham).
--
-- Display formatting is environment-driven (NEXT_PUBLIC_DEFAULT_CURRENCY), but
-- three tables persist a currency code alongside the amount. Those columns are
-- the record of what a customer was actually charged, so the default is moved
-- forward for new rows and existing rows are migrated in place.
--
-- Historical orders/payments in another currency should NOT be rewritten in a
-- live store. This migration is written for a store that has not yet traded in
-- a second currency; it only touches rows still carrying the old default.
-- ============================================================================

ALTER TABLE products ALTER COLUMN currency SET DEFAULT 'AED';
ALTER TABLE orders   ALTER COLUMN currency SET DEFAULT 'AED';
ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'AED';

UPDATE products SET currency = 'AED' WHERE currency = 'USD';
UPDATE orders   SET currency = 'AED' WHERE currency = 'USD';
UPDATE payments SET currency = 'AED' WHERE currency = 'USD';
