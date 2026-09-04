"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Heart, ShoppingBag, Star } from "lucide-react";
import { useCart } from "@/features/cart/CartContext";
import { useWishlist } from "@/features/wishlist/WishlistContext";
import { useStoreFeatures } from "@/features/settings/StoreFeaturesContext";
import { ProductCardVariant } from "@/theme/theme.config";
import { Product } from "@/types/database";
import type { ProductStats } from "@/repositories/interfaces/merchandising.repository.interface";
import { formatPrice } from "@/lib/config/store.config";
import {
  BADGE_TONE_CLASSES,
  colourSwatches,
  priceBreakdown,
  resolveBadge,
  salesProof,
  sizeOptions,
  stockSignal,
} from "@/lib/commerce/merchandising";
import { toAnalyticsItem } from "@/services/analytics.service";
import { ProductImage } from "../ProductImage";
import { ColourPicker, SizePicker } from "./VariantPicker";

export interface ProductCardProps {
  product: Product;
  variant?: ProductCardVariant;
  /** Real rating and sales figures. Absent means no badges, never fake ones. */
  stats?: ProductStats | null;
  /** Set on the first row of the first grid only, for LCP. */
  priority?: boolean;
}

/**
 * Product card.
 *
 * Laid out the way high-volume fashion marketplaces lay one out, because those
 * conventions are what shoppers have been trained to read:
 *
 * - The rating chip sits ON the image, bottom-left. It is the first trust
 *   signal scanned, and putting it there costs no vertical space in a grid.
 * - Brand is bold and above the product name, which is grey and truncated to
 *   one line. Shoppers scan brands first and read names second.
 * - Price order is: what you pay (bold), what it was (struck through), how much
 *   off (orange). The percentage is last because it is the least concrete.
 * - Size and colour are selectable in the grid, so "does it come in my size?"
 *   is answered without a round trip to the product page.
 */
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

  const activeVariants = useMemo(
    () => (product.variants || []).filter((entry) => entry.is_active),
    [product.variants]
  );

  // Preselect the variant the merchant marked as default, else the first that
  // is actually purchasable — never an out-of-stock one.
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
    const preferred =
      activeVariants.find((entry) => entry.is_default && entry.stock > 0) ||
      activeVariants.find((entry) => entry.stock > 0) ||
      activeVariants[0];
    return preferred?.id ?? null;
  });

  const selectedVariant = activeVariants.find((entry) => entry.id === selectedVariantId) || null;

  const sizes = useMemo(() => sizeOptions(activeVariants), [activeVariants]);
  const colours = useMemo(() => colourSwatches(activeVariants), [activeVariants]);

  const price = selectedVariant?.price ?? product.price;
  const compareAt = selectedVariant?.compare_at_price ?? product.compare_at_price;
  const pricing = priceBreakdown(price, compareAt);

  const badge = resolveBadge(product, stats);
  const scarcity = stockSignal(product);
  const proof = salesProof(stats);
  const soldOut = product.stock_quantity === 0;

  const isFavorite = isInWishlist(product.id);
  // The selected colour's own photograph wins, so changing colour changes the
  // picture — otherwise a swatch picker is decorative.
  const primaryImage = selectedVariant?.image_url || product.images?.[0]?.url;
  const hoverImage = product.images?.[1]?.url || primaryImage;

  const handleQuickAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    addItem(
      product.id,
      selectedVariant?.id || null,
      1,
      toAnalyticsItem(product, 1, selectedVariant)
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleToggleWishlist = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    toggleWishlist(product);
  };

  /* --- Minimal ---------------------------------------------------------- */
  if (variant === "minimal") {
    return (
      <div className="group relative flex flex-col">
        <Link
          href={`/products/${product.slug}`}
          className="relative block aspect-[3/4] w-full overflow-hidden rounded-brand bg-brand-subtle"
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
        <div className="mt-2.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-brand-ink">
              <Link href={`/products/${product.slug}`}>{product.brand || product.name}</Link>
            </h3>
            <p className="mt-0.5 truncate text-xs text-brand-muted-ink">{product.name}</p>
          </div>
          <p className="flex-shrink-0 text-sm font-bold text-brand-ink">{formatPrice(price)}</p>
        </div>
      </div>
    );
  }

  /* --- Compact (rails, mini-cart) --------------------------------------- */
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 rounded-brand border border-brand-border bg-white p-2.5 transition-colors hover:border-brand-border-strong">
        <Link
          href={`/products/${product.slug}`}
          className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-brand bg-brand-subtle"
        >
          <ProductImage
            src={primaryImage}
            seed={product.name}
            alt={product.name}
            sizes="64px"
            compact
            className="object-cover"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-xs font-bold text-brand-ink">
            <Link href={`/products/${product.slug}`}>{product.brand || product.name}</Link>
          </h4>
          <p className="truncate text-xs text-brand-muted-ink">{product.name}</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xs font-bold text-brand-ink">{formatPrice(price)}</span>
            {pricing.hasDiscount && (
              <span className="text-[11px] text-brand-faint-ink line-through">
                {formatPrice(pricing.compareAtPrice!)}
              </span>
            )}
          </div>
          <button
            onClick={handleQuickAdd}
            disabled={soldOut}
            className="mt-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-brand-primary hover:underline disabled:text-brand-faint-ink disabled:no-underline"
          >
            <ShoppingBag className="h-3 w-3" /> {soldOut ? "Sold out" : "Add"}
          </button>
        </div>
      </div>
    );
  }

  /* --- Default grid card ------------------------------------------------ */
  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-brand border border-brand-border bg-white transition-all duration-200 hover:shadow-float"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-brand-subtle">
        <Link href={`/products/${product.slug}`} className="block h-full w-full">
          <ProductImage
            src={isHovered ? hoverImage : primaryImage}
            seed={product.name}
            alt={product.name}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        </Link>

        {/* One badge, top-left. Sold out overrides everything. */}
        <div className="absolute left-0 top-2.5 z-10">
          {soldOut ? (
            <span className="rounded-r-brand-sm bg-brand-ink/90 px-2 py-1 text-2xs font-bold uppercase tracking-wider text-white">
              Sold out
            </span>
          ) : (
            badge && (
              <span
                className={`rounded-r-brand-sm px-2 py-1 text-2xs font-bold uppercase tracking-wider ${BADGE_TONE_CLASSES[badge.tone]}`}
              >
                {badge.label}
              </span>
            )
          )}
        </div>

        {/* Rating chip on the image, bottom-left — the first trust signal
            scanned, and it costs no vertical space in the grid. */}
        {stats && stats.review_count > 0 && (
          <span className="rating-chip absolute bottom-2.5 left-2.5 z-10">
            {stats.average_rating.toFixed(1)}
            <Star className="h-3 w-3 fill-brand-rating text-brand-rating" aria-hidden="true" />
            <span className="font-normal text-brand-faint-ink">
              | {stats.review_count > 999 ? `${(stats.review_count / 1000).toFixed(1)}k` : stats.review_count}
            </span>
          </span>
        )}

        {wishlistEnabled && (
          <button
            onClick={handleToggleWishlist}
            className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-muted-ink shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-brand-primary"
            aria-label={
              isFavorite
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
            aria-pressed={isFavorite}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-brand-primary text-brand-primary" : ""}`} />
          </button>
        )}

        {/* Quick add. Always visible on touch devices — a hover-only control is
            unreachable on a phone, which is where most traffic is. */}
        <div className="absolute inset-x-0 bottom-0 z-10 translate-y-0 transition-transform duration-200 [@media(hover:hover)]:translate-y-full [@media(hover:hover)]:group-hover:translate-y-0">
          <button
            onClick={handleQuickAdd}
            disabled={soldOut}
            className="flex w-full items-center justify-center gap-1.5 bg-brand-ink/95 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-colors hover:bg-brand-primary disabled:bg-brand-faint-ink"
          >
            {isAdded ? (
              <>
                <Check className="h-3.5 w-3.5" /> Added
              </>
            ) : soldOut ? (
              "Sold out"
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" /> Add to bag
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5 sm:p-3">
        {/* Brand bold, name grey — the order shoppers scan in. */}
        <h3 className="truncate text-sm font-bold leading-tight text-brand-ink">
          <Link href={`/products/${product.slug}`}>{product.brand || product.name}</Link>
        </h3>
        {product.brand && (
          <p className="truncate text-xs leading-tight text-brand-muted-ink">{product.name}</p>
        )}

        {/* Price: what you pay, what it was, how much off. */}
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-sm font-bold text-brand-ink">{formatPrice(price)}</span>
          {pricing.hasDiscount && (
            <>
              <span className="text-xs text-brand-faint-ink line-through">
                {formatPrice(pricing.compareAtPrice!)}
              </span>
              <span className="text-xs font-bold text-brand-discount">
                ({pricing.discountPercent}% OFF)
              </span>
            </>
          )}
        </div>

        {/* In-grid variant selection. */}
        {colours.length > 1 && (
          <div className="mt-1">
            <ColourPicker
              swatches={colours}
              selectedVariantId={selectedVariantId}
              onSelect={setSelectedVariantId}
            />
          </div>
        )}

        {sizes.length > 0 && (
          <div className="mt-1">
            <SizePicker
              sizes={sizes}
              selectedVariantId={selectedVariantId}
              onSelect={setSelectedVariantId}
            />
          </div>
        )}

        {/* Scarcity outranks social proof: it is the more actionable of the
            two, and showing both makes the card shout. */}
        {scarcity ? (
          <p className="mt-0.5 truncate text-[11px] font-bold text-brand-urgent">
            {scarcity.message}
          </p>
        ) : proof ? (
          <p className="mt-0.5 truncate text-[11px] font-medium text-brand-discount">{proof}</p>
        ) : null}
      </div>
    </div>
  );
}
