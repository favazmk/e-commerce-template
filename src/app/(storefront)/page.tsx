import React from "react";
import { CategoryService } from "@/services/category.service";
import { ProductService } from "@/services/product.service";
import { SettingsService } from "@/services/settings.service";
import { DynamicSectionRenderer } from "@/components/storefront/sections/DynamicSectionRenderer";

export const revalidate = 60; // ISR revalidation

export default async function HomePage() {
  const sections = await SettingsService.getHomepageSections(true);
  const categories = await CategoryService.getCategories(true);
  const { items: featuredProducts } = await ProductService.getProducts({
    featuredOnly: true,
    limit: 8,
  });

  return (
    <div className="w-full">
      <DynamicSectionRenderer
        sections={sections}
        categories={categories}
        featuredProducts={featuredProducts}
      />
    </div>
  );
}
