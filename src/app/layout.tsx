import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { CartProvider } from "@/features/cart/CartContext";
import { WishlistProvider } from "@/features/wishlist/WishlistContext";
import { MiniCart } from "@/components/storefront/MiniCart";

export const metadata: Metadata = {
  title: {
    default: "AURA LUXURY | Artisanal Goods & Timeless Essentials",
    template: "%s | AURA LUXURY",
  },
  description:
    "Curated collection of bespoke apparel, handcrafted footwear, and minimalist designer accessories.",
  openGraph: {
    title: "AURA LUXURY | Artisanal Goods & Timeless Essentials",
    description: "Curated collection of bespoke apparel, handcrafted footwear, and minimalist designer accessories.",
    url: "https://auraluxury.com",
    siteName: "AURA LUXURY",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Aura Luxury Storefront",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-brand-surface text-slate-900 antialiased">
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
