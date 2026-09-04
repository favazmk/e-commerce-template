import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductService } from "@/services/product.service";
import { RecommendationService } from "@/services/recommendation.service";
import { ReviewService } from "@/services/review.service";
import { StorefrontService } from "@/services/storefront.service";
import { canonicalUrl } from "@/lib/seo/site";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductRail } from "@/components/storefront/ProductRail";
import { FrequentlyBoughtTogether } from "@/components/storefront/FrequentlyBoughtTogether";
import { RecentlyViewed } from "@/components/storefront/RecentlyViewed";
import { ProductReviews } from "@/components/storefront/ProductReviews";
import { ProductDetailClient } from "./ProductDetailClient";

export interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product =
    (await ProductService.getProductBySlug(slug)) || (await ProductService.getProductById(slug));

  if (!product) {
    return { title: "Product not found", robots: { index: false, follow: false } };
  }

  const title = product.seo_title || product.name;
  const description =
    product.seo_description || product.short_description || product.description?.slice(0, 160);
  const primaryImage = product.images?.[0]?.url;
  const url = canonicalUrl(`/products/${product.slug}`);

  return {
    title,
    description,
    // Without a canonical, the same product reachable via a query string or a
    // trailing slash competes with itself in the index.
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: primaryImage
        ? [{ url: primaryImage, width: 1200, height: 1200, alt: product.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: primaryImage ? [primaryImage] : undefined,
    },
    // A draft or archived product still renders for a direct link but must not
    // be indexed as a live listing.
    robots:
      product.status === "active"
        ? undefined
        : { index: false, follow: false },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product =
    (await ProductService.getProductBySlug(slug)) || (await ProductService.getProductById(slug));

  if (!product) notFound();

  // Fetched in parallel: each is independent, and the page should not pay for
  // four sequential round trips before its first byte.
  const [stats, commerce, bundle, similar, reviews] = await Promise.all([
    RecommendationService.getStats(product.id),
    StorefrontService.getCommerceInfo(),
    RecommendationService.getFrequentlyBoughtTogether(product.id, { limit: 3 }),
    RecommendationService.getSimilarProducts(product.id, { limit: 4 }),
    ReviewService.getPublicReviews(product.id),
  ]);

  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    ...(product.category
      ? [{ name: product.category.name, path: `/categories/${product.category.slug}` }]
      : []),
    { name: product.name, path: `/products/${product.slug}` },
  ];

  return (
    <>
      <JsonLd
        data={[
          productJsonLd({
            product,
            reviews,
            averageRating: stats?.average_rating ?? null,
            reviewCount: stats?.review_count ?? 0,
          }),
          breadcrumbJsonLd(breadcrumbs),
        ]}
      />

      <ProductDetailClient product={product} stats={stats} commerce={commerce} />

      {/*
        Section order is load-bearing, not cosmetic.

        Scroll-depth data on product pages is consistent across every large
        retailer: attention falls off sharply below the fold, and reviews are
        sought deliberately by a minority who scroll for them. Putting
        recommendations after a long review list therefore buries the highest
        commercial-intent modules on the page — which is exactly what was
        happening here, and why they read as missing.

        Recommendations first, reviews second, recently viewed last.
      */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {bundle.length > 0 && (
          <div className="border-t border-brand-border pt-10">
            <FrequentlyBoughtTogether anchor={product} companions={bundle} />
          </div>
        )}

        {similar.length > 0 && (
          <div className="border-t border-brand-border">
            <ProductRail
              title="Similar products"
              subtitle="From the same collection and price range"
              products={similar}
              href="/products"
              hrefLabel="Browse all"
            />
          </div>
        )}

        <div id="reviews" className="scroll-mt-24 border-t border-brand-border pt-10">
          <ProductReviews productId={product.id} productName={product.name} />
        </div>

        <div className="border-t border-brand-border">
          <RecentlyViewed excludeIds={[product.id]} />
        </div>
      </div>
    </>
  );
}
