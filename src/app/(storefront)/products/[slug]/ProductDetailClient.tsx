"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { useCart } from "@/features/cart/CartContext";
import { useWishlist } from "@/features/wishlist/WishlistContext";
import { useRecentlyViewed } from "@/features/recently-viewed/useRecentlyViewed";
import { ProductImage } from "@/components/storefront/ProductImage";
import { StarRating } from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import { BackInStockForm } from "@/components/storefront/BackInStockForm";
import {
  DeliveryEstimate,
  type DeliveryOption,
} from "@/components/storefront/DeliveryEstimate";
import { formatPrice } from "@/lib/config/store.config";
import { priceBreakdown, salesProof, stockSignal } from "@/lib/commerce/merchandising";
import { AnalyticsService, toAnalyticsItem } from "@/services/analytics.service";
import type { Product, ProductVariant } from "@/types/database";
import type { ProductStats } from "@/repositories/interfaces/merchandising.repository.interface";

/** Store-level commerce facts, resolved on the server from merchant settings. */
export interface StorefrontCommerceInfo {
  shippingOptions: DeliveryOption[];
  returnWindowDays: number;
  /** e.g. "Inclusive of VAT". Empty string hides the line. */
  taxNote: string;
  /** Courier non-working days, 0 = Sunday. */
  nonWorkingDays?: number[];
  /** Live public offers, shown as a promotions list. */
  offers: { code: string; description: string }[];
}

export interface ProductDetailClientProps {
  product: Product;
  stats: ProductStats | null;
  commerce: StorefrontCommerceInfo;
}

/** Group variants into selectable axes, e.g. Size and Colour. */
function useVariantAxes(variants: ProductVariant[]) {
  return useMemo(() => {
    const axes: { name: string; values: string[] }[] = [];

    for (const variant of variants) {
      for (const [key, value] of Object.entries(variant.attributes || {})) {
        let axis = axes.find((entry) => entry.name === key);
        if (!axis) {
          axis = { name: key, values: [] };
          axes.push(axis);
        }
        if (!axis.values.includes(value)) axis.values.push(value);
      }
    }

    return axes;
  }, [variants]);
}

export function ProductDetailClient({ product, stats, commerce }: ProductDetailClientProps) {
  const router = useRouter();
  const { addItem, openMiniCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { record } = useRecentlyViewed();

  const variants = useMemo(
    () => (product.variants || []).filter((variant) => variant.is_active),
    [product.variants]
  );
  const axes = useVariantAxes(variants);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selection, setSelection] = useState<Record<string, string>>(() => {
    // Preselect the first variant that is actually purchasable, so the page
    // does not open on a greyed-out "sold out" state when stock exists.
    const firstInStock = variants.find((variant) => variant.stock > 0) || variants[0];
    return firstInStock ? { ...firstInStock.attributes } : {};
  });
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Remembering the view is a client-side, storage-only side effect.
  useEffect(() => {
    record(product.id);
  }, [product.id, record]);

  // view_item is the event that populates Google Ads remarketing audiences and
  // GA4 product performance. Fired once per product, not per variant switch.
  useEffect(() => {
    AnalyticsService.track("view_item", {
      currency: product.currency,
      value: Number(product.price),
      items: [toAnalyticsItem(product, 1)],
    });
  }, [product]);

  const selectedVariant = useMemo(() => {
    if (variants.length === 0) return null;
    return (
      variants.find((variant) =>
        axes.every((axis) => variant.attributes?.[axis.name] === selection[axis.name])
      ) || null
    );
  }, [variants, axes, selection]);

  const images = product.images || [];
  const price = selectedVariant ? selectedVariant.price : product.price;
  const compareAt = selectedVariant?.compare_at_price ?? product.compare_at_price;
  const stock = selectedVariant ? selectedVariant.stock : product.stock_quantity;
  const sku = selectedVariant ? selectedVariant.sku : product.sku;

  const pricing = priceBreakdown(price, compareAt);
  const scarcity = stockSignal({ stock_quantity: stock, low_stock_threshold: product.low_stock_threshold });
  const proof = salesProof(stats);
  const soldOut = stock <= 0;

  // Clamp quantity when the shopper switches to a lower-stocked variant.
  useEffect(() => {
    setQuantity((current) => Math.min(Math.max(1, current), Math.max(1, stock)));
  }, [stock]);

  /** Is any in-stock variant reachable if this axis value were chosen? */
  const isValueAvailable = (axisName: string, value: string): boolean =>
    variants.some(
      (variant) =>
        variant.stock > 0 &&
        variant.attributes?.[axisName] === value &&
        axes
          .filter((axis) => axis.name !== axisName)
          .every((axis) => !selection[axis.name] || variant.attributes?.[axis.name] === selection[axis.name])
    );

  const handleAddToCart = () => {
    addItem(
      product.id,
      selectedVariant?.id || null,
      quantity,
      toAnalyticsItem(product, quantity, selectedVariant)
    );
    setIsAdded(true);
    openMiniCart();
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(
      product.id,
      selectedVariant?.id || null,
      quantity,
      toAnalyticsItem(product, quantity, selectedVariant)
    );
    router.push("/checkout");
  };

  const specifications: [string, string][] = [
    ...(product.brand ? ([["Brand", product.brand]] as [string, string][]) : []),
    ["SKU", sku],
    ...(product.category?.name ? ([["Category", product.category.name]] as [string, string][]) : []),
    // Merchant-supplied attributes live in metadata, so a client can add
    // "Material", "Fragrance family" or anything else without a code change.
    ...Object.entries(product.metadata?.specifications || {}).map(
      ([key, value]) => [key, String(value)] as [string, string]
    ),
    ...(product.tags && product.tags.length > 0
      ? ([["Tags", product.tags.join(", ")]] as [string, string][])
      : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6 sm:mb-8">
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
          {product.category && (
            <>
              <ChevronRight className="h-3 w-3 text-brand-faint-ink" aria-hidden="true" />
              <li>
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="transition-colors hover:text-brand-ink"
                >
                  {product.category.name}
                </Link>
              </li>
            </>
          )}
          <ChevronRight className="h-3 w-3 text-brand-faint-ink" aria-hidden="true" />
          <li className="max-w-[45vw] truncate font-semibold text-brand-ink sm:max-w-xs">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Gallery */}
        <div className="lg:col-span-7">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
            {images.length > 1 && (
              <div className="flex max-h-[560px] flex-shrink-0 gap-2.5 overflow-x-auto sm:flex-col sm:overflow-y-auto">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`View image ${index + 1} of ${images.length}`}
                    aria-current={selectedImageIndex === index}
                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-brand border-2 transition-all sm:h-20 sm:w-20 ${
                      selectedImageIndex === index
                        ? "border-brand-ink shadow-sm"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <ProductImage
                      src={image.url}
                      seed={product.name}
                      alt=""
                      sizes="80px"
                      compact
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="relative aspect-[3/4] w-full flex-1 overflow-hidden rounded-brand-xl border border-brand-border bg-brand-subtle shadow-subtle">
              <ProductImage
                src={images[selectedImageIndex]?.url || images[0]?.url}
                seed={product.name}
                alt={product.name}
                sizes="(max-width: 1024px) 100vw, 55vw"
                priority
                className="object-cover object-center"
              />
              {pricing.hasDiscount && pricing.discountPercent >= 5 && (
                <span className="absolute left-4 top-4 rounded-brand-sm bg-rose-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                  {pricing.discountPercent}% off
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Buy box */}
        <div className="lg:col-span-5">
          <div className="space-y-5">
            <header>
              {product.brand && (
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary">
                  {product.brand}
                </span>
              )}
              <h1 className="mt-1 font-heading text-2xl font-bold leading-tight text-brand-ink sm:text-3xl">
                {product.name}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                {stats && stats.review_count > 0 && (
                  <a href="#reviews" className="hover:opacity-80">
                    <StarRating
                      rating={stats.average_rating}
                      count={stats.review_count}
                      size="sm"
                      variant="pill"
                    />
                  </a>
                )}
                {proof && (
                  <span className="text-xs font-medium text-brand-muted-ink">{proof}</span>
                )}
              </div>
            </header>

            {/* Price */}
            <div className="border-b border-brand-border pb-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-heading text-3xl font-bold text-brand-ink">
                  {formatPrice(price)}
                </span>
                {pricing.hasDiscount && (
                  <>
                    <span className="text-lg text-brand-faint-ink line-through">
                      {formatPrice(pricing.compareAtPrice!)}
                    </span>
                    <span className="text-sm font-bold text-rose-600">
                      {pricing.discountPercent}% off
                    </span>
                  </>
                )}
              </div>

              {pricing.hasDiscount && (
                <p className="mt-1 text-sm font-semibold text-brand-primary">
                  You save {formatPrice(pricing.savings)}
                </p>
              )}
              {commerce.taxNote && (
                <p className="mt-1 text-xs text-brand-faint-ink">{commerce.taxNote}</p>
              )}

              {scarcity && (
                <p
                  className={`mt-3 inline-flex items-center rounded-brand-sm px-2.5 py-1 text-xs font-bold ${
                    scarcity.tone === "danger"
                      ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                  }`}
                >
                  {scarcity.message}
                </p>
              )}
            </div>

            {product.short_description && (
              <p className="text-sm leading-relaxed text-brand-muted-ink">{product.short_description}</p>
            )}

            {/* Offers — real coupon codes the merchant has published */}
            {commerce.offers.length > 0 && (
              <div className="rounded-brand-xl border border-dashed border-brand-success/40 bg-brand-success/10/50 p-4">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-success">
                  <Tag className="h-3.5 w-3.5" /> Available offers
                </h2>
                <ul className="mt-2.5 space-y-1.5">
                  {commerce.offers.map((offer) => (
                    <li key={offer.code} className="text-xs leading-relaxed text-brand-muted-ink">
                      <span className="mr-1.5 rounded-brand-sm bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold text-brand-primary ring-1 ring-brand-primary/30">
                        {offer.code}
                      </span>
                      {offer.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Variant axes */}
            {axes.map((axis) => (
              <div key={axis.name} className="space-y-2.5">
                <div className="flex items-baseline justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-ink">
                    {axis.name}
                  </label>
                  {selection[axis.name] && (
                    <span className="text-xs text-brand-muted-ink">{selection[axis.name]}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {axis.values.map((value) => {
                    const isSelected = selection[axis.name] === value;
                    const available = isValueAvailable(axis.name, value);

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setSelection((current) => ({ ...current, [axis.name]: value }))
                        }
                        aria-pressed={isSelected}
                        className={`min-w-[3rem] rounded-brand border px-3.5 py-2 text-xs font-semibold transition-all ${
                          isSelected
                            ? "border-brand-ink bg-brand-ink text-white shadow-sm"
                            : available
                              ? "border-brand-border bg-white text-brand-ink hover:border-brand-ink"
                              : // Unavailable options stay clickable but are
                                // struck through, so the shopper can see the
                                // full range rather than wondering what is
                                // missing — the marketplace convention.
                                "border-brand-border bg-brand-subtle text-brand-faint-ink line-through"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Purchase controls */}
            {soldOut ? (
              <BackInStockForm
                productId={product.id}
                variantId={selectedVariant?.id || null}
                productName={product.name}
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-brand border border-brand-border-strong bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="p-2.5 text-brand-muted-ink transition-colors hover:text-brand-ink disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span
                      className="w-10 text-center text-sm font-semibold text-brand-ink"
                      aria-live="polite"
                    >
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                      disabled={quantity >= stock}
                      className="p-2.5 text-brand-muted-ink transition-colors hover:text-brand-ink disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <Button
                    type="button"
                    size="lg"
                    onClick={handleAddToCart}
                    className="flex-1 text-sm font-semibold uppercase tracking-wider"
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-5 w-5 text-brand-primary" /> Added to bag
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-5 w-5" /> Add to bag
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => toggleWishlist(product)}
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-brand border transition-all hover:bg-brand-subtle ${
                      isInWishlist(product.id)
                        ? "border-rose-200 bg-rose-50/40 text-rose-500"
                        : "border-brand-border text-brand-muted-ink"
                    }`}
                    aria-label={
                      isInWishlist(product.id) ? "Remove from wishlist" : "Save to wishlist"
                    }
                    aria-pressed={isInWishlist(product.id)}
                  >
                    <Heart
                      className={`h-5 w-5 ${isInWishlist(product.id) ? "fill-rose-500" : ""}`}
                    />
                  </button>
                </div>

                <Button
                  type="button"
                  variant="accent"
                  size="lg"
                  onClick={handleBuyNow}
                  className="w-full text-sm font-semibold uppercase tracking-wider"
                >
                  Buy it now
                </Button>
              </div>
            )}

            {/* Delivery, returns and payment assurance */}
            <DeliveryEstimate
              options={commerce.shippingOptions}
              itemPrice={price * quantity}
              nonWorkingDays={commerce.nonWorkingDays}
              returnWindowDays={commerce.returnWindowDays}
            />

            {/* Details */}
            <div className="divide-y divide-brand-border border-t border-brand-border">
              {product.description && (
                <details className="group py-4" open>
                  <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-wider text-brand-ink">
                    Description
                    <Plus className="h-4 w-4 text-brand-faint-ink transition-transform group-open:rotate-45" />
                  </summary>
                  <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-brand-muted-ink">
                    {product.description}
                  </div>
                </details>
              )}

              {specifications.length > 0 && (
                <details className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-wider text-brand-ink">
                    Product details
                    <Plus className="h-4 w-4 text-brand-faint-ink transition-transform group-open:rotate-45" />
                  </summary>
                  <dl className="mt-3 space-y-2 text-sm">
                    {specifications.map(([label, value]) => (
                      <div key={label} className="flex gap-3">
                        <dt className="w-28 flex-shrink-0 text-brand-faint-ink">{label}</dt>
                        <dd className="text-brand-muted-ink">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}

              <details className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-wider text-brand-ink">
                  Shipping &amp; returns
                  <Plus className="h-4 w-4 text-brand-faint-ink transition-transform group-open:rotate-45" />
                </summary>
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-brand-muted-ink">
                  <p>
                    Delivery times and charges are shown above for your selected method and update
                    with your order total.
                  </p>
                  <p className="flex flex-wrap gap-x-4 gap-y-1">
                    <Link href="/shipping-policy" className="font-semibold text-brand-primary hover:underline">
                      Full shipping policy
                    </Link>
                    <Link href="/refund-policy" className="font-semibold text-brand-primary hover:underline">
                      Returns &amp; refunds
                    </Link>
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>


      {/* Sticky mobile purchase bar.
          On a phone the buy button scrolls out of view within one swipe, and
          the shopper then has to scroll back up to act on a decision they have
          already made. This keeps the action reachable at all times. */}
      {!soldOut && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-border bg-white/95 p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-brand-ink">{formatPrice(price)}</p>
              {pricing.hasDiscount && (
                <p className="truncate text-[11px] text-brand-primary">
                  Save {formatPrice(pricing.savings)}
                </p>
              )}
            </div>
            <Button onClick={handleAddToCart} className="flex-shrink-0">
              <ShoppingBag className="h-4 w-4" /> Add to bag
            </Button>
            <Button onClick={handleBuyNow} variant="accent" className="flex-shrink-0">
              Buy now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
