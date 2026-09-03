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

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {bundle.length > 0 && (
          <div className="border-t border-slate-100 pt-10">
            <FrequentlyBoughtTogether anchor={product} companions={bundle} />
          </div>
        )}

        {similar.length > 0 && (
          <div className="border-t border-slate-100">
            <ProductRail
              title="You may also like"
              subtitle="Picked from the same collection and price range"
              products={similar}
              href="/products"
              hrefLabel="Browse all"
            />
          </div>
        )}

        <div className="border-t border-slate-100">
          <RecentlyViewed excludeIds={[product.id]} />
        </div>
      </div>
    </>
  );
}
