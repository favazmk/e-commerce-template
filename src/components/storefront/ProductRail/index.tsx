import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { RecommendationService } from "@/services/recommendation.service";
import type { Product } from "@/types/database";

export interface ProductRailProps {
  title: string;
  subtitle?: string;
  products: Product[];
  /** Optional "see all" destination. */
  href?: string;
  hrefLabel?: string;
  /**
   * Horizontal scroller (default) or a wrapping grid. A scroller keeps a
   * recommendation strip from pushing the rest of the page below the fold.
   */
  layout?: "scroll" | "grid";
  className?: string;
}

/**
 * A titled strip of products.
 *
 * Server component: it fetches the social-proof aggregates itself in one round
 * trip, so every caller gets ratings and sales counts without each page having
 * to remember to ask for them.
 */
export async function ProductRail({
  title,
  subtitle,
  products,
  href,
  hrefLabel = "View all",
  layout = "scroll",
  className = "",
}: ProductRailProps) {
  if (!products || products.length === 0) return null;

  const withStats = await RecommendationService.withStats(products);

  return (
    <section className={`py-8 sm:py-10 ${className}`} aria-label={title}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold text-brand-ink sm:text-xl">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-brand-muted-ink sm:text-sm">{subtitle}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="flex flex-shrink-0 items-center gap-1 text-xs font-bold text-brand-primary hover:underline"
          >
            {hrefLabel} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {layout === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {withStats.map(({ product, stats }) => (
            <ProductCard key={product.id} product={product} stats={stats} />
          ))}
        </div>
      ) : (
        // Negative margins let the strip bleed to the screen edge on phones,
        // which is the visual cue that it scrolls.
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <ul className="flex gap-3 sm:gap-4 lg:grid lg:grid-cols-4">
            {withStats.map(({ product, stats }) => (
              <li
                key={product.id}
                className="w-[48%] max-w-[260px] flex-shrink-0 sm:w-[38%] md:w-[30%] lg:w-auto lg:max-w-none"
              >
                <ProductCard product={product} stats={stats} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
