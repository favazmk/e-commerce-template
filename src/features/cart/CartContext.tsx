"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartCalculationResult } from "@/types/commerce";
import { AnalyticsService, type AnalyticsItem } from "@/services/analytics.service";

export interface CartItemKey {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

interface CartContextType {
  items: CartItemKey[];
  calculatedCart: CartCalculationResult | null;
  totalItemCount: number;
  isMiniCartOpen: boolean;
  couponCode: string;
  shippingMethodId: string;
  isLoading: boolean;
  setShippingMethodId: (id: string) => void;
  openMiniCart: () => void;
  closeMiniCart: () => void;
  addItem: (
    productId: string,
    variantId?: string | null,
    quantity?: number,
    /**
     * Optional catalog detail for analytics. The cart itself only tracks ids
     * and quantities, so callers that already hold the product pass it here
     * rather than making the cart fetch it back.
     */
    analyticsItem?: AnalyticsItem
  ) => void;
  updateQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = "guest_cart_v1";
const COUPON_STORAGE_KEY = "coupon_code_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemKey[]>([]);
  const [couponCode, setCouponCode] = useState<string>("");
  const [shippingMethodId, setShippingMethodId] = useState<string>("");
  const [calculatedCart, setCalculatedCart] = useState<CartCalculationResult | null>(null);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
      const storedCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
      if (storedCoupon) {
        setCouponCode(storedCoupon);
      }
    } catch (e) {
      console.error("Failed to load local cart", e);
    }
    setIsInitialized(true);
  }, []);

  const refreshCart = React.useCallback(async () => {
    if (items.length === 0) {
      setCalculatedCart(null);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          couponCode: couponCode || undefined,
          // Without this the server prices the default method while the UI
          // shows the selected one, so the displayed total is wrong.
          shippingMethodId: shippingMethodId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCalculatedCart(data.data);
      }
    } catch (err) {
      console.error("Failed to calculate cart from API", err);
    } finally {
      setIsLoading(false);
    }
  }, [items, couponCode, shippingMethodId]);

  // Save to localStorage and trigger server calculation
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save local cart", e);
    }
    refreshCart();
  }, [items, couponCode, shippingMethodId, isInitialized, refreshCart]);

  const addItem = (
    productId: string,
    variantId?: string | null,
    quantity = 1,
    analyticsItem?: AnalyticsItem
  ) => {
    const item: AnalyticsItem =
      analyticsItem ?? { item_id: productId, item_name: productId, price: 0, quantity };
    AnalyticsService.track("add_to_cart", {
      currency: calculatedCart?.currency,
      value: item.price * quantity,
      items: [{ ...item, quantity }],
    });

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === productId && (i.variantId || null) === (variantId || null)
      );
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        return next;
      }
      return [...prev, { productId, variantId: variantId || null, quantity }];
    });
    setIsMiniCartOpen(true);
  };

  const updateQuantity = (
    productId: string,
    variantId: string | null | undefined,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId && (item.variantId || null) === (variantId || null)
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeItem = (productId: string, variantId?: string | null) => {
    const removed = calculatedCart?.items.find(
      (entry) => entry.productId === productId && (entry.variantId || null) === (variantId || null)
    );
    if (removed) {
      AnalyticsService.track("remove_from_cart", {
        currency: calculatedCart?.currency,
        value: removed.totalPrice,
        items: [
          {
            item_id: removed.productId,
            item_name: removed.name,
            price: removed.unitPrice,
            quantity: removed.quantity,
          },
        ],
      });
    }

    setItems((prev) =>
      prev.filter(
        (item) =>
          !(item.productId === productId && (item.variantId || null) === (variantId || null))
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode("");
    setShippingMethodId("");
    setCalculatedCart(null);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch {
      // localStorage can be unavailable (private mode, disabled storage).
    }
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    const trimmed = code.trim().toUpperCase();
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: trimmed,
          subtotal: calculatedCart?.subtotal || 0,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.isValid) {
        setCouponCode(trimmed);
        localStorage.setItem(COUPON_STORAGE_KEY, trimmed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    localStorage.removeItem(COUPON_STORAGE_KEY);
  };

  const totalItemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        calculatedCart,
        totalItemCount,
        isMiniCartOpen,
        couponCode,
        shippingMethodId,
        isLoading,
        setShippingMethodId,
        openMiniCart: () => setIsMiniCartOpen(true),
        closeMiniCart: () => setIsMiniCartOpen(false),
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
