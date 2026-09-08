"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { useCart } from "@/features/cart/CartContext";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductImage } from "@/components/storefront/ProductImage";
import { FreeShippingBar } from "@/components/storefront/FreeShippingBar";
import { CartRecommendations } from "@/components/storefront/CartRecommendations";
import { RecentlyViewed } from "@/components/storefront/RecentlyViewed";
import { formatPrice } from "@/lib/config/store.config";
import { AnalyticsService } from "@/services/analytics.service";

export default function CartPage() {
  const {
    calculatedCart,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    couponCode,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  // The cart recalculates on every quantity change, so guard the event or
  // GA4 records a view_cart for each tap of the plus button.
  const viewCartReported = useRef(false);
  useEffect(() => {
    if (viewCartReported.current || !calculatedCart || calculatedCart.items.length === 0) return;
    viewCartReported.current = true;
    AnalyticsService.track("view_cart", {
      currency: calculatedCart.currency,
      value: calculatedCart.total,
      items: calculatedCart.items.map((item) => ({
        item_id: item.productId,
        item_name: item.name,
        price: item.unitPrice,
        quantity: item.quantity,
      })),
    });
  }, [calculatedCart]);

  const handleApplyCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputCoupon.trim()) return;
    setIsApplying(true);
    setCouponError("");
    const success = await applyCoupon(inputCoupon);
    if (!success) setCouponError("That code is not valid or has expired.");
    else setInputCoupon("");
    setIsApplying(false);
  };

  if (!calculatedCart || calculatedCart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Nothing here yet. Browse the collection and add something you like — we will keep it saved for you."
          actionText="Start shopping"
          actionHref="/products"
        />
        {/* Even an empty cart is a chance to restart the journey rather than
            leaving the shopper at a dead end. */}
        <div className="mt-8">
          <RecentlyViewed title="Pick up where you left off" />
        </div>
      </div>
    );
  }

  const cartProductIds = [...new Set(calculatedCart.items.map((item) => item.productId))];

  // Free-shipping threshold from the cheapest method that offers one, taken
  // from the server-calculated cart so the bar and the charge always agree.
  const freeShippingThreshold =
    calculatedCart.availableShippingMethods
      .map((method) => method.free_threshold)
      .filter((value): value is number => typeof value === "number" && value > 0)
      .sort((a, b) => a - b)[0] ?? null;

  const listSavings = Math.max(0, calculatedCart.listSubtotal - calculatedCart.subtotal);
  const totalSavings = listSavings + calculatedCart.discount.amount;
  const itemCount = calculatedCart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-heading text-2xl font-bold text-brand-ink sm:text-3xl">
          Shopping bag
        </h1>
        <span className="text-sm text-brand-muted-ink">
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </span>
      </div>

      {/* Validation problems (stock, coupon) belong at the top: discovering them
          at the payment step is where carts are abandoned. */}
      {!calculatedCart.isValid && calculatedCart.validationErrors.length > 0 && (
        <div
          role="alert"
          className="mb-6 rounded-brand border border-brand-warning-border bg-brand-warning-surface p-4 text-sm text-brand-warning"
        >
          <p className="font-semibold">Please review your bag before checking out:</p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs">
            {calculatedCart.validationErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <FreeShippingBar
        subtotal={calculatedCart.subtotal - calculatedCart.discount.amount}
        threshold={freeShippingThreshold}
        className="mb-6"
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Items */}
        <div className="space-y-6 lg:col-span-8">
          <ul className="divide-y divide-brand-border overflow-hidden rounded-brand-xl border border-brand-border bg-white shadow-subtle">
            {calculatedCart.items.map((item) => {
              const hasListSaving = item.listPrice != null && item.listPrice > item.unitPrice;

              return (
                <li
                  key={`${item.productId}_${item.variantId || "default"}`}
                  className="flex gap-4 p-4 sm:p-6"
                >
                  <Link
                    href={`/products/${item.productId}`}
                    className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-brand border border-brand-border bg-brand-subtle sm:h-28 sm:w-24"
                  >
                    <ProductImage
                      src={item.image}
                      seed={item.name}
                      alt=""
                      sizes="96px"
                      className="object-cover"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold leading-snug text-brand-ink">
                          <Link href={`/products/${item.productId}`} className="hover:underline">
                            {item.name}
                          </Link>
                        </h2>
                        <p className="mt-0.5 text-[11px] text-brand-faint-ink">SKU {item.sku}</p>

                        {item.attributes && Object.keys(item.attributes).length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {Object.entries(item.attributes).map(([key, value]) => (
                              <span
                                key={key}
                                className="rounded-sm bg-brand-subtle px-2 py-0.5 text-[11px] font-medium text-brand-muted-ink"
                              >
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}

                        {!item.inStock && (
                          <p className="mt-1.5 text-xs font-semibold text-brand-danger">
                            Only {item.availableStock} available
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="flex-shrink-0 p-1 text-brand-faint-ink transition-colors hover:text-brand-danger"
                        aria-label={`Remove ${item.name} from bag`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                      <div className="flex items-center rounded-brand border border-brand-border bg-white">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity - 1)
                          }
                          className="p-2 text-brand-muted-ink transition-colors hover:text-brand-ink"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-9 text-center text-xs font-bold text-brand-ink">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.availableStock}
                          className="p-2 text-brand-muted-ink transition-colors hover:text-brand-ink disabled:opacity-40"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-base font-bold text-brand-ink">
                          {formatPrice(item.totalPrice)}
                        </p>
                        {hasListSaving && (
                          <p className="text-[11px] text-brand-faint-ink line-through">
                            {formatPrice(item.listPrice! * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between text-xs">
            <Link href="/products" className="font-semibold text-brand-primary hover:underline">
              ← Continue shopping
            </Link>
            <button onClick={clearCart} className="text-brand-faint-ink hover:text-brand-danger">
              Clear bag
            </button>
          </div>

          <CartRecommendations cartProductIds={cartProductIds} />
        </div>

        {/* Summary */}
        <div className="lg:col-span-4">
          <div className="space-y-4 lg:sticky lg:top-28">
            <div className="space-y-5 rounded-brand-xl border border-brand-border bg-white p-5 shadow-subtle sm:p-6">
              <h2 className="border-b border-brand-border pb-4 font-heading text-base font-bold text-brand-ink">
                Order summary
              </h2>

              {/* Myntra-style price breakdown: the shopper sees the marked
                  price, then every reduction, then what they actually pay. */}
              <dl className="space-y-3 text-sm">
                {listSavings > 0 && (
                  <div className="flex justify-between text-brand-muted-ink">
                    <dt>Total marked price</dt>
                    <dd>{formatPrice(calculatedCart.listSubtotal)}</dd>
                  </div>
                )}

                {listSavings > 0 ? (
                  <div className="flex justify-between font-semibold text-brand-primary">
                    <dt>Discount on marked price</dt>
                    <dd>-{formatPrice(listSavings)}</dd>
                  </div>
                ) : (
                  <div className="flex justify-between text-brand-muted-ink">
                    <dt>Subtotal</dt>
                    <dd className="font-semibold text-brand-ink">
                      {formatPrice(calculatedCart.subtotal)}
                    </dd>
                  </div>
                )}

                {calculatedCart.discount.amount > 0 && (
                  <div className="flex justify-between font-semibold text-brand-primary">
                    <dt className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" /> Coupon ({calculatedCart.discount.code})
                    </dt>
                    <dd>-{formatPrice(calculatedCart.discount.amount)}</dd>
                  </div>
                )}

                <div className="flex justify-between text-brand-muted-ink">
                  <dt>Delivery</dt>
                  <dd
                    className={
                      calculatedCart.shipping.amount === 0
                        ? "font-semibold text-brand-primary"
                        : "font-semibold text-brand-ink"
                    }
                  >
                    {calculatedCart.shipping.amount === 0
                      ? "Free"
                      : formatPrice(calculatedCart.shipping.amount)}
                  </dd>
                </div>

                {calculatedCart.tax.amount > 0 && (
                  <div className="flex justify-between text-brand-muted-ink">
                    <dt>
                      Tax{calculatedCart.tax.rate ? ` (${calculatedCart.tax.rate}%)` : ""}
                      {calculatedCart.tax.isInclusive && (
                        <span className="ml-1 text-xs text-brand-faint-ink">included</span>
                      )}
                    </dt>
                    <dd className="font-semibold text-brand-ink">
                      {formatPrice(calculatedCart.tax.amount)}
                    </dd>
                  </div>
                )}

                <div className="flex items-baseline justify-between border-t border-brand-border pt-4 text-base font-bold text-brand-ink">
                  <dt>Total</dt>
                  <dd className="font-heading text-xl">{formatPrice(calculatedCart.total)}</dd>
                </div>
              </dl>

              {totalSavings > 0 && (
                <p className="rounded-brand bg-brand-success/10 px-3 py-2 text-center text-sm font-bold text-brand-primary">
                  You save {formatPrice(totalSavings)} on this order
                </p>
              )}

              {/* Coupon */}
              <div className="border-t border-brand-border pt-4">
                {couponCode ? (
                  <div className="flex items-center justify-between rounded-brand border border-brand-success/30 bg-brand-success/10 p-2.5 text-xs text-brand-success">
                    <span className="font-bold">Code applied: {couponCode}</span>
                    <button
                      onClick={removeCoupon}
                      className="font-medium text-brand-danger hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-2">
                    <label
                      htmlFor="coupon"
                      className="block text-[11px] font-bold uppercase tracking-wider text-brand-muted-ink"
                    >
                      Have a promo code?
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="coupon"
                        type="text"
                        value={inputCoupon}
                        onChange={(event) => setInputCoupon(event.target.value)}
                        placeholder="Enter code"
                        className="flex-1 rounded-brand border border-brand-border-strong px-3 py-2 text-xs uppercase placeholder:normal-case focus:border-brand-ink focus:outline-none"
                      />
                      <Button type="submit" size="sm" variant="secondary" isLoading={isApplying}>
                        Apply
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-xs font-medium text-brand-danger">{couponError}</p>
                    )}
                  </form>
                )}
              </div>

              <Link href="/checkout" className="block w-full">
                <Button
                  size="lg"
                  className="w-full gap-2 text-sm font-semibold uppercase tracking-wider"
                  disabled={!calculatedCart.isValid}
                >
                  Checkout securely <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              {/* Reassurance at the exact moment of commitment. */}
              <ul className="space-y-2 border-t border-brand-border pt-4 text-xs text-brand-muted-ink">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-brand-primary" />
                  Encrypted checkout — we never store card details
                </li>
                <li className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 flex-shrink-0 text-brand-primary" />
                  Tracked delivery with updates by email
                </li>
                <li className="flex items-center gap-2">
                  <RotateCcw className="h-3.5 w-3.5 flex-shrink-0 text-brand-primary" />
                  <span>
                    Easy returns —{" "}
                    <Link href="/refund-policy" className="underline hover:text-brand-ink">
                      see our policy
                    </Link>
                  </span>
                </li>
              </ul>
            </div>

            <Link
              href="/wishlist"
              className="flex items-center justify-center gap-2 rounded-brand-xl border border-brand-border bg-white p-3 text-xs font-semibold text-brand-muted-ink shadow-subtle transition-colors hover:border-brand-border-strong hover:text-brand-ink"
            >
              <Heart className="h-4 w-4 text-brand-muted-ink" /> View your wishlist
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
