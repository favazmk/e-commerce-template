import type { MetadataRoute } from "next";
import { ProductService } from "@/services/product.service";
import { CategoryService } from "@/services/category.service";
import { absoluteUrl, isIndexable } from "@/lib/seo/site";

/**
 * XML sitemap served at /sitemap.xml.
 *
 * Search engines discover new products far faster from a sitemap than by
 * crawling links, and `lastModified` tells them which pages are worth
 * re-crawling. A sitemap that lists unreachable or non-indexable URLs damages
 * trust in the whole file, so demo/preview deployments emit nothing.
 */

// Regenerated hourly; a fresh catalog does not need to wait for a deploy.
export const revalidate = 3600;

/** Routes that always exist, with the priority Google should infer. */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/products", priority: 0.9, changeFrequency: "daily" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/track-order", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/shipping-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexable()) return [];

  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const categories = await CategoryService.getCategories(true);
    for (const category of categories) {
      entries.push({
        url: absoluteUrl(`/categories/${category.slug}`),
        lastModified: category.updated_at ? new Date(category.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error("[sitemap] Category listing failed:", error);
  }

  try {
    // Only active products are listed: a sitemap entry for a draft or archived
    // product is a soft-404 waiting to happen.
    const { items } = await ProductService.getProducts({ limit: 5000 });
    for (const product of items) {
      entries.push({
        url: absoluteUrl(`/products/${product.slug}`),
        lastModified: product.updated_at ? new Date(product.updated_at) : now,
        changeFrequency: "weekly",
        priority: product.featured ? 0.9 : 0.7,
      });
    }
  } catch (error) {
    console.error("[sitemap] Product listing failed:", error);
  }

  return entries;
}
