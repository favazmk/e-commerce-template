"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/features/cart/CartContext";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/storefront/ProductImage";
import { formatPrice } from "@/lib/config/store.config";
import { priceBreakdown } from "@/lib/commerce/merchandising";
import { toAnalyticsItem } from "@/services/analytics.service";
import type { Product } from "@/types/database";

export interface FrequentlyBoughtTogetherProps {
  /** The product whose page this is. Always included and never deselectable. */
  anchor: Product;
  /** Companions, already ranked by the recommendation service. */
  companions: Product[];
}

/**
 * "Frequently bought together" bundle.
 *
 * Two things make this work as a merchandising unit rather than decoration:
 * the anchor product is pre-ticked so the default action is "add everything",
 * and the total updates live, which converts an abstract list into one
 * decision. The suggestions come from real co-purchase history or an explicit
 * merchant pairing — see RecommendationService.
 *
 * The prices shown here come from server-rendered product rows. They are for
 * display only: the cart recalculates every line server-side on add, so a
 * stale or tampered price on this screen cannot reach an order.
 */
export function FrequentlyBoughtTogether({ anchor, companions }: FrequentlyBoughtTogetherProps) {
  const { addItem, openMiniCart } = useCart();

  const available = useMemo(
    () => companions.filter((product) => product.stock_quantity > 0).slice(0, 3),
    [companions]
  );

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(available.map((product) => product.id))
  );
  const [added, setAdded] = useState(false);

  if (available.length === 0) return null;

  const bundle = [anchor, ...available];
  const chosen = bundle.filter((product) => product.id === anchor.id || selected.has(product.id));

  const total = chosen.reduce((sum, product) => sum + Number(product.price), 0);
  const listTotal = chosen.reduce(
    (sum, product) => sum + Number(product.compare_at_price ?? product.price),
    0
  );
  const savings = Math.max(0, listTotal - total);

  const toggle = (productId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleAddAll = () => {
    for (const product of chosen) {
      const variant = product.variants?.[0] || null;
      addItem(product.id, variant?.id || null, 1, toAnalyticsItem(product, 1, variant));
    }
    setAdded(true);
    openMiniCart();
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <section
      className="rounded-brand-xl border border-brand-border bg-white p-5 shadow-subtle sm:p-6"
      aria-label="Frequently bought together"
    >
      <h2 className="font-heading text-base font-bold text-brand-ink sm:text-lg">
        Frequently bought together
      </h2>

      {/* Visual bundle: thumbnails joined by plus signs, so the pairing reads
          before any text is processed. */}
      <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
        {bundle.map((product, index) => {
          const isAnchor = product.id === anchor.id;
          const isChosen = isAnchor || selected.has(product.id);

          return (
            <React.Fragment key={product.id}>
              {index > 0 && (
                <Plus className="h-4 w-4 flex-shrink-0 text-brand-faint-ink" aria-hidden="true" />
              )}
              <Link
                href={`/products/${product.slug}`}
                className={`relative block h-20 w-20 overflow-hidden rounded-brand border-2 bg-brand-subtle transition-opacity sm:h-24 sm:w-24 ${
                  isChosen ? "border-brand-primary" : "border-brand-border opacity-40"
                }`}
                title={product.name}
              >
                <ProductImage
                  src={product.images?.[0]?.url}
                  seed={product.name}
                  alt={product.name}
                  sizes="96px"
                  compact
                  className="object-cover"
                />
              </Link>
            </React.Fragment>
          );
        })}
      </div>

      {/* Line items with checkboxes */}
      <ul className="mt-5 space-y-3">
        {bundle.map((product) => {
          const isAnchor = product.id === anchor.id;
          const pricing = priceBreakdown(product.price, product.compare_at_price);

          return (
            <li key={product.id} className="flex items-start gap-3">
              <input
                type="checkbox"
                id={`fbt-${product.id}`}
                checked={isAnchor || selected.has(product.id)}
                onChange={() => !isAnchor && toggle(product.id)}
                disabled={isAnchor}
                className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-brand-border-strong text-brand-primary focus:ring-brand-primary disabled:opacity-60"
              />
              <label htmlFor={`fbt-${product.id}`} className="min-w-0 flex-1 cursor-pointer">
                <span className="block text-sm font-medium leading-snug text-brand-ink">
                  {isAnchor && (
                    <span className="mr-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                      This item
                    </span>
                  )}
                  {product.name}
                </span>
                <span className="mt-0.5 flex items-baseline gap-2">
                  <span className="text-sm font-bold text-brand-ink">
                    {formatPrice(product.price)}
                  </span>
                  {pricing.hasDiscount && (
                    <span className="text-xs text-brand-faint-ink line-through">
                      {formatPrice(pricing.compareAtPrice!)}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {/* Total and CTA */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-brand-border pt-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-faint-ink">
            Total for {chosen.length} item{chosen.length === 1 ? "" : "s"}
          </p>
          <p className="font-heading text-xl font-bold text-brand-ink">{formatPrice(total)}</p>
          {savings > 0 && (
            <p className="text-xs font-semibold text-brand-primary">
              You save {formatPrice(savings)}
            </p>
          )}
        </div>

        <Button onClick={handleAddAll} size="lg" className="flex-1 sm:flex-none">
          {added ? (
            <>
              <Check className="h-4 w-4" /> Added to bag
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" /> Add {chosen.length} to bag
            </>
          )}
        </Button>
      </div>
    </section>
  );
}
