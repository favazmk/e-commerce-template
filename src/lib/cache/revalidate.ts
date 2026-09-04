import { revalidatePath } from "next/cache";

/**
 * Cache invalidation for catalog changes.
 *
 * Catalog pages are statically generated and revalidated on a timer, which is
 * what makes them fast and cheap to serve. The cost is staleness: without an
 * explicit invalidation, a product an admin publishes at 09:00 does not reach
 * the sitemap, the category page or the Google Merchant feed until the timer
 * expires — up to an hour later.
 *
 * That lag is invisible in the admin panel (which is always dynamic), so it
 * reads as "the product did not save". Every write path therefore calls the
 * helper below, and the list of affected surfaces lives here rather than being
 * copy-pasted — a new cached surface is added in one place instead of being
 * silently forgotten by half the routes.
 */

/** Surfaces that list or summarise the whole catalog. */
const CATALOG_WIDE_PATHS = [
  "/", // homepage rails: featured, best sellers
  "/products", // the main listing
  "/sitemap.xml", // search engines discover new products from here
  "/feeds/google-merchant.xml", // Google Shopping / free listings
  "/feeds/meta-catalog.csv", // Instagram Shopping / dynamic ads
  "/admin/products",
];

export interface ProductRevalidationTarget {
  /** URL slug, so the product's own page can be invalidated. */
  slug?: string | null;
  /** Category slug, so that category's landing page is invalidated too. */
  categorySlug?: string | null;
}

/**
 * Invalidate everything a product change can affect.
 *
 * Safe to call with partial information: a missing slug simply means the
 * product's own page is not targeted individually, and the catalog-wide paths
 * still refresh.
 */
export function revalidateProduct(target: ProductRevalidationTarget = {}): void {
  for (const path of CATALOG_WIDE_PATHS) {
    safeRevalidate(path);
  }

  if (target.slug) {
    safeRevalidate(`/products/${target.slug}`);
  }

  if (target.categorySlug) {
    safeRevalidate(`/categories/${target.categorySlug}`);
  }
}

/**
 * Invalidate after a change that affects many products at once — a bulk import,
 * a category rename, a settings change that alters pricing or shipping.
 *
 * Category pages are revalidated by layout, which covers every `[slug]` at once
 * rather than requiring the caller to enumerate them.
 */
export function revalidateCatalog(): void {
  for (const path of CATALOG_WIDE_PATHS) {
    safeRevalidate(path);
  }
  safeRevalidate("/categories/[slug]", "page");
}

/**
 * Invalidation must never take down the write that triggered it.
 *
 * `revalidatePath` throws when called outside a request scope (a background
 * job, a script). The product was already saved by that point, so failing the
 * request would report a false error to the admin and tempt them to save again.
 */
function safeRevalidate(path: string, type?: "page" | "layout"): void {
  try {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  } catch (error) {
    console.error(`[revalidate] Could not invalidate ${path}:`, error);
  }
}
