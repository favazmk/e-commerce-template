"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  ChevronDown,
  Minus,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useCart } from "@/features/cart/CartContext";
import { useWishlist } from "@/features/wishlist/WishlistContext";
import { Product, ProductVariant } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/storefront/ProductCard";

export function ProductDetailClient({
  product,
  relatedProducts = [],
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const router = useRouter();
  const { addItem, openMiniCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "shipping">("desc");
  const [isAdded, setIsAdded] = useState(false);

  const isFavorite = isInWishlist(product.id);
  const images = product.images && product.images.length > 0
    ? product.images
    : [{ id: "def", product_id: product.id, url: "/placeholder-product.png", display_order: 1, is_primary: true, created_at: "" }];

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentCompareAt = selectedVariant?.compare_at_price || product.compare_at_price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock_quantity;
  const currentSku = selectedVariant ? selectedVariant.sku : product.sku;

  const hasDiscount = currentCompareAt && currentCompareAt > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((currentCompareAt! - currentPrice) / currentCompareAt!) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem(product.id, selectedVariant?.id || null, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product.id, selectedVariant?.id || null, quantity);
    router.push("/checkout");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Breadcrumbs */}
      <nav className="flex text-xs text-slate-500 mb-8 space-x-2">
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-slate-900 transition-colors">
          Products
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-slate-900 transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Left: Product Images Gallery */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[600px] flex-shrink-0">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-brand border-2 transition-all ${
                    selectedImageIndex === idx
                      ? "border-brand-primary shadow-sm"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt={img.alt_text || product.name} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Hero Image */}
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-brand-xl bg-slate-50 shadow-subtle border border-slate-100 flex-1">
            <img
              src={images[selectedImageIndex]?.url || images[0]?.url}
              alt={images[selectedImageIndex]?.alt_text || product.name}
              className="h-full w-full object-cover object-center"
            />
            {hasDiscount && (
              <div className="absolute top-4 left-4">
                <Badge variant="danger" size="md">
                  Save {discountPercent}%
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                {product.brand || "Aura Studio"}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 mt-1">
                {product.name}
              </h1>
              <p className="text-xs text-slate-400 mt-1">SKU: {currentSku}</p>
            </div>

            {/* Price Row */}
            <div className="flex items-baseline gap-3 pb-4 border-b border-slate-100">
              <span className="text-3xl font-bold text-slate-900">
                ${currentPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-lg text-slate-400 line-through">
                  ${currentCompareAt!.toFixed(2)}
                </span>
              )}
              {currentStock > 0 && currentStock <= 5 && (
                <Badge variant="warning" size="sm">
                  Low Stock: Only {currentStock} remaining
                </Badge>
              )}
            </div>

            {/* Short Description */}
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.short_description || product.description}
            </p>

            {/* Variants Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900">
                  Select Option:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const label = Object.values(v.attributes || {}).join(" / ") || v.sku;
                    const isAvailable = v.stock > 0;

                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3.5 py-2.5 rounded-brand border text-xs font-semibold transition-all text-left flex flex-col justify-between ${
                          isSelected
                            ? "border-brand-primary bg-slate-900 text-white shadow-xs"
                            : isAvailable
                            ? "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
                            : "border-slate-200 bg-slate-100 text-slate-400 line-through cursor-not-allowed"
                        }`}
                      >
                        <span>{label}</span>
                        <span className={`text-[10px] mt-1 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          ${v.price.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector & CTAs */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-4">
                {/* Quantity */}
                <div className="flex items-center rounded-brand border border-slate-300 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 text-slate-500 hover:text-slate-900 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    className="p-2.5 text-slate-500 hover:text-slate-900 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  disabled={currentStock === 0}
                  onClick={handleAddToCart}
                  className="flex-1 gap-2 py-3.5 font-semibold text-sm uppercase tracking-wider"
                >
                  {isAdded ? (
                    <>
                      <Check className="h-5 w-5 text-emerald-400" /> Added to Bag
                    </>
                  ) : currentStock === 0 ? (
                    "Sold Out"
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5" /> Add to Shopping Bag
                    </>
                  )}
                </Button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className={`flex h-12 w-12 items-center justify-center rounded-brand border border-slate-200 transition-all hover:bg-slate-50 ${
                    isFavorite ? "text-rose-500 border-rose-200 bg-rose-50/40" : "text-slate-600"
                  }`}
                  aria-label="Save to wishlist"
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? "fill-rose-500" : ""}`} />
                </button>
              </div>

              {/* Buy Now Button */}
              <Button
                type="button"
                variant="accent"
                size="lg"
                disabled={currentStock === 0}
                onClick={handleBuyNow}
                className="w-full py-3.5 text-sm uppercase tracking-wider font-semibold"
              >
                Instant Checkout
              </Button>
            </div>

            {/* Assurance Badges */}
            <div className="grid grid-cols-3 gap-2 pt-6 border-t border-slate-100 text-center">
              <div className="flex flex-col items-center p-2 rounded-brand bg-slate-50">
                <Truck className="h-4 w-4 text-emerald-600 mb-1" />
                <span className="text-[11px] font-semibold text-slate-800">Express Courier</span>
                <span className="text-[10px] text-slate-500">2-4 days</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-brand bg-slate-50">
                <RotateCcw className="h-4 w-4 text-emerald-600 mb-1" />
                <span className="text-[11px] font-semibold text-slate-800">30-Day Returns</span>
                <span className="text-[10px] text-slate-500">Free exchange</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-brand bg-slate-50">
                <ShieldCheck className="h-4 w-4 text-emerald-600 mb-1" />
                <span className="text-[11px] font-semibold text-slate-800">Authenticity</span>
                <span className="text-[10px] text-slate-500">100% Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Accordion Tabs for Specifications & Policies */}
          <div className="mt-10 border-t border-slate-200 pt-6">
            <div className="flex border-b border-slate-200 mb-4 space-x-6 text-xs font-bold uppercase tracking-wider">
              <button
                onClick={() => setActiveTab("desc")}
                className={`pb-3 transition-colors ${
                  activeTab === "desc"
                    ? "border-b-2 border-slate-900 text-slate-900 font-bold"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                Description & Drape
              </button>
              <button
                onClick={() => setActiveTab("specs")}
                className={`pb-3 transition-colors ${
                  activeTab === "specs"
                    ? "border-b-2 border-slate-900 text-slate-900 font-bold"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                Material & Origin
              </button>
              <button
                onClick={() => setActiveTab("shipping")}
                className={`pb-3 transition-colors ${
                  activeTab === "shipping"
                    ? "border-b-2 border-slate-900 text-slate-900 font-bold"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                Shipping & Returns
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed min-h-[80px]">
              {activeTab === "desc" && (
                <p>{product.description || "Crafted to the highest standard of bespoke luxury."}</p>
              )}
              {activeTab === "specs" && (
                <ul className="list-disc pl-4 space-y-1">
                  <li>Brand: {product.brand || "Aura Studio"}</li>
                  <li>SKU: {currentSku}</li>
                  <li>Tags: {product.tags?.join(", ") || "Artisanal, Heritage"}</li>
                  <li>Care: Professional dry clean only. Store in protective cotton garment bag.</li>
                </ul>
              )}
              {activeTab === "shipping" && (
                <p>
                  Complimentary tracked express delivery on all orders over $200. Orders placed
                  before 2 PM EST ship same-day. 30-day effortless returns policy.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Carousel / Grid */}
      {relatedProducts.length > 0 && (
        <div className="mt-24 border-t border-slate-100 pt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold font-heading text-slate-900">
              You May Also Appreciate
            </h2>
            <Link
              href="/products"
              className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
            >
              Explore Collection <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} variant="luxury" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
