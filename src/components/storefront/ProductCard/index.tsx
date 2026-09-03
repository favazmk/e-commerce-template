"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/features/cart/CartContext";
import { useWishlist } from "@/features/wishlist/WishlistContext";
import { useStoreFeatures } from "@/features/settings/StoreFeaturesContext";
import { ProductCardVariant } from "@/theme/theme.config";
import { Product } from "@/types/database";
import type { ProductStats } from "@/repositories/interfaces/merchandising.repository.interface";
import { StarRating } from "@/components/ui/star-rating";
import { formatPrice } from "@/lib/config/store.config";
import { priceBreakdown, salesProof, stockSignal } from "@/lib/commerce/merchandising";
import { toAnalyticsItem } from "@/services/analytics.service";
import { ProductImage } from "../ProductImage";

export interface ProductCardProps {
  product: Product;
  variant?: ProductCardVariant;
  /** Real rating and sales figures. Absent means no badges, never fake ones. */
  stats?: ProductStats | null;
  /** Set on the first row of the first grid only, for LCP. */
  priority?: boolean;
}

export function ProductCard({
  product,
  variant = "luxury",
  stats = null,
  priority = false,
}: ProductCardProps) {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { wishlist: wishlistEnabled } = useStoreFeatures();
  const [isHovered, setIsHovered] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const isFavorite = isInWishlist(product.id);
  const primaryImage = product.images?.[0]?.url;
  const hoverImage = product.images?.[1]?.url || primaryImage;

  const pricing = priceBreakdown(product.price, product.compare_at_price);
  const scarcity = stockSignal(product);
  const proof = salesProof(stats);
  const soldOut = product.stock_quantity === 0;

  const handleQuickAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const defaultVariant = product.variants?.[0] || null;
    addItem(product.id, defaultVariant?.id || null, 1, toAnalyticsItem(product, 1, defaultVariant));
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleToggleWishlist = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    toggleWishlist(product);
  };

  // 1. Minimal Variant
  if (variant === "minimal") {
    return (
      <div className="group relative flex flex-col">
        <Link
          href={`/products/${product.slug}`}
          className="relative block aspect-[3/4] w-full overflow-hidden rounded-brand bg-slate-50"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <ProductImage
            src={isHovered ? hoverImage : primaryImage}
            seed={product.name}
            alt={product.name}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="mt-3 flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-slate-900 hover:underline">
              <Link href={`/products/${product.slug}`}>{product.name}</Link>
            </h3>
            <p className="mt-0.5 truncate text-xs text-slate-500">{product.brand}</p>
          </div>
          <p className="ml-3 flex-shrink-0 text-sm font-semibold text-slate-900">
            {formatPrice(product.price)}
          </p>
        </div>
      </div>
    );
  }

  // 2. Compact Variant — used in rails and recommendation strips
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-4 rounded-brand border border-slate-100 bg-white p-3 shadow-subtle transition-colors hover:border-slate-300">
        <Link
          href={`/products/${product.slug}`}
          className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-brand bg-slate-100"
        >
          <ProductImage
            src={primaryImage}
            seed={product.name}
            alt={product.name}
            sizes="80px"
            compact
            className="object-cover"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-slate-900">
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h4>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-xs font-bold text-slate-900">{formatPrice(product.price)}</span>
            {pricing.hasDiscount && (
              <span className="text-[11px] text-slate-400 line-through">
                {formatPrice(pricing.compareAtPrice!)}
              </span>
            )}
          </div>
          <button
            onClick={handleQuickAdd}
            disabled={soldOut}
            className="mt-2 flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline disabled:text-slate-400 disabled:no-underline"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> {soldOut ? "Sold out" : "Quick add"}
          </button>
        </div>
      </div>
    );
  }

  // 3. Luxury / Modern Default Variant
  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-brand-lg border border-slate-100/80 bg-white shadow-subtle transition-all duration-300 hover:-translate-y-1 hover:shadow-float"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-50">
        <Link href={`/products/${product.slug}`} className="block h-full w-full">
          <ProductImage
            src={isHovered ? hoverImage : primaryImage}
            seed={product.name}
            alt={product.name}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>

        {/* One badge column, ranked by what a shopper acts on: a discount beats
            an editorial "featured" flag, and sold-out overrides everything. */}
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5 sm:left-3 sm:top-3">
          {soldOut ? (
            <span className="rounded-brand-sm bg-slate-900/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              Sold out
            </span>
          ) : (
            <>
              {pricing.hasDiscount && pricing.discountPercent >= 5 && (
                <span className="rounded-brand-sm bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                  {pricing.discountPercent}% off
                </span>
              )}
              {scarcity && (
                <span
                  className={`rounded-brand-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                    scarcity.tone === "danger"
                      ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                  }`}
                >
                  {scarcity.message}
                </span>
              )}
              {product.featured && !pricing.hasDiscount && !scarcity && (
                <span className="rounded-brand-sm bg-slate-900/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  Featured
                </span>
              )}
            </>
          )}
        </div>

        {wishlistEnabled && (
          <button
            onClick={handleToggleWishlist}
            className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:bg-white hover:text-rose-500 sm:right-3 sm:top-3 sm:h-9 sm:w-9"
            aria-label={
              isFavorite
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
            aria-pressed={isFavorite}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
        )}

        {/* Quick add. Always visible on touch devices — a hover-only control is
            unreachable on a phone, which is where most of the traffic is. */}
        <div className="absolute inset-x-2.5 bottom-2.5 z-10 transition-all duration-300 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 sm:inset-x-3 sm:bottom-3 [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0">
          <button
            onClick={handleQuickAdd}
            disabled={soldOut}
            className="flex w-full items-center justify-center gap-2 rounded-brand bg-slate-900/95 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white shadow-elevated backdrop-blur-sm transition-all hover:bg-brand-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-400 sm:py-3 sm:text-xs"
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" /> Added to bag
              </>
            ) : soldOut ? (
              "Sold out"
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> Quick add
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content — brand first, then name, the hierarchy shoppers scan by */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.brand && (
          <div className="mb-1 truncate text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 sm:text-[11px]">
            {product.brand}
          </div>
        )}

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-brand-primary">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>

        {stats && stats.review_count > 0 && (
          <div className="mt-2">
            <StarRating
              rating={stats.average_rating}
              count={stats.review_count}
              size="xs"
              variant="pill"
            />
          </div>
        )}

        {/* Price row: the discounted figure leads, the strike-through anchors it,
            and the saving is stated in money because a percentage alone is
            abstract at the moment of decision. */}
        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-base font-bold text-slate-900">
              {formatPrice(product.price)}
            </span>
            {pricing.hasDiscount && (
              <>
                <span className="text-xs text-slate-400 line-through">
                  {formatPrice(pricing.compareAtPrice!)}
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  Save {formatPrice(pricing.savings)}
                </span>
              </>
            )}
          </div>

          <div className="mt-1.5 flex min-h-[1rem] items-center justify-between gap-2">
            {proof ? (
              <span className="truncate text-[11px] font-medium text-slate-500">{proof}</span>
            ) : (
              <span />
            )}
            {product.variants && product.variants.length > 1 && (
              <span className="flex-shrink-0 text-[11px] font-medium text-slate-400">
                {product.variants.length} options
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
