import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { CategoryService } from "@/services/category.service";
import { ProductService } from "@/services/product.service";
import { CatalogListing, derivePriceBands } from "@/components/storefront/CatalogListing";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/structured-data";
import { canonicalUrl } from "@/lib/seo/site";
import { getStoreDisplayName } from "@/lib/config/store.config";

/**
 * Category landing page.
 *
 * This route previously redirected to `/products?category=<slug>`, which threw
 * away the most valuable SEO asset a catalog has. Category pages are what rank
 * for the high-intent head terms ("men's perfume", "linen shirts"): they get a
 * stable, clean URL, their own title and description, their own breadcrumb
 * trail and their own ItemList markup. A query-string variant of a shared
 * listing page can have none of those.
 */

// Rebuilt hourly; new products appear without a deploy.
export const revalidate = 3600;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    brand?: string;
    inStock?: string;
    sort?: string;
    page?: string;
  }>;
}

/** Pre-render every category at build time — they are the money pages. */
export async function generateStaticParams() {
  try {
    const categories = await CategoryService.getCategories(true);
    return categories.map((category) => ({ slug: category.slug }));
  } catch {
    // A build without database access still succeeds; pages render on demand.
    return [];
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const category = await CategoryService.getCategoryBySlug(slug);

  if (!category) {
    return { title: "Category not found", robots: { index: false, follow: false } };
  }

  const storeName = getStoreDisplayName();
  const filtered = Boolean(query.brand || query.minPrice || query.maxPrice || query.inStock);

  return {
    title: category.name,
    description:
      category.description?.slice(0, 160) ||
      `Shop ${category.name.toLowerCase()} at ${storeName}. Free delivery on qualifying orders.`,
    alternates: { canonical: canonicalUrl(`/categories/${category.slug}`) },
    openGraph: {
      title: `${category.name} | ${storeName}`,
      description: category.description || undefined,
      url: canonicalUrl(`/categories/${category.slug}`),
      images: category.image_url ? [{ url: category.image_url }] : undefined,
    },
    // Filtered and paged variants stay crawlable but unindexed, so the clean
    // category URL is the only one competing for the term.
    robots: filtered || Number(query.page) > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const category = await CategoryService.getCategoryBySlug(slug);
  if (!category || !category.is_active) notFound();

  const page = Math.max(1, Number(query.page) || 1);
  const minPrice = query.minPrice ? Number(query.minPrice) : undefined;
  const maxPrice = query.maxPrice ? Number(query.maxPrice) : undefined;

  const [categories, result, facetSource] = await Promise.all([
    CategoryService.getCategories(true),
    ProductService.getProducts({
      categorySlug: slug,
      minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      brand: query.brand,
      inStockOnly: query.inStock === "true",
      sortBy: (query.sort as never) || "featured",
      page,
      limit: 12,
    }),
    ProductService.getProducts({ categorySlug: slug, limit: 500 }),
  ]);

  const priceBands = derivePriceBands(facetSource.items.map((product) => product.price));
  const brands = [
    ...new Set(
      facetSource.items
        .map((product) => product.brand)
        .filter((brand): brand is string => Boolean(brand && brand.trim()))
    ),
  ].sort();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
            { name: category.name, path: `/categories/${category.slug}` },
          ]),
          itemListJsonLd(result.items, category.name),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-brand-muted-ink">
          <li>
            <Link href="/" className="transition-colors hover:text-brand-ink">
              Home
            </Link>
          </li>
          <ChevronRight className="h-3 w-3 text-brand-faint-ink" aria-hidden="true" />
          <li>
            <Link href="/products" className="transition-colors hover:text-brand-ink">
              Products
            </Link>
          </li>
          <ChevronRight className="h-3 w-3 text-brand-faint-ink" aria-hidden="true" />
          <li className="font-semibold text-brand-ink">{category.name}</li>
        </ol>
      </nav>

      <header className="mb-8 border-b border-brand-border pb-6">
        <h1 className="font-heading text-2xl font-bold text-brand-ink sm:text-4xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-muted-ink">
            {category.description}
          </p>
        )}
      </header>

      <CatalogListing
        products={result.items}
        total={result.total}
        totalPages={result.totalPages}
        categories={categories}
        basePath={`/categories/${category.slug}`}
        priceBands={priceBands}
        brands={brands}
        filters={{
          category: category.slug,
          minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
          maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
          brand: query.brand,
          inStock: query.inStock === "true",
          sort: query.sort,
          page,
        }}
      />
    </div>
  );
}
