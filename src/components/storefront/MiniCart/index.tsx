"use client";

import React from "react";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck } from "lucide-react";
import { useCart } from "@/features/cart/CartContext";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import Image from "next/image";

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
        <div className="mb-4 rounded-brand bg-slate-50 p-3 border border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <Truck className="h-4 w-4 text-emerald-600" />
            {amountNeededForFreeShipping === 0 ? (
              <span className="text-emerald-700">You unlocked Free Express Shipping!</span>
            ) : (
              <span>
                Add <span className="font-bold text-slate-900">${amountNeededForFreeShipping.toFixed(2)}</span> more for Free Shipping
              </span>
            )}
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        {!calculatedCart || calculatedCart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h4 className="text-base font-semibold text-slate-900">Your bag is empty</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
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
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
            {calculatedCart.items.map((item) => (
              <div key={`${item.productId}_${item.variantId || "default"}`} className="py-4 flex gap-4">
                {/* Thumbnail */}
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-brand bg-slate-100 border border-slate-100">
                  {item.image ? (
                    <Image fill sizes="(max-width: 768px) 100vw, 33vw" src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-slate-200" />
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{item.name}</h4>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Attributes (e.g. Size: M, Color: Camel) */}
                    {item.attributes && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {Object.entries(item.attributes)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" • ")}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity Selector */}
                    <div className="flex items-center rounded-brand border border-slate-200 bg-white">
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-semibold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <span className="text-sm font-bold text-slate-900">
                      ${item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Checkout Summary */}
        {calculatedCart && calculatedCart.items.length > 0 && (
          <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">Subtotal</span>
              <span className="font-bold text-slate-900">${calculatedCart.subtotal.toFixed(2)}</span>
            </div>

            {calculatedCart.discount.amount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold">
                <span>Promo Discount ({calculatedCart.discount.code})</span>
                <span>-${calculatedCart.discount.amount.toFixed(2)}</span>
              </div>
            )}

            <p className="text-[11px] text-slate-400">
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
