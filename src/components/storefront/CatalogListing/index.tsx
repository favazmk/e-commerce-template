import React from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
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
 * One filter row.
 *
 * Rendered with a visible box rather than as a bare text link, for two reasons.
 * The control communicates "this toggles" before the label is read — a column
 * of plain links reads as navigation, not as filters. And the previous active
 * state was `font-bold text-brand-primary`, which on a monochrome brand is the
 * same colour as the inactive text: weight was carrying the entire signal.
 * A filled box survives any palette.
 *
 * `aria-current` carries the state programmatically, which weight alone never
 * did for a screen reader.
 */
function FilterOption({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "true" : undefined}
        className={`group flex items-center gap-2.5 py-1.5 text-sm transition-colors ${
          active ? "font-semibold text-brand-ink" : "text-brand-muted-ink hover:text-brand-ink"
        }`}
      >
        <span
          aria-hidden="true"
          className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-brand-sm border transition-colors ${
            active
              ? "border-brand-ink bg-brand-ink"
              : "border-brand-border-strong group-hover:border-brand-ink"
          }`}
        >
          {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </span>
        {label}
      </Link>
    </li>
  );
}

/** A titled block in the filter rail. Hairline separated, not boxed. */
function FilterGroup({
  title,
  children,
  first = false,
}: {
  title: string;
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <div className={first ? "" : "border-t border-brand-border pt-4"}>
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-ink">
        {title}
      </h2>
      <ul>{children}</ul>
    </div>
  );
}

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

  /**
   * What is currently narrowing the results, and how to undo each one.
   *
   * Rendered as removable chips. Without this a shopper can see that fewer
   * products are showing but not what caused it, and can only reset everything
   * at once — the difference between "drop the price band" and "start over".
   *
   * Category removal goes to /products rather than through buildHref, because
   * on a category page the category lives in the path, not the query string.
   */
  const appliedFilters: { label: string; removeHref: string }[] = [];

  if (filters.category) {
    const name =
      categories.find((c) => c.slug === filters.category)?.name ?? filters.category;
    appliedFilters.push({ label: name, removeHref: "/products" });
  }

  const activeBand = priceBands.find((band) => priceBandActive(band));
  if (activeBand) {
    appliedFilters.push({
      label: activeBand.label,
      removeHref: buildHref({ minPrice: undefined, maxPrice: undefined, page: null }),
    });
  }

  if (filters.brand) {
    appliedFilters.push({
      label: filters.brand,
      removeHref: buildHref({ brand: undefined, page: null }),
    });
  }

  if (filters.inStock) {
    appliedFilters.push({
      label: "In stock only",
      removeHref: buildHref({ inStock: false, page: null }),
    });
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-10">
      {/* Filters. A <details> element gives a working accordion on phones with
          no JavaScript, so the filter panel is usable before hydration. */}
      <aside className="lg:col-span-1">
        {/* Boxed on phones, where it is a collapsible panel that needs an edge.
            Borderless on desktop: a card around a permanently-open sidebar adds
            a frame the eye has to cross for no information, which is a large
            part of why the rail read as a generic widget. */}
        <details
          className="group rounded-brand-xl border border-brand-border bg-white lg:open lg:rounded-none lg:border-0 lg:bg-transparent"
          open
        >
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

          <div className="space-y-4 border-t border-brand-border p-4 lg:border-t-0 lg:p-0">
            {/* Applied filters, each individually removable.
                Previously the only affordance was a red "Clear all filters"
                link, which forced an all-or-nothing reset and gave no summary
                of what was actually applied. */}
            {appliedFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                {appliedFilters.map((applied) => (
                  <Link
                    key={applied.label}
                    href={applied.removeHref}
                    className="inline-flex items-center gap-1.5 rounded-brand border border-brand-ink bg-brand-ink px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-80"
                  >
                    {applied.label}
                    <X className="h-3 w-3" aria-hidden="true" />
                    <span className="sr-only">Remove filter</span>
                  </Link>
                ))}
                {appliedFilters.length > 1 && (
                  <Link
                    href={filters.category ? "/products" : basePath}
                    className="px-1 text-[11px] font-semibold text-brand-muted-ink underline underline-offset-2 hover:text-brand-ink"
                  >
                    Clear all
                  </Link>
                )}
              </div>
            )}

            {categories.length > 0 && (
              <FilterGroup title="Category" first={appliedFilters.length === 0}>
                <FilterOption
                  href="/products"
                  active={!filters.category}
                  label="All products"
                />
                {categories.map((category) => (
                  <FilterOption
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    active={filters.category === category.slug}
                    label={category.name}
                  />
                ))}
              </FilterGroup>
            )}

            {priceBands.length > 0 && (
              <FilterGroup title="Price">
                {priceBands.map((band) => (
                  <FilterOption
                    key={band.label}
                    href={buildHref({
                      minPrice: priceBandActive(band) ? undefined : band.min,
                      maxPrice: priceBandActive(band) ? undefined : band.max,
                      page: null,
                    })}
                    active={priceBandActive(band)}
                    label={band.label}
                  />
                ))}
              </FilterGroup>
            )}

            {brands.length > 1 && (
              <FilterGroup title="Brand">
                <div className="max-h-56 overflow-y-auto">
                  {brands.map((brand) => (
                    <FilterOption
                      key={brand}
                      href={buildHref({
                        brand: filters.brand === brand ? undefined : brand,
                        page: null,
                      })}
                      active={filters.brand === brand}
                      label={brand}
                    />
                  ))}
                </div>
              </FilterGroup>
            )}

            <FilterGroup title="Availability">
              <FilterOption
                href={buildHref({ inStock: !filters.inStock, page: null })}
                active={Boolean(filters.inStock)}
                label="In stock only"
              />
            </FilterGroup>
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
