"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Product } from "@/types/database";

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  totalWishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | null>(null);
const WISHLIST_STORAGE_KEY = "aura_wishlist_v1";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        setWishlistProducts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load wishlist", e);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistProducts));
    } catch (e) {
      console.error("Failed to save wishlist", e);
    }
  }, [wishlistProducts, isInitialized]);

  const toggleWishlist = (product: Product) => {
    setWishlistProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlistProducts.some((p) => p.id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds: wishlistProducts.map((p) => p.id),
        wishlistProducts,
        toggleWishlist,
        isInWishlist,
        totalWishlistCount: wishlistProducts.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
