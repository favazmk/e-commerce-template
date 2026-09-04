"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useCart } from "@/features/cart/CartContext";
import { ProductImage } from "@/components/storefront/ProductImage";
import { formatPrice } from "@/lib/config/store.config";
import { priceBreakdown } from "@/lib/commerce/merchandising";
import { toAnalyticsItem } from "@/services/analytics.service";
import type { Product } from "@/types/database";

export interface CartRecommendationsProps {
  /** Product ids already in the bag; never recommend them back. */
  cartProductIds: string[];
  title?: string;
  limit?: number;
}

/**
 * "Complete your order" strip inside the cart.
 *
 * The cart is where average order value is won or lost: the shopper has already
 * decided to buy, so a genuinely complementary item is an easy yes. Adds happen
 * inline — sending someone back to a product page at this point routinely loses
 * the sale that was already in hand.
 */
export function CartRecommendations({
  cartProductIds,
  title = "Complete your order",
  limit = 4,
}: CartRecommendationsProps) {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);

  const key = cartProductIds.join(",");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: cartProductIds, limit }),
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.success) setProducts(payload.data);
      })
      .catch(() => {
        /* Silent: the cart works perfectly well without this strip. */
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, limit]);

  if (products.length === 0) return null;

  const handleAdd = (product: Product) => {
    const variant = product.variants?.[0] || null;
    addItem(product.id, variant?.id || null, 1, toAnalyticsItem(product, 1, variant));
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <section
      className="rounded-brand-xl border border-brand-border bg-white p-5 shadow-subtle"
      aria-label={title}
    >
      <h2 className="font-heading text-base font-bold text-brand-ink">{title}</h2>
      <p className="mt-1 text-xs text-brand-muted-ink">
        Often bought with what is already in your bag.
      </p>

      <ul className="mt-4 divide-y divide-brand-border">
        {products.map((product) => {
          const pricing = priceBreakdown(product.price, product.compare_at_price);
          const justAdded = addedId === product.id;

          return (
            <li key={product.id} className="flex items-center gap-3 py-3">
              <Link
                href={`/products/${product.slug}`}
                className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-brand border border-brand-border bg-brand-subtle"
              >
                <ProductImage
                  src={product.images?.[0]?.url}
                  seed={product.name}
                  alt={product.name}
                  sizes="64px"
                  compact
                  className="object-cover"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-brand-ink">
                  <Link href={`/products/${product.slug}`} className="hover:underline">
                    {product.name}
                  </Link>
                </h3>
                <div className="mt-0.5 flex items-baseline gap-2">
                  <span className="text-sm font-bold text-brand-ink">
                    {formatPrice(product.price)}
                  </span>
                  {pricing.hasDiscount && (
                    <span className="text-xs text-brand-faint-ink line-through">
                      {formatPrice(pricing.compareAtPrice!)}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAdd(product)}
                className={`flex flex-shrink-0 items-center gap-1 rounded-brand border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  justAdded
                    ? "border-brand-success/40 bg-brand-success/10 text-brand-primary"
                    : "border-brand-border-strong text-brand-ink hover:border-brand-ink hover:bg-brand-ink hover:text-white"
                }`}
                aria-label={`Add ${product.name} to bag`}
              >
                {justAdded ? (
                  "Added"
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" /> Add
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
