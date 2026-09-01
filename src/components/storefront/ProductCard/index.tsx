"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Eye, Check } from "lucide-react";
import { useCart } from "@/features/cart/CartContext";
import { useWishlist } from "@/features/wishlist/WishlistContext";
import { ProductCardVariant } from "@/theme/theme.config";
import { Product } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export interface ProductCardProps {
  product: Product;
  variant?: ProductCardVariant;
}

export function ProductCard({ product, variant = "luxury" }: ProductCardProps) {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const isFavorite = isInWishlist(product.id);
  const primaryImage = product.images?.[0]?.url || "/placeholder-product.png";
  const hoverImage = product.images?.[1]?.url || primaryImage;

  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultVariant = product.variants?.[0]?.id || null;
    addItem(product.id, defaultVariant, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  // 1. Minimal Variant
  if (variant === "minimal") {
    return (
      <div className="group relative flex flex-col">
        <Link href={`/products/${product.slug}`} className="block overflow-hidden rounded-brand bg-slate-50">
          <Image fill sizes="(max-width: 768px) 100vw, 33vw"
            src={isHovered ? hoverImage : primaryImage}
            alt={product.name}
            className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          />
        </Link>
        <div className="mt-3 flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-slate-900 hover:underline">
              <Link href={`/products/${product.slug}`}>{product.name}</Link>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{product.brand}</p>
          </div>
          <p className="text-sm font-semibold text-slate-900">${product.price.toFixed(2)}</p>
        </div>
      </div>
    );
  }

  // 2. Compact Variant
  if (variant === "compact") {
    return (
      <div className="flex items-center space-x-4 p-3 bg-white rounded-brand border border-slate-100 shadow-subtle hover:border-slate-300 transition-colors">
        <Link href={`/products/${product.slug}`} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-brand bg-slate-100">
          <Image fill sizes="(max-width: 768px) 100vw, 33vw" src={primaryImage} alt={product.name} className="h-full w-full object-cover" />
        </Link>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 truncate">
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">${product.price.toFixed(2)}</p>
          <button
            onClick={handleQuickAdd}
            className="mt-2 text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Quick Add
          </button>
        </div>
      </div>
    );
  }

  // 3. Luxury / Modern Default Variant
  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-brand-lg bg-white border border-slate-100/80 shadow-subtle transition-all duration-300 hover:shadow-float hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container with Badges */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-50">
        <Link href={`/products/${product.slug}`} className="block h-full w-full">
          <Image fill sizes="(max-width: 768px) 100vw, 33vw"
            src={isHovered ? hoverImage : primaryImage}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.featured && (
            <Badge variant="accent" size="sm">
              Featured
            </Badge>
          )}
          {hasDiscount && (
            <Badge variant="danger" size="sm">
              -{discountPercent}%
            </Badge>
          )}
          {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
            <Badge variant="warning" size="sm">
              Only {product.stock_quantity} left
            </Badge>
          )}
          {product.stock_quantity === 0 && (
            <Badge variant="default" size="sm">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs text-slate-700 shadow-sm transition-all hover:bg-white hover:text-rose-500 hover:scale-110"
          aria-label="Toggle wishlist"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>

        {/* Quick Add To Cart Hover Slide-up Button */}
        <div className="absolute inset-x-3 bottom-3 z-10 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={handleQuickAdd}
            disabled={product.stock_quantity === 0}
            className="w-full flex items-center justify-center gap-2 rounded-brand bg-slate-900/95 backdrop-blur-xs py-3 px-4 text-xs font-semibold uppercase tracking-wider text-white shadow-elevated hover:bg-brand-primary active:scale-[0.98] transition-all disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" /> Added to Bag
              </>
            ) : product.stock_quantity === 0 ? (
              "Sold Out"
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> Quick Add
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Info */}
      <div className="flex flex-1 flex-col p-4">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
          {product.brand || "Aura Studio"}
        </div>
        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-1">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{product.short_description}</p>

        {/* Price Row */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-slate-900">
              ${product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                ${product.compare_at_price!.toFixed(2)}
              </span>
            )}
          </div>
          {product.variants && product.variants.length > 1 && (
            <span className="text-[11px] text-slate-400 font-medium">
              {product.variants.length} Options
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
