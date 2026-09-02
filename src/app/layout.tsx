import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { CartProvider } from "@/features/cart/CartContext";
import { WishlistProvider } from "@/features/wishlist/WishlistContext";
import { MiniCart } from "@/components/storefront/MiniCart";
import { getSiteUrl, getStoreDisplayName, getStoreTagline } from "@/lib/config/store.config";

const storeName = getStoreDisplayName();
const storeTagline = getStoreTagline();
const siteUrl = getSiteUrl();
const description =
  process.env.NEXT_PUBLIC_STORE_DESCRIPTION ||
  storeTagline ||
  `Shop the latest products at ${storeName}.`;

/**
 * Metadata is derived from configuration, not hard-coded. A client name or
 * domain baked in here would ship to every store built from this template
 * (AGENTS.md sections 9 and 25).
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: storeTagline ? `${storeName} | ${storeTagline}` : storeName,
    template: `%s | ${storeName}`,
  },
  description,
  openGraph: {
    title: storeName,
    description,
    url: siteUrl,
    siteName: storeName,
    locale: process.env.NEXT_PUBLIC_LOCALE || "en_US",
    type: "website",
  },
  robots: {
    index: process.env.NEXT_PUBLIC_APP_MODE !== "demo",
    follow: process.env.NEXT_PUBLIC_APP_MODE !== "demo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={process.env.NEXT_PUBLIC_HTML_LANG || "en"} className="scroll-smooth">
      <body className="min-h-screen bg-brand-surface text-slate-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-brand focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
              <MiniCart />
            </WishlistProvider>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
