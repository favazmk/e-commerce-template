import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { CategoryService } from "@/services/category.service";
import { ProductService } from "@/services/product.service";
import { CatalogListing, derivePriceBands } from "@/components/storefront/CatalogListing";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/structured-data";
import { canonicalUrl } from "@/lib/seo/site";
import { getStoreDisplayName } from "@/lib/config/store.config";

export interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    brand?: string;
    inStock?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const storeName = getStoreDisplayName();

  if (params.q) {
    return {
      title: `Search: ${params.q}`,
      // Search-result pages are near-infinite and thin; indexing them wastes
      // crawl budget and risks a "thin content" penalty.
      robots: { index: false, follow: true },
    };
  }

  const filtered = Boolean(
    params.category || params.brand || params.minPrice || params.maxPrice || params.inStock
  );

  return {
    title: "Shop all products",
    description: `Browse the full ${storeName} collection — new arrivals, best sellers and current offers.`,
    // Every faceted variant points back at the clean listing, so ranking
    // signals consolidate on one URL instead of splitting across thousands.
    alternates: { canonical: canonicalUrl("/products") },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const sortBy = (params.sort as never) || "featured";

  const [categories, result] = await Promise.all([
    CategoryService.getCategories(true),
    ProductService.getProducts({
      categorySlug: params.category,
      searchQuery: params.q,
      minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      brand: params.brand,
      inStockOnly: params.inStock === "true",
      sortBy,
      page,
      limit: 12,
    }),
  ]);

  // Facet values come from the catalog itself, so a store selling anything at
  // all gets sensible filters without configuration.
  const facetSource = await ProductService.getProducts({ limit: 500 });
  const priceBands = derivePriceBands(facetSource.items.map((product) => product.price));
  const brands = [
    ...new Set(
      facetSource.items
        .map((product) => product.brand)
        .filter((brand): brand is string => Boolean(brand && brand.trim()))
    ),
  ].sort();

  const heading = params.q ? `Results for “${params.q}”` : "All products";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
          ]),
          itemListJsonLd(result.items, heading),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex items-center gap-1 text-xs text-brand-muted-ink">
          <li>
            <Link href="/" className="transition-colors hover:text-brand-ink">
              Home
            </Link>
          </li>
          <ChevronRight className="h-3 w-3 text-brand-faint-ink" aria-hidden="true" />
          <li className="font-semibold text-brand-ink">Products</li>
        </ol>
      </nav>

      <header className="mb-8 border-b border-brand-border pb-6">
        <h1 className="font-heading text-2xl font-bold text-brand-ink sm:text-4xl">{heading}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-brand-muted-ink">
          {params.q
            ? `${result.total} ${result.total === 1 ? "match" : "matches"} found.`
            : "Browse the full range. Filter by category, price or brand to narrow it down."}
        </p>
      </header>

      <CatalogListing
        products={result.items}
        total={result.total}
        totalPages={result.totalPages}
        categories={categories}
        basePath="/products"
        priceBands={priceBands}
        brands={brands}
        filters={{
          category: params.category,
          q: params.q,
          minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
          maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
          brand: params.brand,
          inStock: params.inStock === "true",
          sort: params.sort,
          page,
        }}
      />
    </div>
  );
}
