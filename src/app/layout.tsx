import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { CartProvider } from "@/features/cart/CartContext";
import { WishlistProvider } from "@/features/wishlist/WishlistContext";
import { ConsentProvider } from "@/features/consent/ConsentContext";
import { MiniCart } from "@/components/storefront/MiniCart";
import { ConsentDefaults } from "@/components/storefront/Analytics/ConsentDefaults";
import { getStoreDisplayName, getStoreTagline } from "@/lib/config/store.config";
import {
  absoluteUrl,
  getStoreDescription,
  getVerificationTokens,
  isIndexable,
} from "@/lib/seo/site";

const storeName = getStoreDisplayName();
const storeTagline = getStoreTagline();
const description = getStoreDescription();
const verification = getVerificationTokens();

/**
 * Metadata is derived from configuration, not hard-coded. A client name or
 * domain baked in here would ship to every store built from this template
 * (AGENTS.md sections 9 and 25).
 */
export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: storeTagline ? `${storeName} | ${storeTagline}` : storeName,
    template: `%s | ${storeName}`,
  },
  description,
  applicationName: storeName,
  // Home page canonical; every route that needs its own overrides this.
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: storeName,
    description,
    url: absoluteUrl("/"),
    siteName: storeName,
    locale: process.env.NEXT_PUBLIC_LOCALE || "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: storeName,
    description,
  },
  // Preview and demo deployments are excluded from search entirely, so a
  // staging copy can never compete with the live store.
  robots: isIndexable()
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      }
    : { index: false, follow: false },
  verification: {
    google: verification.google,
    other: {
      ...(verification.bing ? { "msvalidate.01": verification.bing } : {}),
      ...(verification.pinterest ? { "p:domain_verify": verification.pinterest } : {}),
    },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR || "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={process.env.NEXT_PUBLIC_HTML_LANG || "en"} className="scroll-smooth">
      <head>
        {/* Warm up the font connection before the CSS import is parsed. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Must be the first script on the page: see ConsentDefaults. */}
        <ConsentDefaults />
      </head>
      <body className="min-h-screen bg-brand-surface text-slate-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-brand focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <ConsentProvider>
            <CartProvider>
              <WishlistProvider>
                {children}
                <MiniCart />
              </WishlistProvider>
            </CartProvider>
          </ConsentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
