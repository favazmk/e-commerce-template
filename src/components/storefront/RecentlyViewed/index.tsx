"use client";

import React, { useEffect, useState } from "react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { useRecentlyViewed } from "@/features/recently-viewed/useRecentlyViewed";
import type { Product } from "@/types/database";

export interface RecentlyViewedProps {
  /** Product ids to leave out — usually the one currently on screen. */
  excludeIds?: string[];
  title?: string;
  limit?: number;
}

/**
 * "Recently viewed" strip.
 *
 * Renders nothing until it has real products, so a first-time visitor sees no
 * empty heading and no layout shift. The ids come from localStorage; the
 * products are hydrated through a rate-limited lookup endpoint that returns
 * active items only.
 */
export function RecentlyViewed({
  excludeIds = [],
  title = "Recently viewed",
  limit = 6,
}: RecentlyViewedProps) {
  const { productIds, clear } = useRecentlyViewed();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const wanted = productIds.filter((id) => !excludeIds.includes(id)).slice(0, limit);

    if (wanted.length === 0) {
      setProducts([]);
      return;
    }

    // Aborted on unmount so a slow response cannot set state on a dead component.
    const controller = new AbortController();

    fetch("/api/products/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: wanted }),
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.success) setProducts(payload.data);
      })
      .catch(() => {
        /* A failed strip is not worth an error message to the shopper. */
      });

    return () => controller.abort();
    // `excludeIds` is a fresh array on every render; joining it keeps the
    // effect from re-firing on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIds.join(","), excludeIds.join(","), limit]);

  if (products.length === 0) return null;

  return (
    <section className="py-8 sm:py-10" aria-label={title}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="font-heading text-lg font-bold text-brand-ink sm:text-xl">{title}</h2>
        <button
          type="button"
          onClick={clear}
          className="flex-shrink-0 text-xs font-semibold text-brand-faint-ink hover:text-brand-ink hover:underline"
        >
          Clear history
        </button>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        <ul className="flex gap-3 sm:gap-4 lg:grid lg:grid-cols-6">
          {products.map((product) => (
            <li
              key={product.id}
              className="w-[42%] max-w-[220px] flex-shrink-0 sm:w-[30%] md:w-[22%] lg:w-auto lg:max-w-none"
            >
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
