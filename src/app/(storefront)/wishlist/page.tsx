"use client";

import React from "react";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useWishlist } from "@/features/wishlist/WishlistContext";
import { ProductCard } from "@/components/storefront/ProductCard";
import { EmptyState } from "@/components/ui/empty-state";

export default function WishlistPage() {
  const { wishlistProducts } = useWishlist();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="border-b border-brand-border pb-6 mb-10">
        <h1 className="text-3xl font-bold font-heading text-brand-ink">Saved Wishlist</h1>
        <p className="mt-1 text-sm text-brand-muted-ink">
          Your personal curation of bespoke pieces saved for future acquisition.
        </p>
      </div>

      {wishlistProducts.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your Wishlist is Empty"
          description="Click the heart icon on any product to save items you love for easy ordering later."
          actionText="Discover Collection"
          actionHref="/products"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {wishlistProducts.map((product) => (
            <ProductCard key={product.id} product={product} variant="luxury" />
          ))}
        </div>
      )}
    </div>
  );
}
