"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag } from "lucide-react";
import { useCart } from "@/features/cart/CartContext";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductImage } from "@/components/storefront/ProductImage";
import { formatPrice } from "@/lib/config/store.config";

export default function CartPage() {
  const {
    calculatedCart,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    couponCode,
    isLoading,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    setIsApplying(true);
    setCouponError("");
    const success = await applyCoupon(inputCoupon);
    if (!success) {
      setCouponError("Invalid or expired coupon code");
    } else {
      setInputCoupon("");
    }
    setIsApplying(false);
  };

  if (!calculatedCart || calculatedCart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <EmptyState
          icon={ShoppingBag}
          title="Your Shopping Bag is Empty"
          description="You haven't added any items to your bag yet. Explore our curated collections to discover exceptional pieces."
          actionText="Explore Collections"
          actionHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <h1 className="text-3xl font-bold font-heading text-slate-900 mb-8">Shopping Bag</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-brand-xl border border-slate-200 bg-white overflow-hidden shadow-subtle divide-y divide-slate-100">
            {calculatedCart.items.map((item) => (
              <div key={`${item.productId}_${item.variantId || "default"}`} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                {/* Thumbnail */}
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-brand bg-slate-100 border border-slate-100">
                  {item.image ? (
                    <ProductImage src={item.image} seed={item.name} alt="" sizes="96px" className="object-cover" />
                  ) : (
                    <div className="h-full w-full bg-slate-200" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">
                    <Link href={`/products/${item.productId}`} className="hover:underline">
                      {item.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">SKU: {item.sku}</p>

                  {item.attributes && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {Object.entries(item.attributes).map(([k, v]) => (
                        <span key={k} className="inline-block rounded-sm bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 text-sm font-bold text-slate-900 sm:hidden">
                    {formatPrice(item.unitPrice)}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between sm:justify-start">
                  <div className="flex items-center rounded-brand border border-slate-200 bg-white shadow-sm">
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                      className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 text-center text-xs font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                      className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <span className="text-base font-bold text-slate-900">
                      {formatPrice(item.totalPrice)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-2"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs">
            <Link href="/products" className="font-semibold text-emerald-600 hover:underline">
              ← Continue Shopping
            </Link>
            <button onClick={clearCart} className="text-slate-400 hover:text-rose-600">
              Clear Entire Bag
            </button>
          </div>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
              Order Summary
            </h2>

            {/* Subtotal, Shipping, Tax, Total */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">
                  {formatPrice(calculatedCart.subtotal)}
                </span>
              </div>

              {calculatedCart.discount.amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" /> Coupon ({calculatedCart.discount.code})
                  </span>
                  <span>-{formatPrice(calculatedCart.discount.amount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Estimated Shipping</span>
                <span className="font-semibold text-slate-900">
                  {calculatedCart.shipping.amount === 0 ? "FREE" : formatPrice(calculatedCart.shipping.amount)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax ({calculatedCart.tax.rate}%)</span>
                <span className="font-semibold text-slate-900">
                  {formatPrice(calculatedCart.tax.amount)}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-between text-base font-bold text-slate-900">
                <span>Estimated Total</span>
                <span className="text-xl">{formatPrice(calculatedCart.total)}</span>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="border-t border-slate-100 pt-4">
              {couponCode ? (
                <div className="flex items-center justify-between p-2.5 rounded-brand bg-emerald-50 border border-emerald-200/60 text-xs text-emerald-800">
                  <span className="font-bold">Code applied: {couponCode}</span>
                  <button onClick={removeCoupon} className="text-rose-600 hover:underline font-medium">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value)}
                      placeholder="Promo code (e.g. WELCOME10)"
                      className="flex-1 rounded-brand border border-slate-300 px-3 py-2 text-xs uppercase placeholder:normal-case focus:border-slate-900 focus:outline-none"
                    />
                    <Button type="submit" size="sm" variant="secondary" isLoading={isApplying}>
                      Apply
                    </Button>
                  </div>
                  {couponError && <p className="text-xs text-rose-600 font-medium">{couponError}</p>}
                </form>
              )}
            </div>

            {/* Checkout CTA */}
            <Link href="/checkout" className="block w-full">
              <Button size="lg" variant="primary" className="w-full gap-2 font-semibold uppercase tracking-wider text-sm">
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Encrypted 256-Bit SSL Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
