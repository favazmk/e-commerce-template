/**
 * Prepare a presentable demo catalog.
 *
 * Two jobs:
 *   1. Archive products created by the test suites (concurrency-test-*,
 *      integration-test-*, e2e-*, const-test-*, new-admin-product-*). These are
 *      active in the catalog and would otherwise appear in the storefront.
 *      They are archived rather than deleted so the change is reversible and no
 *      order history is orphaned.
 *   2. Upsert a curated set of demo products so the grid, category pages and
 *      search look like a real store rather than a near-empty one.
 *
 * Products seeded here intentionally ship WITHOUT images: they render the
 * designed monogram placeholder until real photography is dropped into
 * `public/products/<slug>.jpg` and `npm run images:sync` is run.
 *
 * Safe to re-run — products are matched on slug and updated in place.
 *
 * Usage:
 *   node scripts/seed-demo-catalog.mjs [--dry-run]
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");

/** Slug prefixes produced by the automated test suites. */
const TEST_SLUG = /^(concurrency-test|integration-test|e2e-tamper|e2e-cust-prod|e2e-admin|test-product|const-test|new-admin-product|rls-)/i;

/**
 * Demo catalog. Grouped by category slug so category pages fill out evenly.
 * Prices are plausible for a mid-to-upper contemporary label.
 */
const CATALOG = {
  "luxury-apparel": [
    ["Boiled Wool Car Coat", 465, 580, "Double-faced boiled wool with a softly structured shoulder.", ["outerwear", "wool"]],
    ["Garment-Dyed Oxford Shirt", 145, null, "Washed cotton oxford with a relaxed collar roll.", ["shirting", "cotton"]],
    ["Heavyweight Loopback Sweatshirt", 165, null, "14oz loopback cotton, tubular knit, no side seams.", ["knitwear"]],
    ["Pleated Wide-Leg Trouser", 235, 290, "High-rise pleated trouser in a dry-handle wool blend.", ["tailoring"]],
    ["Silk-Cotton Camp Collar Shirt", 210, null, "An open weave of silk and long-staple cotton.", ["shirting", "silk"]],
    ["Brushed Alpaca Crewneck", 320, null, "Brushed alpaca with a halo finish that softens with wear.", ["knitwear", "alpaca"]],
    ["Waxed Cotton Field Jacket", 395, null, "Dry-waxed cotton canvas with a corduroy collar.", ["outerwear"]],
    ["Fine-Gauge Merino Polo", 185, 225, "Long-staple merino knitted to a fine 18-gauge.", ["knitwear", "merino"]],
  ],
  "artisanal-footwear": [
    ["Hand-Welted Derby Shoe", 520, null, "Goodyear-welted on a rounded last, calfskin upper.", ["formal", "leather"]],
    ["Suede Desert Boot", 295, 350, "Unlined calf suede on a natural crepe sole.", ["boots", "suede"]],
    ["Woven Leather Loafer", 340, null, "Hand-woven vegetable-tanned leather, unlined.", ["loafers", "leather"]],
    ["Vulcanised Canvas Trainer", 175, null, "Heavy cotton canvas, vulcanised gum outsole.", ["sneakers"]],
    ["Shearling-Lined Winter Boot", 445, null, "Oiled nubuck with a full shearling lining.", ["boots", "winter"]],
    ["Horsebit Leather Slipper", 310, null, "Polished calf with an antiqued brass bit.", ["loafers"]],
    ["Trail Runner in Ripstop", 230, 275, "Ripstop upper over a dual-density foam midsole.", ["sneakers"]],
  ],
  "designer-accessories": [
    ["Bridle Leather Belt", 135, null, "English bridle leather, solid brass buckle.", ["leather"]],
    ["Waxed Canvas Weekender", 385, 450, "Waxed canvas with bridle leather reinforcements.", ["bags"]],
    ["Cashmere Ribbed Scarf", 195, null, "Two-ply cashmere, hand-finished fringe.", ["cashmere", "winter"]],
    ["Slim Bifold Wallet", 120, null, "Four card slots in vegetable-tanned calfskin.", ["leather", "small-goods"]],
    ["Acetate Round Optical Frame", 265, null, "Hand-polished Italian acetate, titanium core wire.", ["eyewear"]],
    ["Hard Enamel Pin Set", 45, null, "A set of three hard-enamel pins.", ["small-goods"]],
    ["Leather Card Holder", 85, 110, "A slim three-pocket holder that breaks in quickly.", ["leather", "small-goods"]],
    ["Brushed Steel Mesh Bracelet", 175, null, "Brushed 316L steel on a fold-over clasp.", ["jewellery"]],
  ],
  "home-and-living": [
    ["Stoneware Dinner Plate Set", 165, 195, "Four reactive-glaze plates, no two alike.", ["ceramics", "tableware"]],
    ["Hand-Poured Soy Candle", 65, null, "Cedar, vetiver and black pepper. 60-hour burn.", ["home-fragrance"]],
    ["Waffle Weave Bath Towel", 78, null, "Long-staple Turkish cotton in a waffle weave.", ["bath", "cotton"]],
    ["Solid Oak Serving Board", 145, null, "Single-plank white oak finished in food-safe oil.", ["kitchen", "wood"]],
    ["Linen Bedding Bundle", 340, 420, "Stonewashed European flax, softens with every wash.", ["bedding", "linen"]],
    ["Blown Glass Carafe", 95, null, "Mouth-blown borosilicate with a tumbler lid.", ["glassware"]],
    ["Wool Boucle Throw", 225, null, "Lambswool boucle woven on a traditional loom.", ["textiles", "wool"]],
  ],
};

/** Variant sets by category, so the PDP has something to select. */
const VARIANTS = {
  "luxury-apparel": [
    { size: "S" }, { size: "M" }, { size: "L" }, { size: "XL" },
  ],
  "artisanal-footwear": [
    { size: "UK 7" }, { size: "UK 8" }, { size: "UK 9" }, { size: "UK 10" }, { size: "UK 11" },
  ],
  "designer-accessories": [],
  "home-and-living": [],
};

function loadEnv() {
  const file = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) throw new Error(".env.local not found");
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([^#\s=]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^['"](.*)['"]$/, "$1");
  }
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function skuFor(slug) {
  return slug.toUpperCase().replace(/-/g, "").slice(0, 14);
}

/** Deterministic pseudo-random so re-runs produce identical stock numbers. */
function seededInt(seed, min, max) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const span = max - min + 1;
  return min + (Math.abs(h) % span);
}

async function main() {
  loadEnv();
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ---- 1. Archive test artifacts ----------------------------------------
  const { data: all, error: loadError } = await db
    .from("products")
    .select("id,slug,status");
  if (loadError) throw new Error(loadError.message);

  const junk = all.filter((p) => TEST_SLUG.test(p.slug) && p.status !== "archived");
  console.log(`Test artifacts to archive: ${junk.length}`);
  if (junk.length && !DRY_RUN) {
    const { error } = await db
      .from("products")
      .update({ status: "archived", featured: false })
      .in("id", junk.map((p) => p.id));
    console.log(error ? `  failed: ${error.message}` : `  archived ${junk.length}`);
  }

  // Also archive the stray placeholder draft left behind by manual testing.
  if (!DRY_RUN) {
    await db.from("products").update({ status: "archived" }).eq("slug", "overcoat");
  }

  // ---- 2. Resolve categories --------------------------------------------
  const { data: cats } = await db.from("categories").select("id,slug").eq("is_active", true);
  const catId = Object.fromEntries((cats ?? []).map((c) => [c.slug, c.id]));
  const missingCats = Object.keys(CATALOG).filter((s) => !catId[s]);
  if (missingCats.length) {
    console.log(`\nSkipping unknown categories: ${missingCats.join(", ")}`);
  }

  // ---- 3. Upsert the demo catalog ---------------------------------------
  let created = 0;
  let updated = 0;
  const existingBySlug = new Map(all.map((p) => [p.slug, p]));

  for (const [categorySlug, items] of Object.entries(CATALOG)) {
    if (!catId[categorySlug]) continue;

    for (const [name, price, compareAt, description, tags] of items) {
      const slug = slugify(name);
      const stock = seededInt(slug, 8, 60);
      const row = {
        name,
        slug,
        sku: skuFor(slug),
        description,
        short_description: description,
        price,
        compare_at_price: compareAt,
        currency: "USD",
        stock_quantity: stock,
        low_stock_threshold: 5,
        status: "active",
        featured: seededInt(slug + "f", 0, 4) === 0,
        category_id: catId[categorySlug],
        brand: process.env.NEXT_PUBLIC_STORE_NAME || undefined,
        tags,
      };

      const existing = existingBySlug.get(slug);
      if (DRY_RUN) {
        console.log(`  would ${existing ? "update" : "create"}  ${categorySlug}/${slug}`);
        continue;
      }

      if (existing) {
        const { error } = await db.from("products").update(row).eq("id", existing.id);
        if (error) console.log(`  FAILED update ${slug}: ${error.message}`);
        else updated++;
      } else {
        const { data: inserted, error } = await db
          .from("products")
          .insert([row])
          .select("id")
          .single();
        if (error) {
          console.log(`  FAILED create ${slug}: ${error.message}`);
          continue;
        }
        created++;

        // Variants give the product detail page a selector to show.
        const variantSpecs = VARIANTS[categorySlug] ?? [];
        if (variantSpecs.length) {
          const variantRows = variantSpecs.map((attributes, i) => ({
            product_id: inserted.id,
            sku: `${skuFor(slug)}-${i + 1}`,
            price,
            stock: seededInt(slug + i, 0, 14),
            is_active: true,
            attributes,
          }));
          const { error: vErr } = await db.from("product_variants").insert(variantRows);
          if (vErr) console.log(`  variants failed for ${slug}: ${vErr.message}`);
        }
      }
    }
  }

  if (!DRY_RUN) console.log(`\nDemo catalog: ${created} created, ${updated} updated`);

  // ---- 4. Report ---------------------------------------------------------
  const { data: active } = await db
    .from("products")
    .select("id,slug,category_id,featured,images:product_images(id)")
    .eq("status", "active");
  console.log(`\nActive products now: ${active?.length ?? 0}`);
  console.log(`  featured: ${active?.filter((p) => p.featured).length ?? 0}`);
  console.log(`  with a photo: ${active?.filter((p) => (p.images?.length ?? 0) > 0).length ?? 0}`);
  console.log(`  showing placeholder: ${active?.filter((p) => (p.images?.length ?? 0) === 0).length ?? 0}`);

  for (const c of cats ?? []) {
    const n = active?.filter((p) => p.category_id === c.id).length ?? 0;
    console.log(`  ${c.slug.padEnd(26)} ${n}`);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exitCode = 1;
});
