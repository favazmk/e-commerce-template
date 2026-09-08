"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/features/cart/CartContext";
import { useWishlist } from "@/features/wishlist/WishlistContext";
import { useStoreFeatures } from "@/features/settings/StoreFeaturesContext";
import { useTheme } from "@/theme/ThemeProvider";
import { SearchModal } from "../SearchModal";

export interface HeaderProps {
  /**
   * Storefront categories resolved on the server. Used as the default
   * navigation so a new client store has a populated menu without editing
   * code; an explicit `theme.navigation` overrides it.
   */
  categories?: { name: string; slug: string }[];
}

export function Header({ categories = [] }: HeaderProps) {
  const { theme } = useTheme();
  const { totalItemCount, openMiniCart } = useCart();
  const { totalWishlistCount } = useWishlist();
  const { wishlist: wishlistEnabled } = useStoreFeatures();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer on navigation, otherwise it stays open over the new page.
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Navigation is data, not a component constant: category slugs are
  // client-specific (AGENTS.md sections 2 and 9). An explicitly configured
  // theme.navigation wins; otherwise the live category list is used.
  const configured = theme.navigation ?? [];
  const navigation =
    configured.length > 1
      ? configured
      : [
          ...configured,
          ...categories.map((c) => ({ label: c.name, href: `/products?category=${c.slug}` })),
        ];

  return (
    <>
      <header
        className={`${
          theme.styling.headerSticky ? "sticky top-0" : "relative"
        } z-40 w-full bg-white/95 backdrop-blur-md border-b border-brand-border transition-all`}
      >
        {/* Announcement Bar */}
        {theme.styling.announcementBar.enabled && theme.styling.announcementBar.text && (
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 h-16 sm:h-20">
            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="-ml-1 p-2 text-brand-muted-ink hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-brand"
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Brand Logo */}
            <div className="flex items-center min-w-0">
              <Link href="/" className="group flex flex-col min-w-0">
                <span className="truncate text-lg sm:text-2xl font-bold tracking-widest font-wordmark text-brand-ink group-hover:text-brand-primary transition-colors">
                  {theme.brand.wordmark?.primary ?? theme.brand.name}
                </span>
                {theme.brand.wordmark?.secondary ? (
                  <span
                    className="hidden sm:block truncate text-[10px] uppercase text-brand-muted-ink font-medium"
                    style={{ letterSpacing: theme.brand.wordmark.secondaryTracking ?? "0.3em" }}
                  >
                    {theme.brand.wordmark.secondary}
                  </span>
                ) : (
                  theme.brand.tagline && (
                    <span className="hidden sm:block truncate text-[9px] uppercase tracking-widest text-brand-faint-ink font-medium">
                      {theme.brand.tagline}
                    </span>
                  )
                )}
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navigation.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-brand-muted-ink hover:text-brand-primary tracking-wide transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center gap-0.5 sm:gap-3 flex-shrink-0">
              {/* Search Icon */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-brand-muted-ink hover:text-brand-primary transition-colors rounded-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label="Search catalog"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist — secondary on the narrowest screens, and hidden
                  entirely when the feature is switched off in the admin panel. */}
              {wishlistEnabled && (
              <Link
                href="/wishlist"
                className="relative hidden sm:inline-flex p-2 text-brand-muted-ink hover:text-brand-primary transition-colors rounded-brand"
                aria-label={`View wishlist, ${totalWishlistCount} items`}
              >
                <Heart className="h-5 w-5" />
                {totalWishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
                    {totalWishlistCount}
                  </span>
                )}
              </Link>
              )}

              {/* Customer Account */}
              <Link
                href="/account"
                className="p-2 text-brand-muted-ink hover:text-brand-primary transition-colors rounded-brand"
                aria-label="Customer account"
              >
                <User className="h-5 w-5" />
              </Link>

              {/* Mini Cart Button */}
              <button
                type="button"
                onClick={openMiniCart}
                className="relative flex items-center p-2 text-brand-ink hover:text-brand-primary transition-colors rounded-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label={`Open cart, ${totalItemCount} items`}
              >
                <ShoppingBag className="h-5 w-5" />
                {totalItemCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
                    {totalItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <nav
            id="mobile-navigation"
            className="lg:hidden border-t border-brand-border bg-white px-6 py-4 space-y-1 max-h-[70vh] overflow-y-auto animate-in slide-in-from-top-4 duration-200"
          >
            {navigation.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-base font-medium text-brand-muted-ink py-3"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium text-brand-muted-ink py-3 sm:hidden"
            >
              Wishlist{totalWishlistCount > 0 ? ` (${totalWishlistCount})` : ""}
            </Link>
          </nav>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
