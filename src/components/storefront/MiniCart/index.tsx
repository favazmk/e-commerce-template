"use client";

import React from "react";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck } from "lucide-react";
import { useCart } from "@/features/cart/CartContext";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ProductImage } from "../ProductImage";
import { formatPrice } from "@/lib/config/store.config";

export function MiniCart() {
  const {
    isMiniCartOpen,
    closeMiniCart,
    calculatedCart,
    updateQuantity,
    removeItem,
    totalItemCount,
    isLoading,
  } = useCart();

  const subtotal = calculatedCart?.subtotal || 0;
  const freeShippingThreshold = 200;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <Drawer isOpen={isMiniCartOpen} onClose={closeMiniCart} title={`Shopping Bag (${totalItemCount})`}>
      <div className="flex h-full flex-col justify-between">
        {/* Free Shipping Progress Indicator */}
        <div className="mb-4 rounded-brand bg-brand-subtle p-3 border border-brand-border">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-ink">
            <Truck className="h-4 w-4 text-brand-primary" />
            {amountNeededForFreeShipping === 0 ? (
              <span className="text-brand-primary">You unlocked Free Express Shipping!</span>
            ) : (
              <span>
                Add <span className="font-bold text-brand-ink">{formatPrice(amountNeededForFreeShipping)}</span> more for Free Shipping
              </span>
            )}
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-border">
            <div
              className="h-full bg-brand-primary transition-all duration-500 rounded-full"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        {!calculatedCart || calculatedCart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-subtle text-brand-faint-ink mb-4">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h4 className="text-base font-semibold text-brand-ink">Your bag is empty</h4>
            <p className="mt-1 text-xs text-brand-muted-ink max-w-xs">
              Explore our artisanal garments and timeless essentials.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-6"
              onClick={closeMiniCart}
            >
              <Link href="/products">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-brand-border pr-1">
            {calculatedCart.items.map((item) => (
              <div key={`${item.productId}_${item.variantId || "default"}`} className="py-4 flex gap-4">
                {/* Thumbnail */}
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-brand bg-brand-subtle border border-brand-border">
                  <ProductImage
                    src={item.image}
                    seed={item.name}
                    alt=""
                    sizes="80px"
                    compact
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-semibold text-brand-ink line-clamp-1">{item.name}</h4>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-brand-faint-ink hover:text-brand-danger transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Attributes (e.g. Size: M, Color: Camel) */}
                    {item.attributes && (
                      <p className="text-xs text-brand-muted-ink mt-0.5">
                        {Object.entries(item.attributes)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" • ")}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity Selector */}
                    <div className="flex items-center rounded-brand border border-brand-border bg-white">
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="p-1.5 text-brand-muted-ink hover:text-brand-ink transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-semibold text-brand-ink">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        className="p-1.5 text-brand-muted-ink hover:text-brand-ink transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <span className="text-sm font-bold text-brand-ink">
                      {formatPrice(item.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Checkout Summary */}
        {calculatedCart && calculatedCart.items.length > 0 && (
          <div className="border-t border-brand-border pt-4 mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-muted-ink font-medium">Subtotal</span>
              <span className="font-bold text-brand-ink">{formatPrice(calculatedCart.subtotal)}</span>
            </div>

            {calculatedCart.discount.amount > 0 && (
              <div className="flex items-center justify-between text-xs text-brand-primary font-semibold">
                <span>Promo Discount ({calculatedCart.discount.code})</span>
                <span>-{formatPrice(calculatedCart.discount.amount)}</span>
              </div>
            )}

            <p className="text-[11px] text-brand-faint-ink">
              Taxes and shipping calculated during checkout.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link href="/cart" onClick={closeMiniCart} className="w-full">
                <Button variant="outline" size="md" className="w-full">
                  View Bag
                </Button>
              </Link>
              <Link href="/checkout" onClick={closeMiniCart} className="w-full">
                <Button variant="primary" size="md" className="w-full gap-1.5">
                  Checkout <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
