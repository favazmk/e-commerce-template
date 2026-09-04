import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { EmptyState } from "@/components/ui/empty-state";
import { RecommendationService } from "@/services/recommendation.service";
import { formatPrice } from "@/lib/config/store.config";
import type { Category, Product } from "@/types/database";

export interface CatalogFilters {
  category?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  inStock?: boolean;
  sort?: string;
  page: number;
}

export interface CatalogListingProps {
  products: Product[];
  total: number;
  totalPages: number;
  categories: Category[];
  filters: CatalogFilters;
  /** Base path filter links are built on — "/products" or "/categories/<slug>". */
  basePath: string;
  /** Price bands, derived from the live catalog rather than hard-coded. */
  priceBands: { label: string; min?: number; max?: number }[];
  brands: string[];
}

const SORT_OPTIONS = [
  { label: "Recommended", value: "featured" },
  { label: "What's new", value: "newest" },
  { label: "Price: low to high", value: "price_asc" },
  { label: "Price: high to low", value: "price_desc" },
  { label: "Name A–Z", value: "name_asc" },
];

/**
 * Shared catalog grid used by /products and every category page.
 *
 * Filter state lives entirely in the URL. That is deliberate: a filtered view
 * is then linkable, shareable, back-buttonable and — with the right canonical —
 * crawlable, none of which is true of filters held in React state.
 */
export async function CatalogListing({
  products,
  total,
  totalPages,
  categories,
  filters,
  basePath,
  priceBands,
  brands,
}: CatalogListingProps) {
  const withStats = await RecommendationService.withStats(products);

  /**
   * Build a URL that changes some filters and keeps the rest.
   *
   * `page: null` means "back to page 1": changing a filter must reset paging,
   * or a shopper on page 4 lands on an empty page 4 of a narrower result set.
   */
  const buildHref = (
    // `page` is widened rather than intersected: an intersection would narrow
    // it back to `number | undefined` and reject the null sentinel.
    overrides: Omit<Partial<CatalogFilters>, "page"> & { page?: number | null }
  ) => {
    const params = new URLSearchParams();
    const page = overrides.page === null ? 1 : (overrides.page ?? filters.page);
    const merged = { ...filters, ...overrides, page };

    if (merged.q) params.set("q", merged.q);
    // On a category page the category is in the path, not the query string.
    if (merged.category && basePath === "/products") params.set("category", merged.category);
    if (merged.minPrice != null) params.set("minPrice", String(merged.minPrice));
    if (merged.maxPrice != null) params.set("maxPrice", String(merged.maxPrice));
    if (merged.brand) params.set("brand", merged.brand);
    if (merged.inStock) params.set("inStock", "true");
    if (merged.sort && merged.sort !== "featured") params.set("sort", merged.sort);
    if (merged.page && merged.page > 1) params.set("page", String(merged.page));

    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const hasActiveFilters = Boolean(
    filters.minPrice != null || filters.maxPrice != null || filters.brand || filters.inStock
  );

  const priceBandActive = (band: { min?: number; max?: number }) =>
    filters.minPrice === band.min && filters.maxPrice === band.max;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-10">
      {/* Filters. A <details> element gives a working accordion on phones with
          no JavaScript, so the filter panel is usable before hydration. */}
      <aside className="lg:col-span-1">
        <details className="group rounded-brand-xl border border-brand-border bg-white lg:open" open>
          <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-bold text-brand-ink lg:hidden">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {hasActiveFilters && (
                <span className="rounded-full bg-brand-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                  on
                </span>
              )}
            </span>
            <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
          </summary>

          <div className="space-y-6 border-t border-brand-border p-4 lg:border-t-0 lg:p-0">
            {hasActiveFilters && (
              <Link
                href={basePath}
                className="inline-block text-xs font-bold text-rose-600 hover:underline"
              >
                Clear all filters
              </Link>
            )}

            {categories.length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-ink">
                  Category
                </h2>
                <ul className="space-y-1.5 text-sm">
                  <li>
                    <Link
                      href="/products"
                      className={`block py-1 transition-colors ${
                        !filters.category
                          ? "font-bold text-brand-primary"
                          : "text-brand-muted-ink hover:text-brand-ink"
                      }`}
                    >
                      All products
                    </Link>
                  </li>
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/categories/${category.slug}`}
                        className={`block py-1 transition-colors ${
                          filters.category === category.slug
                            ? "font-bold text-brand-primary"
                            : "text-brand-muted-ink hover:text-brand-ink"
                        }`}
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {priceBands.length > 0 && (
              <div className="border-t border-brand-border pt-5">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-ink">
                  Price
                </h2>
                <ul className="space-y-1.5 text-sm">
                  {priceBands.map((band) => (
                    <li key={band.label}>
                      <Link
                        href={buildHref({
                          minPrice: priceBandActive(band) ? undefined : band.min,
                          maxPrice: priceBandActive(band) ? undefined : band.max,
                          page: null,
                        })}
                        className={`block py-1 transition-colors ${
                          priceBandActive(band)
                            ? "font-bold text-brand-primary"
                            : "text-brand-muted-ink hover:text-brand-ink"
                        }`}
                      >
                        {band.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {brands.length > 1 && (
              <div className="border-t border-brand-border pt-5">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-ink">
                  Brand
                </h2>
                <ul className="max-h-56 space-y-1.5 overflow-y-auto text-sm">
                  {brands.map((brand) => (
                    <li key={brand}>
                      <Link
                        href={buildHref({
                          brand: filters.brand === brand ? undefined : brand,
                          page: null,
                        })}
                        className={`block py-1 transition-colors ${
                          filters.brand === brand
                            ? "font-bold text-brand-primary"
                            : "text-brand-muted-ink hover:text-brand-ink"
                        }`}
                      >
                        {brand}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t border-brand-border pt-5">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-ink">
                Availability
              </h2>
              <Link
                href={buildHref({ inStock: !filters.inStock, page: null })}
                className={`block py-1 text-sm transition-colors ${
                  filters.inStock
                    ? "font-bold text-brand-primary"
                    : "text-brand-muted-ink hover:text-brand-ink"
                }`}
              >
                {filters.inStock ? "✓ In stock only" : "In stock only"}
              </Link>
            </div>
          </div>
        </details>
      </aside>

      {/* Results */}
      <div className="lg:col-span-3">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-brand-border pb-4">
          <p className="text-xs font-medium text-brand-muted-ink">
            <span className="font-bold text-brand-ink">{total}</span>{" "}
            {total === 1 ? "product" : "products"}
          </p>

          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-brand-faint-ink">
              Sort
            </span>
            {SORT_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={buildHref({ sort: option.value, page: null })}
                className={`flex-shrink-0 whitespace-nowrap rounded-brand-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  (filters.sort || "featured") === option.value
                    ? "border-brand-ink bg-brand-ink text-white"
                    : "border-brand-border text-brand-muted-ink hover:border-brand-ink"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        {withStats.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Nothing matches those filters"
            description="Try widening the price range or clearing a filter to see more."
            actionText="Clear filters"
            actionHref={basePath}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {withStats.map(({ product, stats }, index) => (
              <ProductCard
                key={product.id}
                product={product}
                stats={stats}
                // The first row is above the fold; marking it priority is what
                // fixes the Largest Contentful Paint on a catalog page.
                priority={index < 3}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            page={filters.page}
            totalPages={totalPages}
            buildHref={(page) => buildHref({ page })}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Windowed pagination.
 *
 * Rendering one link per page breaks down at scale — a 400-product catalog
 * would emit 34 links, and a large one hundreds, which is both unusable and a
 * crawl-budget problem.
 */
function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  const window = 2;
  const pages: (number | "gap")[] = [];

  for (let index = 1; index <= totalPages; index++) {
    const nearCurrent = Math.abs(index - page) <= window;
    const isEdge = index === 1 || index === totalPages;

    if (nearCurrent || isEdge) {
      pages.push(index);
    } else if (pages[pages.length - 1] !== "gap") {
      pages.push("gap");
    }
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex items-center justify-center gap-1.5 border-t border-brand-border pt-8"
    >
      {page > 1 && (
        <Link
          href={buildHref(page - 1)}
          rel="prev"
          aria-label="Previous page"
          className="flex h-9 w-9 items-center justify-center rounded-brand bg-brand-subtle text-brand-muted-ink transition-colors hover:bg-brand-border"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}

      {pages.map((entry, index) =>
        entry === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-brand-faint-ink">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={buildHref(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-brand px-2 text-sm font-semibold transition-colors ${
              entry === page
                ? "bg-brand-primary text-white"
                : "bg-brand-subtle text-brand-muted-ink hover:bg-brand-border"
            }`}
          >
            {entry}
          </Link>
        )
      )}

      {page < totalPages && (
        <Link
          href={buildHref(page + 1)}
          rel="next"
          aria-label="Next page"
          className="flex h-9 w-9 items-center justify-center rounded-brand bg-brand-subtle text-brand-muted-ink transition-colors hover:bg-brand-border"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}

/**
 * Price bands derived from the catalog's own range.
 *
 * Hard-coded bands ("Under $200") are wrong for most stores and wrong in every
 * currency but one. Quartiles of the real price range always make sense.
 */
export function derivePriceBands(prices: number[]): { label: string; min?: number; max?: number }[] {
  const valid = prices.filter((price) => Number.isFinite(price) && price > 0).sort((a, b) => a - b);
  if (valid.length < 4) return [];

  const lowest = valid[0];
  const highest = valid[valid.length - 1];
  if (highest - lowest < 1) return [];

  const step = (highest - lowest) / 3;
  const first = Math.round((lowest + step) / 10) * 10;
  const second = Math.round((lowest + step * 2) / 10) * 10;

  if (first >= second) return [];

  return [
    { label: `Under ${formatPrice(first)}`, max: first },
    { label: `${formatPrice(first)} – ${formatPrice(second)}`, min: first, max: second },
    { label: `${formatPrice(second)} and above`, min: second },
  ];
}
