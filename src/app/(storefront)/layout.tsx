import React from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { Analytics } from "@/components/storefront/Analytics";
import { CategoryService } from "@/services/category.service";
import { SettingsService } from "@/services/settings.service";
import { StoreFeaturesProvider } from "@/features/settings/StoreFeaturesContext";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Navigation reflects the real catalog rather than hard-coded slugs.
  const categories = await CategoryService.getCategories(true);
  const navCategories = categories.map((c) => ({ name: c.name, slug: c.slug }));

  // Feature switches are read once here and handed to the tree, so a client
  // component can hide a feature without fetching its own copy.
  const features = await SettingsService.getStoreFeatures();

  return (
    <StoreFeaturesProvider features={features}>
      <div className="flex min-h-screen flex-col justify-between">
        <Header categories={navCategories} />
        <main id="main-content" className="flex-1">{children}</main>
        <Footer categories={navCategories} />
        <Analytics />
      </div>
    </StoreFeaturesProvider>
  );
}
