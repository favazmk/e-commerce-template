"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/features/cart/CartContext";
import { useWishlist } from "@/features/wishlist/WishlistContext";
import { useTheme } from "@/theme/ThemeProvider";
import { SearchModal } from "../SearchModal";

export function Header() {
  const { theme } = useTheme();
  const { totalItemCount, openMiniCart } = useCart();
  const { totalWishlistCount } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
        {/* Announcement Bar */}
        {theme.styling.announcementBar.enabled && (
          <div className="bg-brand-primary text-white text-xs py-2 px-4 text-center font-medium tracking-wider">
            <Link
              href={theme.styling.announcementBar.link || "/products"}
              className="hover:underline transition-all"
            >
              {theme.styling.announcementBar.text}
            </Link>
          </div>
        )}

        {/* Main Nav Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-700 hover:text-slate-900 focus:outline-none"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Brand Logo */}
            <div className="flex items-center">
              <Link href="/" className="group flex flex-col">
                <span className="text-2xl font-bold tracking-widest font-heading text-slate-900 group-hover:text-brand-primary transition-colors">
                  {theme.brand.name}
                </span>
                {theme.brand.tagline && (
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-medium">
                    {theme.brand.tagline}
                  </span>
                )}
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link
                href="/products"
                className="text-sm font-medium text-slate-700 hover:text-brand-primary tracking-wide transition-colors"
              >
                All Collections
              </Link>
              <Link
                href="/categories/luxury-apparel"
                className="text-sm font-medium text-slate-700 hover:text-brand-primary tracking-wide transition-colors"
              >
                Apparel
              </Link>
              <Link
                href="/categories/artisanal-footwear"
                className="text-sm font-medium text-slate-700 hover:text-brand-primary tracking-wide transition-colors"
              >
                Footwear
              </Link>
              <Link
                href="/categories/designer-accessories"
                className="text-sm font-medium text-slate-700 hover:text-brand-primary tracking-wide transition-colors"
              >
                Accessories
              </Link>
              <Link
                href="/categories/home-and-living"
                className="text-sm font-medium text-slate-700 hover:text-brand-primary tracking-wide transition-colors"
              >
                Home & Living
              </Link>
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              {/* Search Icon */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-slate-700 hover:text-brand-primary transition-colors"
                aria-label="Search catalog"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative p-2 text-slate-700 hover:text-brand-primary transition-colors"
                aria-label="View wishlist"
              >
                <Heart className="h-5 w-5" />
                {totalWishlistCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {totalWishlistCount}
                  </span>
                )}
              </Link>

              {/* Customer Account */}
              <Link
                href="/account"
                className="p-2 text-slate-700 hover:text-brand-primary transition-colors"
                aria-label="Customer account"
              >
                <User className="h-5 w-5" />
              </Link>

              {/* Mini Cart Button */}
              <button
                type="button"
                onClick={openMiniCart}
                className="relative flex items-center p-2 text-slate-900 hover:text-brand-primary transition-colors"
                aria-label="Open cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {totalItemCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
                    {totalItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-6 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-900 py-2"
            >
              All Products
            </Link>
            <Link
              href="/categories/luxury-apparel"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-700 py-2"
            >
              Apparel
            </Link>
            <Link
              href="/categories/artisanal-footwear"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-700 py-2"
            >
              Footwear
            </Link>
            <Link
              href="/categories/designer-accessories"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-700 py-2"
            >
              Accessories
            </Link>
            <Link
              href="/categories/home-and-living"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-700 py-2"
            >
              Home & Living
            </Link>
            <div className="pt-4 border-t border-slate-100">
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xs uppercase tracking-widest text-emerald-600 font-bold block py-2"
              >
                Admin Dashboard →
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
