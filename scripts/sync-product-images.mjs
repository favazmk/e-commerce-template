/**
 * Attach product photos by dropping files into `public/products/`.
 *
 * The intent is that a non-developer can add real photography without touching
 * the admin UI or the database: name the file after the product slug, drop it
 * in the folder, run the script. Anything without a photo keeps rendering the
 * designed monogram placeholder, so the storefront never looks broken.
 *
 * Naming
 *   public/products/<slug>.jpg        -> primary image for that product
 *   public/products/<slug>-2.jpg      -> second gallery image
 *   public/products/<slug>-3.webp     -> third, and so on
 *
 * Accepted extensions: .jpg .jpeg .png .webp .avif
 *
 * Usage
 *   node scripts/sync-product-images.mjs            apply
 *   node scripts/sync-product-images.mjs --dry-run  report only
 *   node scripts/sync-product-images.mjs --prune    also drop rows whose file is gone
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");
const PRUNE = process.argv.includes("--prune");

const IMAGE_DIR = path.resolve(process.cwd(), "public/products");
const PUBLIC_PREFIX = "/products";
const VALID_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

function loadEnv() {
  const file = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) throw new Error(".env.local not found");
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([^#\s=]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^['"](.*)['"]$/, "$1");
  }
}

/** "merino-overcoat-2.jpg" -> { slug: "merino-overcoat", order: 2 } */
function parseFileName(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (!VALID_EXT.has(ext)) return null;

  const base = path.basename(fileName, ext);
  const trailing = base.match(/^(.*?)-(\d+)$/);
  if (trailing) {
    return { slug: trailing[1], order: Number(trailing[2]) };
  }
  return { slug: base, order: 1 };
}

async function main() {
  loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  const db = createClient(url, key);

  if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
    console.log(`Created ${IMAGE_DIR}`);
  }

  const files = fs.readdirSync(IMAGE_DIR).filter((f) => VALID_EXT.has(path.extname(f).toLowerCase()));
  if (files.length === 0) {
    console.log("No image files found in public/products/.\n");
    console.log("Add photos named after the product slug, for example:");
    console.log("  public/products/merino-overcoat.jpg");
    console.log("  public/products/merino-overcoat-2.jpg   (second gallery image)\n");
    console.log("Find slugs with: node scripts/sync-product-images.mjs --dry-run");
  }

  const { data: products, error } = await db
    .from("products")
    .select("id,slug,name,images:product_images(id,url,display_order)")
    .eq("status", "active")
    .order("name");
  if (error) throw new Error(`Could not load products: ${error.message}`);

  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const matched = [];
  const unmatched = [];
  for (const file of files) {
    const parsed = parseFileName(file);
    if (!parsed) continue;
    const product = bySlug.get(parsed.slug);
    if (product) {
      matched.push({ file, product, order: parsed.order, url: `${PUBLIC_PREFIX}/${file}` });
    } else {
      unmatched.push({ file, slug: parsed.slug });
    }
  }

  console.log(`\n${files.length} file(s) in public/products/  ->  ${matched.length} matched a product\n`);

  let inserted = 0;
  let updated = 0;
  for (const m of matched) {
    const existing = m.product.images?.find((img) => img.display_order === m.order);
    if (existing && existing.url === m.url) continue;

    if (DRY_RUN) {
      console.log(`  would ${existing ? "update" : "add   "}  ${m.product.slug}  <- ${m.file}`);
      continue;
    }

    if (existing) {
      const { error: e } = await db
        .from("product_images")
        .update({ url: m.url, alt_text: m.product.name })
        .eq("id", existing.id);
      if (!e) {
        updated++;
        console.log(`  updated  ${m.product.slug}  <- ${m.file}`);
      } else {
        console.log(`  FAILED   ${m.product.slug}: ${e.message}`);
      }
    } else {
      const { error: e } = await db.from("product_images").insert([
        {
          product_id: m.product.id,
          url: m.url,
          alt_text: m.product.name,
          display_order: m.order,
          is_primary: m.order === 1,
        },
      ]);
      if (!e) {
        inserted++;
        console.log(`  added    ${m.product.slug}  <- ${m.file}`);
      } else {
        console.log(`  FAILED   ${m.product.slug}: ${e.message}`);
      }
    }
  }

  if (unmatched.length) {
    console.log(`\n${unmatched.length} file(s) did not match any product slug:`);
    for (const u of unmatched) console.log(`  ${u.file}  (looked for slug "${u.slug}")`);
  }

  if (PRUNE) {
    const localRows = [];
    for (const p of products) {
      for (const img of p.images ?? []) {
        if (img.url?.startsWith(PUBLIC_PREFIX + "/")) localRows.push({ ...img, slug: p.slug });
      }
    }
    const onDisk = new Set(files.map((f) => `${PUBLIC_PREFIX}/${f}`));
    const stale = localRows.filter((r) => !onDisk.has(r.url));
    console.log(`\n${stale.length} database row(s) point at a file that is no longer present`);
    for (const r of stale) {
      if (DRY_RUN) {
        console.log(`  would remove  ${r.slug}  ${r.url}`);
        continue;
      }
      const { error: e } = await db.from("product_images").delete().eq("id", r.id);
      console.log(e ? `  FAILED  ${r.url}: ${e.message}` : `  removed  ${r.slug}  ${r.url}`);
    }
  }

  // Coverage report — how much of the catalog still shows a placeholder.
  const { data: after } = await db
    .from("products")
    .select("id,slug,name,images:product_images(id)")
    .eq("status", "active");
  const withPhoto = after.filter((p) => (p.images?.length ?? 0) > 0);

  if (!DRY_RUN) console.log(`\nadded ${inserted}, updated ${updated}`);
  console.log(
    `\nCatalog coverage: ${withPhoto.length}/${after.length} products have a photo, ` +
      `${after.length - withPhoto.length} show the placeholder.`
  );

  const missing = after.filter((p) => (p.images?.length ?? 0) === 0).slice(0, 15);
  if (missing.length) {
    console.log("\nSlugs still awaiting a photo (drop a file named <slug>.jpg):");
    for (const p of missing) console.log(`  ${p.slug}`);
    if (after.length - withPhoto.length > missing.length) {
      console.log(`  ... and ${after.length - withPhoto.length - missing.length} more`);
    }
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exitCode = 1;
});
