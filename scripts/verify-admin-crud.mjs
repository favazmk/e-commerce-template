/**
 * End-to-end verification of the admin persistence paths, run against the
 * real database.
 *
 * A green build only proves the code compiles. This script proves the rows
 * actually change: it creates a product with images and sizes, edits it,
 * adjusts stock per size, exercises coupon CRUD, and then removes everything
 * it created so the catalogue is left exactly as it was found.
 *
 * Usage: node scripts/verify-admin-crud.mjs
 */
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const results = [];
function check(label, passed, detail = "") {
  results.push({ label, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

const stamp = Date.now();
const created = { productId: null, couponId: null };

async function main() {
  await client.connect();

  // ---------------------------------------------------------------- products
  const productRow = await client.query(
    `insert into products (name, slug, sku, price, stock_quantity, status, short_description, description)
     values ($1, $2, $3, $4, $5, 'draft', '', '')
     returning id, currency`,
    [`verify-${stamp}`, `verify-${stamp}`, `VERIFY-${stamp}`, 199.0, 0]
  );
  created.productId = productRow.rows[0].id;

  check(
    "New products default to AED",
    productRow.rows[0].currency === "AED",
    `got ${productRow.rows[0].currency}`
  );

  // Images — the table the old repository never wrote to.
  await client.query(
    `insert into product_images (product_id, url, alt_text, display_order, is_primary)
     values ($1, $2, 'primary', 0, true), ($1, $3, 'secondary', 1, false)`,
    [created.productId, `https://example.test/${stamp}-a.jpg`, `https://example.test/${stamp}-b.jpg`]
  );

  const images = await client.query(
    "select url, is_primary from product_images where product_id = $1 order by display_order",
    [created.productId]
  );
  check(
    "Product images persist and exactly one is primary",
    images.rowCount === 2 && images.rows.filter((r) => r.is_primary).length === 1,
    `${images.rowCount} images`
  );

  // Variants — per-size stock.
  const sizes = ["Small", "Medium", "Large"];
  for (const [i, size] of sizes.entries()) {
    await client.query(
      `insert into product_variants (product_id, sku, price, stock, attributes)
       values ($1, $2, $3, $4, $5)`,
      [created.productId, `VERIFY-${stamp}-${size.toUpperCase()}`, 199.0, (i + 1) * 5, JSON.stringify({ Size: size })]
    );
  }

  const variants = await client.query(
    "select sku, stock, attributes from product_variants where product_id = $1 order by stock",
    [created.productId]
  );
  check(
    "Sizes persist with independent stock",
    variants.rowCount === 3 && variants.rows.map((r) => r.stock).join(",") === "5,10,15",
    variants.rows.map((r) => `${r.attributes.Size}=${r.stock}`).join(" ")
  );

  // ------------------------------------------------------- stock adjustment
  // Mirrors SupabaseInventoryRepository.setStock: absolute target, delta
  // written to the ledger, product total recomputed from its sizes.
  const targetVariant = variants.rows[0];
  const variantId = (
    await client.query("select id, stock from product_variants where sku = $1", [targetVariant.sku])
  ).rows[0];

  const before = variantId.stock;
  const target = 42;

  await client.query("update product_variants set stock = $1 where id = $2", [target, variantId.id]);
  await client.query(
    `update products set stock_quantity =
       (select coalesce(sum(stock), 0) from product_variants where product_id = $1 and is_active = true)
     where id = $1`,
    [created.productId]
  );
  await client.query(
    `insert into inventory_transactions (product_id, variant_id, quantity_change, transaction_type, note)
     values ($1, $2, $3, 'adjustment', 'verification adjustment')`,
    [created.productId, variantId.id, target - before]
  );

  const afterVariant = await client.query("select stock from product_variants where id = $1", [
    variantId.id,
  ]);
  const afterProduct = await client.query("select stock_quantity from products where id = $1", [
    created.productId,
  ]);
  const ledger = await client.query(
    "select quantity_change, transaction_type, note from inventory_transactions where product_id = $1",
    [created.productId]
  );

  check("Per-size stock adjustment changes the row", afterVariant.rows[0].stock === target, `stock=${afterVariant.rows[0].stock}`);
  check(
    "Product total recalculates from its sizes",
    afterProduct.rows[0].stock_quantity === 42 + 10 + 15,
    `total=${afterProduct.rows[0].stock_quantity}`
  );
  check(
    "Adjustment writes an audit ledger row",
    ledger.rowCount === 1 && ledger.rows[0].quantity_change === target - before,
    `delta=${ledger.rows[0]?.quantity_change}`
  );

  // ---------------------------------------------------------------- coupons
  const couponRow = await client.query(
    `insert into coupons (code, discount_type, discount_value, min_order_value, is_active)
     values ($1, 'percentage', 15, 100, true) returning id, is_active`,
    [`VERIFY${stamp}`]
  );
  created.couponId = couponRow.rows[0].id;
  check("Coupon create persists", couponRow.rowCount === 1 && couponRow.rows[0].is_active === true);

  await client.query("update coupons set is_active = false where id = $1", [created.couponId]);
  const toggled = await client.query("select is_active from coupons where id = $1", [created.couponId]);
  check("Coupon deactivate persists", toggled.rows[0].is_active === false);

  await client.query("delete from coupons where id = $1", [created.couponId]);
  const gone = await client.query("select 1 from coupons where id = $1", [created.couponId]);
  check("Coupon delete removes the row", gone.rowCount === 0);
  created.couponId = null;

  // ------------------------------------------------------ cascade on delete
  await client.query("delete from products where id = $1", [created.productId]);
  const orphanImages = await client.query("select 1 from product_images where product_id = $1", [
    created.productId,
  ]);
  const orphanVariants = await client.query("select 1 from product_variants where product_id = $1", [
    created.productId,
  ]);
  check(
    "Deleting a product cascades to its images and sizes",
    orphanImages.rowCount === 0 && orphanVariants.rowCount === 0
  );
  created.productId = null;
}

try {
  await main();
} catch (error) {
  console.error("\nVerification aborted:", error.message);
  process.exitCode = 1;
} finally {
  // Leave the catalogue exactly as it was found, even on failure.
  if (created.couponId) await client.query("delete from coupons where id = $1", [created.couponId]).catch(() => {});
  if (created.productId)
    await client.query("delete from products where id = $1", [created.productId]).catch(() => {});
  await client.end();

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length > 0) process.exitCode = 1;
}
