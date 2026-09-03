import React from "react";
import type { Metadata } from "next";
import { CategoryService } from "@/services/category.service";
import { ProductService } from "@/services/product.service";
import { SettingsService } from "@/services/settings.service";
import { RecommendationService } from "@/services/recommendation.service";
import { DynamicSectionRenderer } from "@/components/storefront/sections/DynamicSectionRenderer";
import { ProductRail } from "@/components/storefront/ProductRail";
import { RecentlyViewed } from "@/components/storefront/RecentlyViewed";
import { canonicalUrl } from "@/lib/seo/site";

export const revalidate = 60; // ISR revalidation

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/") },
};

export default async function HomePage() {
  // Independent reads, so they run together rather than in series.
  const [sections, categories, featured, bestSellers] = await Promise.all([
    SettingsService.getHomepageSections(true),
    CategoryService.getCategories(true),
    ProductService.getProducts({ featuredOnly: true, limit: 8 }),
    RecommendationService.getBestSellers({ limit: 8 }),
  ]);

  return (
    <div className="w-full">
      <DynamicSectionRenderer
        sections={sections}
        categories={categories}
        featuredProducts={featured.items}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Best sellers are real: ranked by units actually sold, falling back to
            the merchant's featured picks only when there are no sales yet. */}
        <ProductRail
          title="Best sellers"
          subtitle="What other shoppers are buying most"
          products={bestSellers}
          href="/products?sort=featured"
          hrefLabel="Shop all"
        />

        {/* Only renders for a returning visitor with browsing history. */}
        <RecentlyViewed />
      </div>
    </div>
  );
}
